"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { InsightItem } from "./types";
import {
  formatCurrency,
  formatDays,
  getDraftStatusLabel,
  getDraftStatusTone,
  getPriorityLabel,
} from "./utils";

interface InsightDetailsDrawerProps {
  insight: InsightItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrimaryAction: (insight: InsightItem) => void;
  onMarkDone: (insight: InsightItem) => void;
  onApproveDraft?: (insight: InsightItem) => void;
  locationId?: string;
  trendDays?: number;
}

const priorityTone: Record<InsightItem["priority"], string> = {
  critical: "border-red-200 bg-red-50 text-red-700",
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-border bg-muted/40 text-muted-foreground",
};

const typeTone: Record<InsightItem["sourceType"], string> = {
  reorder: "border-blue-200 bg-blue-50 text-blue-700",
  waste_risk: "border-amber-200 bg-amber-50 text-amber-700",
};

const Sparkline = ({
  values,
  isLoading,
  label,
}: {
  values: number[];
  isLoading: boolean;
  label: string;
}) => {
  if (isLoading) {
    return (
      <div className="rounded-md border p-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="mt-3 h-4 w-40" />
      </div>
    );
  }

  const maxValue = Math.max(1, ...values);
  const hasSignal = values.some((value) => value > 0);

  if (!hasSignal) {
    return (
      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
        Usage trend will appear as more activity is recorded.
      </div>
    );
  }

  return (
    <div className="rounded-md border p-3">
      <div className="flex h-16 items-end gap-1">
        {values.map((value, index) => {
          const heightPercent = Math.max(
            8,
            Math.round((value / maxValue) * 100)
          );
          return (
            <div
              key={`${index}-${value}`}
              className="flex-1 rounded-sm bg-primary/20"
              style={{ height: `${heightPercent}%` }}
            />
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
    </div>
  );
};

export function InsightDetailsDrawer({
  insight,
  open,
  onOpenChange,
  onPrimaryAction,
  onMarkDone,
  onApproveDraft,
  locationId,
  trendDays = 30,
}: InsightDetailsDrawerProps) {
  const [numbersOpen, setNumbersOpen] = useState(false);
  const [usageSeries, setUsageSeries] = useState<number[]>([]);
  const [isTrendLoading, setIsTrendLoading] = useState(false);

  useEffect(() => {
    setNumbersOpen(false);
    setUsageSeries([]);
  }, [insight?.id]);

  useEffect(() => {
    const fetchUsageTrends = async () => {
      if (!insight || !open) return;

      setIsTrendLoading(true);
      try {
        const params = new URLSearchParams({
          itemId: insight.itemId,
          days: trendDays.toString(),
        });

        if (locationId && locationId !== "all") {
          params.set("locationId", locationId);
        }

        const response = await fetch(
          `/api/ai/usage-trends?${params.toString()}`
        );
        if (!response.ok) {
          setUsageSeries([]);
          return;
        }

        const data = await response.json();
        const trends = Array.isArray(data.trends) ? data.trends : [];
        const values = trends.map(
          (trend: { usage: number }) => trend.usage || 0
        );
        setUsageSeries(values);
      } catch (error) {
        console.error("Failed to load usage trends:", error);
        setUsageSeries([]);
      } finally {
        setIsTrendLoading(false);
      }
    };

    void fetchUsageTrends();
  }, [insight, locationId, open, trendDays]);

  const numbers = useMemo(() => insight?.numbers ?? [], [insight]);
  const urgencyLabel = insight ? getPriorityLabel(insight.urgency) : null;
  const drawerTitle = insight ? insight.itemName : "Insight details";
  const draftStatus =
    insight?.sourceType === "reorder" ? insight.draftPoStatus : undefined;
  const primaryActionLabel = insight
    ? draftStatus
      ? draftStatus === "PENDING_APPROVAL"
        ? "Approve draft PO"
        : "Draft ready"
      : insight.actionLabel
    : "";
  const primaryActionDisabled =
    Boolean(draftStatus) && draftStatus !== "PENDING_APPROVAL";
  const handlePrimaryAction = () => {
    if (!insight) return;
    if (draftStatus === "PENDING_APPROVAL" && onApproveDraft) {
      onApproveDraft(insight);
      return;
    }
    onPrimaryAction(insight);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-none overflow-y-auto sm:max-w-lg lg:max-w-xl"
      >
        {insight && (
          <div className="flex h-full flex-col">
            <SheetHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className={cn("border", typeTone[insight.sourceType])}
                >
                  {insight.sourceType === "reorder"
                    ? "Restock"
                    : "Prevent waste"}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("border", priorityTone[insight.priority])}
                >
                  Priority: {insight.priority}
                </Badge>
                {urgencyLabel && (
                  <Badge variant="outline" className="border text-xs">
                    When: {urgencyLabel}
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-xl">{drawerTitle}</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                {insight.reason}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-6 px-4 pb-6">
              <section className="space-y-3 rounded-lg border bg-card p-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Recommended action</h3>
                  <p className="text-sm text-muted-foreground">
                    {insight.impactLabel}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handlePrimaryAction}
                    disabled={primaryActionDisabled}
                  >
                    {primaryActionLabel}
                  </Button>
                  <Button variant="outline" onClick={() => onMarkDone(insight)}>
                    Mark done
                  </Button>
                </div>
                {insight.orderingOption && (
                  <div className="rounded-md border bg-muted/30 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {insight.orderingOption.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Estimated cost{" "}
                          {formatCurrency(insight.orderingOption.estimatedCost)}{" "}
                          - {formatDays(insight.orderingOption.deliveryDays)}{" "}
                          delivery
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={insight.orderingOption.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Order
                          <ExternalLink className="ml-1 h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </section>

              {draftStatus && (
                <section className="space-y-3 rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Draft PO</h3>
                    <Badge
                      variant="outline"
                      className={cn("border text-xs", getDraftStatusTone(draftStatus))}
                    >
                      {getDraftStatusLabel(draftStatus)}
                    </Badge>
                  </div>
                  {insight.draftPoTotal !== null &&
                    insight.draftPoTotal !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        Estimated total {formatCurrency(insight.draftPoTotal)}
                      </p>
                    )}
                  {insight.draftPoCreatedAt && (
                    <p className="text-xs text-muted-foreground">
                      Created{" "}
                      {new Date(insight.draftPoCreatedAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </section>
              )}

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Why we suggested this</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {insight.evidence.slice(0, 4).map((line) => (
                    <li key={line} className="text-foreground">
                      - {line}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-2">
                <button
                  type="button"
                  onClick={() => setNumbersOpen((value) => !value)}
                  className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left hover:bg-muted/40"
                >
                  <div>
                    <p className="text-sm font-semibold">Numbers we used</p>
                    <p className="text-xs text-muted-foreground">
                      On hand, usage, supply days, and risk windows.
                    </p>
                  </div>
                  {numbersOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {numbersOpen && (
                  <div className="grid grid-cols-1 gap-2 rounded-lg border bg-card p-4 sm:grid-cols-2">
                    {numbers.map((entry) => (
                      <div
                        key={`${entry.label}-${entry.value}`}
                        className="space-y-0.5"
                      >
                        <p className="text-xs text-muted-foreground">
                          {entry.label}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {entry.value}
                        </p>
                        {entry.hint && (
                          <p className="text-xs text-muted-foreground">
                            {entry.hint}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">History</h3>
                <Sparkline
                  values={usageSeries}
                  isLoading={isTrendLoading}
                  label={`Last ${trendDays} days usage trend`}
                />
              </section>

              <section className="space-y-2 border-t pt-4 text-sm">
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/inventory"
                    className="text-primary hover:underline"
                  >
                    Open item
                  </Link>
                  <Link
                    href="/reports"
                    className="text-primary hover:underline"
                  >
                    View purchase history
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">
                  Item ID: {insight.itemId}
                </p>
              </section>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default InsightDetailsDrawer;
