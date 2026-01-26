/**
 * AI Dashboard - Calm, action-first AI Insights experience
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocationContext } from "@/contexts/location-context";
import { InsightDetailsDrawer } from "./insights/InsightDetailsDrawer";
import { InsightsActionQueue } from "./insights/InsightsActionQueue";
import { InsightsHeader } from "./insights/InsightsHeader";
import { InsightsSummaryCards } from "./insights/InsightsSummaryCards";
import type {
  DateRangeOption,
  InsightAutomationSettings,
  InsightFilters,
  InsightDraftSummary,
  InsightItem,
} from "./insights/types";
import {
  applyInsightFilters,
  buildInsightsFromApi,
  getInsightSummaryMetrics,
} from "./insights/utils";

interface AIDashboardProps {
  organizationId: string;
  locationId?: string;
  className?: string;
}

const defaultFilters: InsightFilters = {
  type: "all",
  priority: "all",
  status: "open",
  search: "",
  sort: "priority",
};

export function AIDashboard({
  organizationId,
  locationId,
  className,
}: AIDashboardProps) {
  const router = useRouter();
  const { selectedLocation } = useLocationContext();
  const [dateRange, setDateRange] = useState<DateRangeOption>("30");
  const [automationSettings, setAutomationSettings] =
    useState<InsightAutomationSettings>({
      autoCreateDrafts: false,
      requireApproval: false,
    });
  const [filters, setFilters] = useState<InsightFilters>(defaultFilters);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState<
    string | undefined
  >();
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(
    null
  );
  const autoDraftedItems = useRef<Set<string>>(new Set());
  const trendDays = useMemo(() => {
    if (dateRange === "custom") return 30;
    return Number(dateRange);
  }, [dateRange]);

  const activeLocationId = selectedLocation?.id || locationId;

  const loadAIData = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const locationQuery = activeLocationId
          ? `?locationId=${activeLocationId}`
          : "";

        const [reorderResponse, wasteResponse] = await Promise.all([
          fetch(`/api/ai/reorder-predictions${locationQuery}`),
          fetch(`/api/ai/waste-prevention${locationQuery}`),
        ]);

        const reorderData = reorderResponse.ok
          ? await reorderResponse.json()
          : { predictions: [] };
        const wasteData = wasteResponse.ok
          ? await wasteResponse.json()
          : { predictions: [] };

        const reorderPredictions = reorderData.predictions ?? [];
        const wastePredictions = wasteData.predictions ?? [];

        let draftsByItemId: Record<string, InsightDraftSummary> = {};

        if (reorderPredictions.length > 0) {
          const itemIds = reorderPredictions
            .map((prediction: { item?: { id?: string } }) => prediction.item?.id)
            .filter(Boolean)
            .join(",");
          if (itemIds) {
            const draftsResponse = await fetch(
              `/api/purchase-orders/drafts?itemIds=${itemIds}`
            );
            if (draftsResponse.ok) {
              const draftData = await draftsResponse.json();
              draftsByItemId = (draftData.drafts || []).reduce(
                (
                  acc: Record<string, InsightDraftSummary>,
                  draft: {
                    itemId: string;
                    purchaseOrderId: string;
                    status: InsightDraftSummary["status"];
                    totalEstimatedCost: number | null;
                    createdAt?: string;
                  }
                ) => {
                  acc[draft.itemId] = {
                    id: draft.purchaseOrderId,
                    status: draft.status,
                    totalEstimatedCost: draft.totalEstimatedCost,
                    createdAt: draft.createdAt,
                  };
                  return acc;
                },
                {}
              );
            }
          }
        }

        const nextInsights = buildInsightsFromApi(
          reorderPredictions,
          wastePredictions,
          draftsByItemId
        );

        setInsights(nextInsights);
        setLastUpdatedLabel(
          new Date().toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load AI data");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeLocationId]
  );

  const loadAutomationSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/ai/automation-settings");
      if (!response.ok) return;
      const data = await response.json();
      setAutomationSettings({
        autoCreateDrafts: Boolean(data.settings?.aiAutoDraftEnabled),
        requireApproval: Boolean(data.settings?.aiRequireApproval),
      });
    } catch (err) {
      console.error("Failed to load automation settings:", err);
    }
  }, []);

  const updateAutomationSettings = useCallback(
    async (updates: Partial<InsightAutomationSettings>) => {
      setAutomationSettings((previous) => ({ ...previous, ...updates }));
      try {
        const response = await fetch("/api/ai/automation-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aiAutoDraftEnabled:
              updates.autoCreateDrafts ?? automationSettings.autoCreateDrafts,
            aiRequireApproval:
              updates.requireApproval ?? automationSettings.requireApproval,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to update automation settings");
        }
        const data = await response.json();
        setAutomationSettings({
          autoCreateDrafts: Boolean(data.settings?.aiAutoDraftEnabled),
          requireApproval: Boolean(data.settings?.aiRequireApproval),
        });
      } catch (err) {
        console.error("Failed to update automation settings:", err);
        await loadAutomationSettings();
      }
    },
    [automationSettings.autoCreateDrafts, automationSettings.requireApproval, loadAutomationSettings]
  );

  useEffect(() => {
    void loadAIData();
  }, [loadAIData, organizationId, dateRange]);

  useEffect(() => {
    void loadAutomationSettings();
  }, [loadAutomationSettings]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      setInsights((previous) =>
        previous.map((insight) => {
          if (insight.status !== "snoozed" || !insight.snoozedUntil) {
            return insight;
          }
          const snoozedUntilTime = new Date(insight.snoozedUntil).getTime();
          if (snoozedUntilTime > now) {
            return insight;
          }
          return { ...insight, status: "open", snoozedUntil: undefined };
        })
      );
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const summaryMetrics = useMemo(
    () => getInsightSummaryMetrics(insights),
    [insights]
  );
  const filteredInsights = useMemo(
    () => applyInsightFilters(insights, filters),
    [insights, filters]
  );
  const selectedInsight = useMemo(
    () => insights.find((insight) => insight.id === selectedInsightId) ?? null,
    [insights, selectedInsightId]
  );
  const drawerOpen = Boolean(selectedInsight);

  useEffect(() => {
    if (selectedInsightId && !selectedInsight) {
      setSelectedInsightId(null);
    }
  }, [selectedInsight, selectedInsightId]);

  const recordInsightAction = useCallback(
    async (insight: InsightItem, action: string) => {
      try {
        const endpoint =
          insight.sourceType === "reorder"
            ? "/api/ai/reorder-predictions"
            : "/api/ai/waste-prevention";
        const method = insight.sourceType === "reorder" ? "PATCH" : "POST";

        await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: insight.itemId,
            action,
            feedback: "helpful",
          }),
        });
      } catch (err) {
        console.error("Failed to record AI insight action:", err);
      }
    },
    []
  );

  const updateInsight = useCallback(
    (insightId: string, updater: (insight: InsightItem) => InsightItem) => {
      setInsights((previous) =>
        previous.map((insight) =>
          insight.id === insightId ? updater(insight) : insight
        )
      );
    },
    []
  );

  const createDraftPo = useCallback(
    async (insight: InsightItem, options?: { automated?: boolean }) => {
      if (insight.sourceType !== "reorder") return;
      if (insight.draftPoId) return;

      try {
        const response = await fetch("/api/purchase-orders/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: insight.itemId,
            quantity: insight.recommendedQuantity,
            source: "ai_insights",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create draft PO");
        }

        const data = await response.json();
        const draft = data.draft;

        updateInsight(insight.id, (current) => ({
          ...current,
          draftPoId: draft.id,
          draftPoStatus: draft.status,
          draftPoTotal: draft.totalEstimatedCost ?? null,
          draftPoCreatedAt: draft.createdAt,
        }));

        if (options?.automated) {
          autoDraftedItems.current.add(insight.itemId);
        }

        if (!options?.automated) {
          void recordInsightAction(insight, "marked_for_ordering");
        }
      } catch (err) {
        console.error("Failed to create draft PO:", err);
      }
    },
    [recordInsightAction, updateInsight]
  );

  const approveDraftPo = useCallback(
    async (insight: InsightItem) => {
      if (!insight.draftPoId) return;
      try {
        const response = await fetch(
          `/api/purchase-orders/drafts/${insight.draftPoId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "APPROVED" }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to approve draft PO");
        }

        const data = await response.json();
        updateInsight(insight.id, (current) => ({
          ...current,
          draftPoStatus: data.draft?.status ?? current.draftPoStatus,
        }));
      } catch (err) {
        console.error("Failed to approve draft PO:", err);
      }
    },
    [updateInsight]
  );

  useEffect(() => {
    if (isLoading || !automationSettings.autoCreateDrafts) {
      return;
    }

    const pendingDrafts = insights.filter(
      (insight) =>
        insight.sourceType === "reorder" &&
        insight.status === "open" &&
        !insight.draftPoId
    );

    if (pendingDrafts.length === 0) {
      return;
    }

    const createDrafts = async () => {
      for (const insight of pendingDrafts) {
        if (autoDraftedItems.current.has(insight.itemId)) {
          continue;
        }
        await createDraftPo(insight, { automated: true });
      }
    };

    void createDrafts();
  }, [
    automationSettings.autoCreateDrafts,
    createDraftPo,
    insights,
    isLoading,
  ]);

  const handlePrimaryAction = (insight: InsightItem) => {
    if (insight.sourceType === "reorder") {
      if (insight.draftPoId) {
        setSelectedInsightId(insight.id);
        return;
      }
      void createDraftPo(insight);
      return;
    }

    void recordInsightAction(insight, "marked_priority");
    updateInsight(insight.id, (current) => ({ ...current, status: "done" }));
    setSelectedInsightId(null);
  };

  const handleMarkDone = (insight: InsightItem) => {
    void recordInsightAction(insight, "marked_done");
    updateInsight(insight.id, (current) => ({ ...current, status: "done" }));
    setSelectedInsightId(null);
  };

  const handleSnooze = (insight: InsightItem, days: number) => {
    const snoozedUntil = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000
    ).toISOString();
    updateInsight(insight.id, (current) => ({
      ...current,
      status: "snoozed",
      snoozedUntil,
    }));
    setSelectedInsightId(null);
  };

  const handleDismiss = (insight: InsightItem) => {
    setInsights((previous) =>
      previous.filter((item) => item.id !== insight.id)
    );
    setSelectedInsightId(null);
  };

  const handleViewItem = (_insight: InsightItem) => {
    router.push("/inventory");
    setSelectedInsightId(null);
  };

  const handleDrawerOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedInsightId(null);
    }
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p>Failed to load AI insights: {error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => loadAIData()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <InsightsHeader
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onRefresh={() => loadAIData(true)}
        isRefreshing={isRefreshing}
        lastUpdatedLabel={lastUpdatedLabel}
      />

      <InsightsSummaryCards metrics={summaryMetrics} isLoading={isLoading} />

      <InsightsActionQueue
        insights={insights}
        filteredInsights={filteredInsights}
        filters={filters}
        isLoading={isLoading}
        automationSettings={automationSettings}
        onAutomationChange={updateAutomationSettings}
        onFiltersChange={setFilters}
        onResetFilters={handleResetFilters}
        selectedInsightId={selectedInsightId}
        onSelect={(insight) => setSelectedInsightId(insight.id)}
        onPrimaryAction={handlePrimaryAction}
        onSnooze={handleSnooze}
        onDismiss={handleDismiss}
        onMarkDone={handleMarkDone}
        onViewItem={handleViewItem}
      />

      <InsightDetailsDrawer
        insight={selectedInsight}
        open={drawerOpen}
        onOpenChange={handleDrawerOpenChange}
        onPrimaryAction={handlePrimaryAction}
        onMarkDone={handleMarkDone}
        onApproveDraft={approveDraftPo}
        locationId={activeLocationId}
        trendDays={trendDays}
      />
    </div>
  );
}

export default AIDashboard;
