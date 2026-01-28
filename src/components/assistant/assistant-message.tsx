"use client";

import { cn } from "@/lib/utils";
import { AssistantMarkdown } from "./assistant-markdown";
import type { AssistantRole } from "@/types/assistant";

interface AssistantMessageProps {
  role: AssistantRole;
  content: string;
  isStreaming?: boolean;
}

export function AssistantMessage({
  role,
  content,
  isStreaming,
}: AssistantMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full items-end gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          AI
        </div>
      )}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-background"
        )}
      >
        {content ? (
          isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <AssistantMarkdown content={content} />
          )
        ) : isStreaming ? (
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:300ms]" />
          </div>
        ) : null}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
          You
        </div>
      )}
    </div>
  );
}
