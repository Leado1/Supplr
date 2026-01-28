"use client";

import * as React from "react";
import { ArrowDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AssistantConversation } from "./assistant-conversation";
import { AssistantMessage } from "./assistant-message";
import { AssistantPrompt } from "./assistant-prompt";
import { AssistantSuggestions } from "./assistant-suggestions";
import { AssistantToolCard } from "./assistant-tool-card";
import type {
  AssistantChatItem,
  AssistantChatRequest,
  AssistantPendingAction,
  AssistantStreamEvent,
} from "@/types/assistant";

const DEFAULT_SUGGESTIONS = [
  "What items are low stock?",
  "Show expiring items in the next 30 days.",
  "Add 10 boxes of nitrile gloves.",
  "Summarize my inventory KPIs.",
];

const FOLLOW_UP_SUGGESTIONS = [
  "Show me expiring items.",
  "Adjust stock for a product.",
  "Find products by SKU.",
];

const createLocalId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}`;
};

export function AssistantChat({ workspaceId }: { workspaceId: string }) {
  const [messages, setMessages] = React.useState<AssistantChatItem[]>([]);
  const [input, setInput] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] =
    React.useState<AssistantPendingAction | null>(null);
  const [showFollowUps, setShowFollowUps] = React.useState(false);
  const [isAtBottom, setIsAtBottom] = React.useState(true);

  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const orderedMessages = React.useMemo(() => {
    if (messages.length === 0) return messages;
    const output: AssistantChatItem[] = [];
    const pendingTools: AssistantChatItem[] = [];

    for (const item of messages) {
      if (item.type === "tool") {
        pendingTools.push(item);
        continue;
      }

      output.push(item);
      if (item.role === "assistant" && pendingTools.length > 0) {
        output.push(...pendingTools);
        pendingTools.length = 0;
      }
    }

    if (pendingTools.length > 0) {
      output.push(...pendingTools);
    }

    return output;
  }, [messages]);

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior,
    });
  }, []);

  const handleScroll = React.useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 120;
    setIsAtBottom(atBottom);
  }, []);

  React.useEffect(() => {
    if (isAtBottom) {
      scrollToBottom("auto");
    }
  }, [messages, isAtBottom, scrollToBottom]);

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setPendingAction(null);
    setShowFollowUps(false);
  };

  const updateToolCard = React.useCallback((
    toolCallId: string,
    updater: (item: AssistantChatItem) => AssistantChatItem
  ) => {
    setMessages((prev) => {
      const index = prev.findIndex(
        (item) => item.type === "tool" && item.toolCallId === toolCallId
      );
      if (index === -1) return prev;
      const next = [...prev];
      next[index] = updater(next[index]);
      return next;
    });
  }, []);

  const handleStreamEvent = React.useCallback(
    (event: AssistantStreamEvent) => {
      switch (event.type) {
        case "conversation":
          if (event.conversationId) {
            setConversationId(event.conversationId);
          }
          break;
        case "message_start":
          if (!event.messageId) return;
          const messageId = event.messageId;
          setMessages((prev) => [
            ...prev,
            {
              id: messageId,
              type: "message",
              role: event.role ?? "assistant",
              content: "",
              createdAt: new Date().toISOString(),
            },
          ]);
          setShowFollowUps(false);
          break;
        case "token":
          if (!event.messageId || !event.token) return;
          setMessages((prev) =>
            prev.map((item) =>
              item.type === "message" && item.id === event.messageId
                ? { ...item, content: item.content + event.token }
                : item
            )
          );
          break;
        case "message_end":
          setShowFollowUps(true);
          break;
        case "tool_call":
          if (!event.toolCallId || !event.name) return;
          const toolCallId = event.toolCallId;
          const toolName = event.name;
          setMessages((prev) => {
            const existingIndex = prev.findIndex(
              (item) =>
                item.type === "tool" && item.toolCallId === toolCallId
            );
            const toolItem: AssistantChatItem = {
              id: toolCallId,
              type: "tool",
              toolCallId,
              name: toolName,
              args: event.args ?? null,
              status: event.status ?? "pending",
              result: event.result,
            };

            if (existingIndex === -1) {
              return [...prev, toolItem];
            }

            const next = [...prev];
            next[existingIndex] = {
              ...next[existingIndex],
              ...toolItem,
            } as AssistantChatItem;
            return next;
          });
          if (event.status === "requires_confirmation") {
            setPendingAction(event.pendingAction ?? null);
          }
          break;
        case "tool_result":
          if (!event.toolCallId) return;
          const resultToolCallId = event.toolCallId;
          updateToolCard(resultToolCallId, (item) => ({
            ...item,
            status: event.status ?? "success",
            result: event.result,
          }));
          setPendingAction(null);
          break;
        case "error":
          setMessages((prev) => [
            ...prev,
            {
              id: createLocalId(),
              type: "message",
              role: "assistant",
              content: event.error || "Something went wrong. Please try again.",
            },
          ]);
          setShowFollowUps(false);
          break;
        case "done":
          setIsStreaming(false);
          break;
        default:
          break;
      }
    },
    [updateToolCard]
  );

  const startStream = async (payload: AssistantChatRequest) => {
    const response = await fetch("/api/assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Failed to start assistant stream");
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Assistant stream unavailable");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.replace(/^data:\s?/, "");
          if (!data || data === "[DONE]") continue;

          try {
            const event = JSON.parse(data) as AssistantStreamEvent;
            handleStreamEvent(event);
          } catch (error) {
            console.error("Failed to parse assistant event", error);
          }
        }
      }
    }
  };

  const handleSend = async (overrideMessage?: string) => {
    const content = (overrideMessage ?? input).trim();
    if (!content || isStreaming) return;

    if (
      pendingAction &&
      (/\bconfirm\b/i.test(content) || /\bcancel\b/i.test(content))
    ) {
      setPendingAction(null);
    }

    const userMessage: AssistantChatItem = {
      id: createLocalId(),
      type: "message",
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setIsStreaming(true);

    try {
      const payload: AssistantChatRequest = {
        workspaceId,
        messages: nextMessages,
        conversationId,
        pendingAction,
      };

      await startStream(payload);
    } catch (error) {
      console.error("Assistant error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: createLocalId(),
          type: "message",
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Failed to reach the assistant.",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Chat workspace</p>
          <p className="text-xs text-muted-foreground">
            Inventory assistance for this clinic
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleNewChat}>
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="relative flex min-h-[60vh] flex-1 flex-col">
        <AssistantConversation
          ref={scrollRef}
          onScroll={handleScroll}
          className="relative"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Meet your inventory co-pilot
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ask questions, update stock, or pull insights in seconds.
                </p>
              </div>
              <AssistantSuggestions
                suggestions={DEFAULT_SUGGESTIONS}
                onSelect={(value) => handleSend(value)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {orderedMessages.map((item) => {
                if (item.type === "tool") {
                  return null;
                }

                return (
                  <AssistantMessage
                    key={item.id}
                    role={item.role}
                    content={item.content}
                    isStreaming={isStreaming && item.role === "assistant"}
                  />
                );
              })}
            </div>
          )}

          {!isAtBottom && messages.length > 0 && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-6 right-6 h-9 w-9 rounded-full shadow-md"
              onClick={() => scrollToBottom("smooth")}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
        </AssistantConversation>

        <div className={cn("border-t border-border bg-background px-6 py-4")}> 
          {messages.length > 0 && showFollowUps && !isStreaming && (
            <div className="mb-4">
              <AssistantSuggestions
                suggestions={FOLLOW_UP_SUGGESTIONS}
                onSelect={(value) => handleSend(value)}
                label="Keep going"
              />
            </div>
          )}
          <AssistantPrompt
            value={input}
            onChange={setInput}
            onSubmit={() => handleSend()}
            disabled={isStreaming}
          />
        </div>
      </div>
    </div>
  );
}
