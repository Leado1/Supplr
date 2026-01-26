"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightRow } from "./InsightRow";
import { InsightsFilterBar } from "./InsightsFilterBar";
import type {
  InsightAutomationSettings,
  InsightFilters,
  InsightItem,
} from "./types";

interface InsightsActionQueueProps {
  insights: InsightItem[];
  filteredInsights: InsightItem[];
  filters: InsightFilters;
  isLoading: boolean;
  automationSettings: InsightAutomationSettings;
  onAutomationChange: (updates: Partial<InsightAutomationSettings>) => void;
  onFiltersChange: (next: InsightFilters) => void;
  onResetFilters: () => void;
  selectedInsightId: string | null;
  onSelect: (insight: InsightItem) => void;
  onPrimaryAction: (insight: InsightItem) => void;
  onSnooze: (insight: InsightItem, days: number) => void;
  onDismiss: (insight: InsightItem) => void;
  onMarkDone: (insight: InsightItem) => void;
  onViewItem: (insight: InsightItem) => void;
}

const ActionQueueSkeleton = () => (
  <div className="space-y-3">
    {[0, 1, 2, 3, 4].map((index) => (
      <Card key={index}>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-28" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export function InsightsActionQueue({
  insights,
  filteredInsights,
  filters,
  isLoading,
  automationSettings,
  onAutomationChange,
  onFiltersChange,
  onResetFilters,
  selectedInsightId,
  onSelect,
  onPrimaryAction,
  onSnooze,
  onDismiss,
  onMarkDone,
  onViewItem,
}: InsightsActionQueueProps) {
  const showNoData = !isLoading && insights.length === 0;
  const showNoResults =
    !isLoading && insights.length > 0 && filteredInsights.length === 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">What to do next</h2>
        <p className="text-sm text-muted-foreground">
          Focus on the top actions that keep you stocked and reduce waste.
        </p>
      </div>

      <InsightsFilterBar
        filters={filters}
        onFiltersChange={onFiltersChange}
        automationSettings={automationSettings}
        onAutomationChange={onAutomationChange}
      />

      {isLoading && <ActionQueueSkeleton />}

      {showNoData && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-base font-semibold">No insights yet</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Add usage or receiving activity to generate insights.
            </p>
          </CardContent>
        </Card>
      )}

      {showNoResults && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <p className="text-base font-semibold">No matches</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Nothing matches your current filters. Try clearing them.
            </p>
            <Button variant="outline" size="sm" onClick={onResetFilters}>
              Reset filters
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && filteredInsights.length > 0 && (
        <div className="space-y-3">
          {filteredInsights.map((insight) => (
            <InsightRow
              key={insight.id}
              insight={insight}
              activeTypeFilter={filters.type}
              isSelected={selectedInsightId === insight.id}
              onSelect={onSelect}
              onPrimaryAction={onPrimaryAction}
              onSnooze={onSnooze}
              onDismiss={onDismiss}
              onMarkDone={onMarkDone}
              onViewItem={onViewItem}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default InsightsActionQueue;
