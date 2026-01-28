import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserOrganization } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { buildAssistantSystemPrompt } from "@/lib/assistant/system-prompt";
import { isSubscriptionActive } from "@/lib/subscription-helpers";
import {
  assistantToolDefinitions,
  executeAssistantTool,
  isDestructiveTool,
  type AssistantToolName,
} from "@/lib/assistant/tools";
import type {
  AssistantChatItem,
  AssistantPendingAction,
  AssistantStreamEvent,
} from "@/types/assistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const messageSchema = z.object({
  id: z.string(),
  type: z.literal("message"),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  createdAt: z.string().optional(),
});

const toolSchema = z.object({
  id: z.string(),
  type: z.literal("tool"),
  toolCallId: z.string(),
  name: z.string(),
  args: z.record(z.string(), z.any()).optional().nullable(),
  status: z.enum([
    "pending",
    "running",
    "success",
    "error",
    "requires_confirmation",
  ]),
  result: z.any().optional(),
});

const pendingActionSchema = z.object({
  tool: z.string(),
  args: z.record(z.string(), z.any()),
  summary: z.string().optional(),
  toolCallId: z.string().optional(),
});

const requestSchema = z.object({
  workspaceId: z.string().min(1),
  messages: z.array(z.discriminatedUnion("type", [messageSchema, toolSchema])),
  conversationId: z.string().optional().nullable(),
  pendingAction: pendingActionSchema.optional().nullable(),
});

const createServerId = () => crypto.randomUUID();

const tokenize = (content: string) =>
  content.split(/(\s+)/).filter((token) => token.length > 0);

const isConfirmation = (content: string) =>
  /\bconfirm\b/i.test(content) || /\byes\b/i.test(content);

const isCancellation = (content: string) =>
  /\bcancel\b/i.test(content) ||
  /\bnever mind\b/i.test(content) ||
  /\bno\b/i.test(content);

const extractToolName = (name: string): AssistantToolName | null => {
  const allowed = new Set<AssistantToolName>([
    "inventory_searchProducts",
    "inventory_getProduct",
    "inventory_addProduct",
    "inventory_updateProduct",
    "inventory_removeProduct",
    "inventory_adjustStock",
    "inventory_getLowStock",
    "inventory_getExpiring",
    "inventory_getSummaryKPIs",
  ]);
  return allowed.has(name as AssistantToolName)
    ? (name as AssistantToolName)
    : null;
};

type AssistantModelMessage = {
  role: string;
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
};

const callOpenAI = async (params: {
  model: string;
  messages: AssistantModelMessage[];
  tools?: typeof assistantToolDefinitions;
  toolChoice?: "auto" | "none";
}) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const apiUrl =
    process.env.OPENAI_API_BASE_URL ??
    "https://api.openai.com/v1/chat/completions";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      tools: params.tools,
      tool_choice: params.toolChoice ?? "auto",
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "OpenAI request failed");
  }

  return response.json();
};

const prismaAssistant = prisma as typeof prisma & {
  assistantToolAudit?: { create: (args: any) => Promise<any> };
  assistantConversation?: {
    create: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    upsert: (args: any) => Promise<any>;
  };
};

const logToolAudit = async (params: {
  organizationId: string;
  userId?: string | null;
  tool: string;
  args: unknown;
  status: string;
  error?: string | null;
  conversationId?: string | null;
}) => {
  if (!prismaAssistant.assistantToolAudit?.create) return;
  try {
    await prismaAssistant.assistantToolAudit.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId ?? null,
        tool: params.tool,
        args: params.args ?? {},
        status: params.status,
        error: params.error ?? null,
        conversationId: params.conversationId ?? null,
      },
    });
  } catch (error) {
    console.warn("Assistant audit log failed", error);
  }
};

const persistConversation = async (params: {
  conversationId: string;
  organizationId: string;
  messages: AssistantChatItem[];
}) => {
  if (!prismaAssistant.assistantConversation?.upsert) return;
  try {
    if (prismaAssistant.assistantConversation.findUnique) {
      const existing = await prismaAssistant.assistantConversation.findUnique({
        where: { id: params.conversationId },
      });
      if (existing && existing.organizationId !== params.organizationId) {
        return;
      }
    }
    await prismaAssistant.assistantConversation.upsert({
      where: { id: params.conversationId },
      create: {
        id: params.conversationId,
        organizationId: params.organizationId,
        messages: params.messages,
      },
      update: {
        messages: params.messages,
      },
    });
  } catch (error) {
    console.warn("Assistant conversation persistence failed", error);
  }
};

