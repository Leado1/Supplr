"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AssistantConversationProps {
  children: React.ReactNode;
  className?: string;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
}

export const AssistantConversation = React.forwardRef<
  HTMLDivElement,
  AssistantConversationProps
>(({ children, className, onScroll }, ref) => {
  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className={cn("flex-1 overflow-y-auto px-6 py-5", className)}
    >
      {children}
    </div>
  );
});

AssistantConversation.displayName = "AssistantConversation";
