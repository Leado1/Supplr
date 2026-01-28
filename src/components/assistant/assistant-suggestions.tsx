"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssistantSuggestionsProps {
  suggestions: string[];
  onSelect: (value: string) => void;
  label?: string;
}

export function AssistantSuggestions({
  suggestions,
  onSelect,
  label = "Try one of these",
}: AssistantSuggestionsProps) {
  if (!suggestions.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}
