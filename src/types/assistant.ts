export type AssistantRole = "user" | "assistant";

export type AssistantToolStatus =
  | "pending"
  | "running"
  | "success"
  | "error"
  | "requires_confirmation";

export interface AssistantPendingAction {
  tool: string;
  args: Record<string, unknown>;
  summary?: string;
  toolCallId?: string;
}

export interface AssistantChatMessage {
  id: string;
  type: "message";
  role: AssistantRole;
  content: string;
  createdAt?: string;
}

export interface AssistantToolMessage {
  id: string;
  type: "tool";
  toolCallId: string;
  name: string;
  args?: Record<string, unknown> | null;
  status: AssistantToolStatus;
  result?: unknown;
}

export type AssistantChatItem = AssistantChatMessage | AssistantToolMessage;

export interface AssistantChatRequest {
  workspaceId: string;
  messages: AssistantChatItem[];
  conversationId?: string | null;
  pendingAction?: AssistantPendingAction | null;
}

export interface AssistantStreamEvent {
  type:
    | "conversation"
    | "message_start"
    | "token"
    | "message_end"
    | "tool_call"
    | "tool_result"
    | "error"
    | "done";
  conversationId?: string;
  messageId?: string;
  role?: AssistantRole;
  token?: string;
  toolCallId?: string;
  name?: string;
  args?: Record<string, unknown> | null;
  status?: AssistantToolStatus;
  result?: unknown;
  error?: string;
  pendingAction?: AssistantPendingAction | null;
}
