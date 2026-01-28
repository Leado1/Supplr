"use client";

import type { ComponentType } from "react";
import { CheckCircle2, AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { AssistantToolStatus } from "@/types/assistant";

interface AssistantToolCardProps {
  name: string;
  args?: Record<string, unknown> | null;
  status: AssistantToolStatus;
  result?: unknown;
}

const statusConfig: Record<
  AssistantToolStatus,
  {
    label: string;
    icon: ComponentType<{ className?: string }>;
    badgeVariant:
      | "default"
      | "secondary"
      | "destructive"
      | "warning"
      | "success"
      | "outline";
  }
> = {
  pending: {
    label: "Pending",
    icon: Loader2,
    badgeVariant: "secondary",
  },
  running: {
    label: "Running",
    icon: Loader2,
    badgeVariant: "secondary",
  },
  success: {
    label: "Success",
    icon: CheckCircle2,
    badgeVariant: "success",
  },
  error: {
    label: "Error",
    icon: AlertTriangle,
    badgeVariant: "destructive",
  },
  requires_confirmation: {
    label: "Confirm",
    icon: ShieldAlert,
    badgeVariant: "warning",
  },
};

export function AssistantToolCard({
  name,
  args,
  status,
  result,
}: AssistantToolCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex w-full justify-start">
      <details className="group w-full max-w-[85%] rounded-xl border border-border bg-muted/40 p-4 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              status === "success" && "bg-green-100 text-green-700",
              status === "error" && "bg-red-100 text-red-700",
              status === "requires_confirmation" && "bg-amber-100 text-amber-700",
              (status === "pending" || status === "running") && "bg-muted text-muted-foreground"
            )}>
              <Icon className={cn("h-4 w-4", status === "running" && "animate-spin")} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Tool</p>
              <p className="text-xs text-muted-foreground">{name}</p>
            </div>
          </div>
          <Badge variant={config.badgeVariant}>{config.label}</Badge>
        </summary>
        <div className="mt-4 space-y-3 text-xs">
          {args && (
            <div>
              <p className="mb-1 font-semibold text-muted-foreground">Arguments</p>
              <pre className="whitespace-pre-wrap rounded-lg bg-background p-3 text-[11px] text-foreground">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}
          {result !== undefined && (
            <div>
              <p className="mb-1 font-semibold text-muted-foreground">Result</p>
              <pre className="whitespace-pre-wrap rounded-lg bg-background p-3 text-[11px] text-foreground">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
