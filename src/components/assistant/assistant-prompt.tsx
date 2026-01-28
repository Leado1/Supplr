"use client";

import * as React from "react";
import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AssistantPromptProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function AssistantPrompt({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "Ask about inventory, reorder points, or adjustments...",
}: AssistantPromptProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [value]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-3">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={placeholder}
          className={cn(
            "max-h-32 resize-none rounded-xl border-border bg-muted/40",
            "focus-visible:ring-2 focus-visible:ring-primary/20",
            disabled && "opacity-70"
          )}
        />
        <Button
          type="button"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
        >
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Enter to send, Shift + Enter for a new line.
      </p>
    </div>
  );
}