const runFallback = async (params: {
  content: string;
  context: { organizationId: string; userId?: string | null };
}) => {
  const normalized = params.content.toLowerCase();

  if (normalized.includes("low stock")) {
    return {
      tool: "inventory_getLowStock" as AssistantToolName,
      args: {},
      response: "Here are the low stock items.",
    };
  }

  if (normalized.includes("expiring")) {
    const daysMatch = normalized.match(/(30|60|90)/);
    const days = daysMatch ? Number(daysMatch[1]) : 30;
    return {
      tool: "inventory_getExpiring" as AssistantToolName,
      args: { days },
      response: `Here are items expiring in the next ${days} days.`,
    };
  }

  if (normalized.includes("kpi") || normalized.includes("summary")) {
    return {
      tool: "inventory_getSummaryKPIs" as AssistantToolName,
      args: {},
      response: "Here is your inventory KPI snapshot.",
    };
  }

  if (normalized.startsWith("add ")) {
    const match = normalized.match(/add\s+(\d+)\s+(.+)/i);
    if (match) {
      const quantityOnHand = Number(match[1]);
      let name = match[2];
      const unitMatch = name.match(
        /^(boxes|box|cases|case|packs|pack|units|unit|bottles|bottle)\s+of\s+(.+)/i
      );
      if (unitMatch) {
        name = unitMatch[2];
      }
      return {
        tool: "inventory_addProduct" as AssistantToolName,
        args: {
          name: name.trim(),
          quantityOnHand,
          unit: unitMatch ? unitMatch[1] : undefined,
        },
        response: `Adding ${quantityOnHand} ${name}.`,
      };
    }
  }

  if (normalized.includes("delete") || normalized.includes("remove")) {
    const match = normalized.match(/(?:delete|remove)\s+(.+)/i);
    if (match) {
      return {
        tool: "inventory_searchProducts" as AssistantToolName,
        args: { query: match[1].trim(), limit: 1 },
        response: "I can remove that item once you confirm.",
        requiresConfirmation: true,
      };
    }
  }

  return {
    response:
      "I can help with inventory questions, low stock checks, and safe updates. Try asking about low stock or adding a product.",
  };
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid request", errors: parsed.error.issues },
      { status: 400 }
    );
  }

  const { workspaceId, messages: rawMessages, conversationId, pendingAction } =
    parsed.data;
  const messages = rawMessages as AssistantChatItem[];
  const { error, organization, user } = await getUserOrganization();

  if (error || !organization) {
    return (
      error ?? NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    );
  }

  if (organization.id !== workspaceId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const allowedPlans = new Set(["starter", "professional", "enterprise", "pro"]);
  const plan = organization.subscription?.plan?.toLowerCase() ?? "trial";
  const hasAssistantAccess =
    !!organization.subscription &&
    isSubscriptionActive(organization.subscription) &&
    allowedPlans.has(plan);

  if (!hasAssistantAccess) {
    return NextResponse.json(
      {
        message:
          "AI Assistant requires an active Starter, Professional, or Enterprise subscription.",
      },
      { status: 403 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: AssistantStreamEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

      try {
        const resolvedConversationId = conversationId ?? createServerId();
        send({ type: "conversation", conversationId: resolvedConversationId });

        const lastUserMessage = [...messages]
          .reverse()
          .find(
            (
              item
            ): item is Extract<AssistantChatItem, { type: "message" }> =>
              item.type === "message"
          );

        if (!lastUserMessage || lastUserMessage.role !== "user") {
          send({ type: "error", error: "No user message provided." });
          send({ type: "done" });
          controller.close();
          return;
        }

        const systemPrompt = buildAssistantSystemPrompt({
          workspaceId: organization.id,
          workspaceName: organization.name,
        });

        const baseMessages: AssistantModelMessage[] = [
          { role: "system", content: systemPrompt },
          ...messages
            .filter(
              (item): item is Extract<AssistantChatItem, { type: "message" }> =>
                item.type === "message"
            )
            .map((item) => ({ role: item.role, content: item.content })),
        ];

        const appendConversation = async (additional: AssistantChatItem[]) => {
          await persistConversation({
            conversationId: resolvedConversationId,
            organizationId: organization.id,
            messages: [...messages, ...additional],
          });
        };

        const streamAssistantMessage = (content: string) => {
          const messageId = createServerId();
          send({ type: "message_start", messageId, role: "assistant" });
          for (const token of tokenize(content)) {
            send({ type: "token", messageId, token });
          }
          send({ type: "message_end", messageId });
          return messageId;
        };

        const executeConfirmedTool = async (action: AssistantPendingAction) => {
          const toolName = extractToolName(action.tool);
          if (!toolName) {
            throw new Error("Unknown tool requested.");
          }

          const toolCallId = action.toolCallId ?? createServerId();
          send({
            type: "tool_call",
            toolCallId,
            name: toolName,
            args: action.args,
            status: "running",
          });

          const result = await executeAssistantTool(toolName, action.args, {
            organization,
            user,
          });

          await logToolAudit({
            organizationId: organization.id,
            userId: user?.id ?? null,
            tool: toolName,
            args: action.args,
            status: result.status,
            error: result.error ?? null,
            conversationId: resolvedConversationId,
          });

          send({
            type: "tool_result",
            toolCallId,
            name: toolName,
            status: result.status === "success" ? "success" : "error",
            result: result.result ?? { error: result.error },
          });

          return { toolCallId, toolName, result };
        };

        if (pendingAction && pendingAction.tool) {
          if (isConfirmation(lastUserMessage.content)) {
            try {
              const toolResult = await executeConfirmedTool(pendingAction);
              const responseText =
                toolResult.result.status === "success"
                  ? "Confirmed. The inventory has been updated."
                  : `Unable to complete the request: ${toolResult.result.error}`;

              const messageId = streamAssistantMessage(responseText);
              const toolItem: AssistantChatItem = {
                id: toolResult.toolCallId,
                type: "tool",
                toolCallId: toolResult.toolCallId,
                name: toolResult.toolName,
                args: pendingAction.args,
                status:
                  toolResult.result.status === "success" ? "success" : "error",
                result: toolResult.result.result ?? {
                  error: toolResult.result.error,
                },
              };

              await appendConversation([
                toolItem,
                {
                  id: messageId,
                  type: "message",
                  role: "assistant",
                  content: responseText,
                },
              ]);

              send({ type: "done" });
              controller.close();
              return;
            } catch (error) {
              send({
                type: "error",
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to execute the pending action.",
              });
              send({ type: "done" });
              controller.close();
              return;
            }
          }

          if (isCancellation(lastUserMessage.content)) {
            const responseText =
              "Canceled. Let me know if you'd like to do something else.";
            const messageId = streamAssistantMessage(responseText);

            await appendConversation([
              {
                id: messageId,
                type: "message",
                role: "assistant",
                content: responseText,
              },
            ]);

            send({ type: "done" });
            controller.close();
            return;
          }

          const responseText =
            'You have a pending inventory change. Reply with "confirm" to proceed or "cancel" to stop.';
          const messageId = streamAssistantMessage(responseText);

          await appendConversation([
            {
              id: messageId,
              type: "message",
              role: "assistant",
              content: responseText,
            },
          ]);

          send({ type: "done" });
          controller.close();
          return;
        }

        const model = process.env.OPENAI_ASSISTANT_MODEL ?? "gpt-4o-mini";
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
          const fallback = await runFallback({
            content: lastUserMessage.content,
            context: { organizationId: organization.id, userId: user?.id },
          });

          if (fallback.tool) {
            const toolCallId = createServerId();

            if (
              fallback.requiresConfirmation &&
              fallback.tool === "inventory_searchProducts"
            ) {
              send({
                type: "tool_call",
                toolCallId,
                name: fallback.tool,
                args: fallback.args ?? {},
                status: "running",
              });

              const searchResult = await executeAssistantTool(
                fallback.tool,
                fallback.args ?? {},
                { organization, user }
              );

              await logToolAudit({
                organizationId: organization.id,
                userId: user?.id ?? null,
                tool: fallback.tool,
                args: fallback.args ?? {},
                status: searchResult.status,
                error: searchResult.error ?? null,
                conversationId: resolvedConversationId,
              });

              send({
                type: "tool_result",
                toolCallId,
                name: fallback.tool,
                status: searchResult.status === "success" ? "success" : "error",
                result: searchResult.result ?? { error: searchResult.error },
              });
              const searchToolItem: AssistantChatItem = {
                id: toolCallId,
                type: "tool",
                toolCallId,
                name: fallback.tool,
                args: fallback.args ?? {},
                status: searchResult.status === "success" ? "success" : "error",
                result: searchResult.result ?? { error: searchResult.error },
              };

              const firstMatch = (searchResult.result as any)?.items?.[0];
              if (!firstMatch) {
                const messageId = streamAssistantMessage(
                  "I couldn't find a matching item to delete. Try a different name or SKU."
                );
                await appendConversation([
                  searchToolItem,
                  {
                    id: messageId,
                    type: "message",
                    role: "assistant",
                    content:
                      "I couldn't find a matching item to delete. Try a different name or SKU.",
                  },
                ]);
                send({ type: "done" });
                controller.close();
                return;
              }

              const removeToolCallId = createServerId();
              send({
                type: "tool_call",
                toolCallId: removeToolCallId,
                name: "inventory_removeProduct",
                args: { productId: firstMatch.id },
                status: "requires_confirmation",
                pendingAction: {
                  tool: "inventory_removeProduct",
                  args: { productId: firstMatch.id },
                  toolCallId: removeToolCallId,
                  summary: `Delete ${firstMatch.name}`,
                },
              });

              const removeToolItem: AssistantChatItem = {
                id: removeToolCallId,
                type: "tool",
                toolCallId: removeToolCallId,
                name: "inventory_removeProduct",
                args: { productId: firstMatch.id },
                status: "requires_confirmation",
              };

              await logToolAudit({
                organizationId: organization.id,
                userId: user?.id ?? null,
                tool: "inventory_removeProduct",
                args: { productId: firstMatch.id },
                status: "requires_confirmation",
                conversationId: resolvedConversationId,
              });

              const messageId = streamAssistantMessage(
                `I can delete \"${firstMatch.name}\" (${firstMatch.id}). Reply \"confirm delete\" to proceed.`
              );
              await appendConversation([
                searchToolItem,
                removeToolItem,
                {
                  id: messageId,
                  type: "message",
                  role: "assistant",
                  content: `I can delete \"${firstMatch.name}\" (${firstMatch.id}). Reply \"confirm delete\" to proceed.`,
                },
              ]);
              send({ type: "done" });
              controller.close();
              return;
            }

            send({
              type: "tool_call",
              toolCallId,
              name: fallback.tool,
              args: fallback.args ?? {},
              status: "running",
            });

            const toolResult = await executeAssistantTool(
              fallback.tool,
              fallback.args ?? {},
              {
                organization,
                user,
              }
            );

            await logToolAudit({
              organizationId: organization.id,
              userId: user?.id ?? null,
              tool: fallback.tool,
              args: fallback.args ?? {},
              status: toolResult.status,
              error: toolResult.error ?? null,
              conversationId: resolvedConversationId,
            });

            send({
              type: "tool_result",
              toolCallId,
              name: fallback.tool,
              status: toolResult.status === "success" ? "success" : "error",
              result: toolResult.result ?? { error: toolResult.error },
            });

            const messageId = streamAssistantMessage(fallback.response);
            await appendConversation([
              {
                id: toolCallId,
                type: "tool",
                toolCallId,
                name: fallback.tool,
                args: fallback.args ?? {},
                status: toolResult.status === "success" ? "success" : "error",
                result: toolResult.result ?? { error: toolResult.error },
              },
              {
                id: messageId,
                type: "message",
                role: "assistant",
                content: fallback.response,
              },
            ]);
            send({ type: "done" });
            controller.close();
            return;
          }

          const fallbackMessage = streamAssistantMessage(fallback.response);
          await appendConversation([
            {
              id: fallbackMessage,
              type: "message",
              role: "assistant",
              content: fallback.response,
            },
          ]);
          send({ type: "done" });
          controller.close();
          return;
        }

        let conversationMessages: AssistantModelMessage[] = baseMessages;
        const newConversationItems: AssistantChatItem[] = [];
        let finalResponse = "";
        const maxToolLoops = 2;

        for (let iteration = 0; iteration < maxToolLoops; iteration += 1) {
          const response = await callOpenAI({
            model,
            messages: conversationMessages,
            tools: assistantToolDefinitions,
            toolChoice: "auto",
          });

          const message = response?.choices?.[0]?.message;
          const toolCalls = message?.tool_calls ?? [];

          if (toolCalls.length === 0) {
            finalResponse = message?.content ?? "";
            break;
          }

          const assistantToolCalls = toolCalls.map((toolCall: any) => ({
            id: toolCall.id ?? createServerId(),
            type: "function",
            function: toolCall.function,
          }));

          const toolMessageItems: {
            role: string;
            tool_call_id: string;
            content: string;
          }[] = [];

          for (const toolCall of assistantToolCalls) {
            const toolName = extractToolName(toolCall.function.name);
            if (!toolName) {
              continue;
            }

            let parsedArgs: Record<string, unknown> = {};
            try {
              parsedArgs = toolCall.function.arguments
                ? JSON.parse(toolCall.function.arguments)
                : {};
            } catch {
              parsedArgs = {};
            }

            if (isDestructiveTool(toolName)) {
              const pending: AssistantPendingAction = {
                tool: toolName,
                args: parsedArgs,
                toolCallId: toolCall.id,
              };

              send({
                type: "tool_call",
                toolCallId: toolCall.id,
                name: toolName,
                args: parsedArgs,
                status: "requires_confirmation",
                pendingAction: pending,
              });

              await logToolAudit({
                organizationId: organization.id,
                userId: user?.id ?? null,
                tool: toolName,
                args: parsedArgs,
                status: "requires_confirmation",
                conversationId: resolvedConversationId,
              });

              const confirmationMessage =
                'I can complete that deletion once you confirm. Reply "confirm delete" to proceed.';
              const messageId = streamAssistantMessage(confirmationMessage);

              await appendConversation([
                {
                  id: toolCall.id,
                  type: "tool",
                  toolCallId: toolCall.id,
                  name: toolName,
                  args: parsedArgs,
                  status: "requires_confirmation",
                },
                {
                  id: messageId,
                  type: "message",
                  role: "assistant",
                  content: confirmationMessage,
                },
              ]);

              send({ type: "done" });
              controller.close();
              return;
            }

            send({
              type: "tool_call",
              toolCallId: toolCall.id,
              name: toolName,
              args: parsedArgs,
              status: "running",
            });

            const result = await executeAssistantTool(toolName, parsedArgs, {
              organization,
              user,
            });

            await logToolAudit({
              organizationId: organization.id,
              userId: user?.id ?? null,
              tool: toolName,
              args: parsedArgs,
              status: result.status,
              error: result.error ?? null,
              conversationId: resolvedConversationId,
            });

            send({
              type: "tool_result",
              toolCallId: toolCall.id,
              name: toolName,
              status: result.status === "success" ? "success" : "error",
              result: result.result ?? { error: result.error },
            });

            toolMessageItems.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(result.result ?? { error: result.error }),
            });

            newConversationItems.push({
              id: toolCall.id,
              type: "tool",
              toolCallId: toolCall.id,
              name: toolName,
              args: parsedArgs,
              status: result.status === "success" ? "success" : "error",
              result: result.result ?? { error: result.error },
            });
          }

          conversationMessages = [
            ...conversationMessages,
            {
              role: "assistant",
              content: "",
              tool_calls: assistantToolCalls,
            },
            ...toolMessageItems,
          ];
        }

        if (!finalResponse) {
          finalResponse =
            "I wasn't able to generate a response. Please try again.";
        }

        const responseMessageId = streamAssistantMessage(finalResponse);

        newConversationItems.push({
          id: responseMessageId,
          type: "message",
          role: "assistant",
          content: finalResponse,
        });

        await appendConversation(newConversationItems);

        send({ type: "done" });
        controller.close();
      } catch (error) {
        send({
          type: "error",
          error:
            error instanceof Error
              ? error.message
              : "Assistant request failed.",
        });
        send({ type: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
