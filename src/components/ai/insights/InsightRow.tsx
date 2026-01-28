"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  DollarSign,
  MoreHorizontal,
  Package,
} from "lucide-react";
import type { InsightFilterType, InsightItem, InsightUrgency } from "./types";
import {
  getDraftStatusLabel,
  getDraftStatusTone,
  getPriorityLabel,
  getPriorityTone,
} from "./utils";

interface InsightRowProps {
  insight: InsightItem;
  activeTypeFilter: InsightFilterType;
  isSelected: boolean;
  onSelect: (insight: InsightItem) => void;
  onPrimaryAction: (insight: InsightItem) => void;
  onSnooze: (insight: InsightItem, days: number) => void;
  onDismiss: (insight: InsightItem) => void;
  onMarkDone: (insight: InsightItem) => void;
  onViewItem: (insight: InsightItem) => void;
}

const urgencyBadgeTone: Record<InsightUrgency, string> = {
  urgent: "border-red-200 bg-red-50 text-red-700",
  soon: "border-amber-200 bg-amber-50 text-amber-700",
  later: "border-border bg-muted/40 text-muted-foreground",
};

const confidenceTone: Record<InsightItem["confidenceLevel"], string> = {
  High: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  Low: "border-border bg-muted/40 text-muted-foreground",
};

const getDisplayType = (
  insight: InsightItem,
  activeTypeFilter: InsightFilterType
) => {
  if (activeTypeFilter === "savings" && insight.potentialSavings > 0) {
    return {
      label: "Savings",
      icon: DollarSign,
    };
  }
  if (insight.sourceType === "reorder") {
    return {
      label: "Restock",
      icon: Package,
    };
  }
  return {
    label: "Prevent waste",
    icon: AlertTriangle,
  };
};

export function InsightRow({
  insight,
  activeTypeFilter,
  isSelected,
  onSelect,
  onPrimaryAction,
  onSnooze,
  onDismiss,
  onMarkDone,
  onViewItem,
}: InsightRowProps) {
  const displayType = getDisplayType(insight, activeTypeFilter);
  const TypeIcon = displayType.icon;
  const urgencyLabel = getPriorityLabel(insight.urgency);
  const snoozedUntilLabel =
    insight.status === "snoozed" && insight.snoozedUntil
      ? new Date(insight.snoozedUntil).toLocaleDateString()
      : null;
  const draftStatus =
    insight.sourceType === "reorder" ? insight.draftPoStatus : undefined;
  const primaryActionLabel = draftStatus
    ? "Review draft"
    : insight.actionLabel;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card transition-colors",
        "border-l-2",
        getPriorityTone(insight.urgency),
        isSelected && "ring-2 ring-primary/20"
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(insight)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(insight);
          }
        }}
        className="flex w-full cursor-pointer flex-col gap-3 p-4 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <TypeIcon className="h-3.5 w-3.5" />
                {displayType.label}
              </span>
              {insight.categoryName && <span>{insight.categoryName}</span>}
              {insight.locationName && <span>- {insight.locationName}</span>}
            </div>

            <div className="space-y-1">
              <p className="text-base font-semibold">{insight.itemName}</p>
              <p className="text-sm text-muted-foreground">{insight.reason}</p>
            </div>

            {snoozedUntilLabel && (
              <p className="text-xs text-muted-foreground">
                Snoozed until {snoozedUntilLabel}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 lg:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "border text-xs font-medium",
                  urgencyBadgeTone[insight.urgency]
                )}
              >
                {urgencyLabel}
              </Badge>
              {draftStatus && (
                <Badge
                  variant="outline"
                  className={cn(
                    "border text-xs",
                    getDraftStatusTone(draftStatus)
                  )}
                >
                  {getDraftStatusLabel(draftStatus)}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "border text-xs",
                  confidenceTone[insight.confidenceLevel]
                )}
              >
                Confidence: {insight.confidenceLevel}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <p className="text-sm font-medium text-foreground">
                {insight.impactLabel}
              </p>

              <Button
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  onPrimaryAction(insight);
                }}
                className="h-8"
              >
                {primaryActionLabel}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(event) => event.stopPropagation()}
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onSnooze(insight, 7)}>
                    Snooze 7 days
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onSnooze(insight, 14)}>
                    Snooze 14 days
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onSnooze(insight, 30)}>
                    Snooze 30 days
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onMarkDone(insight)}>
                    Mark done
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onViewItem(insight)}>
                    View item
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => onDismiss(insight)}
                    className="text-destructive focus:text-destructive"
                  >
                    Dismiss
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InsightRow;
