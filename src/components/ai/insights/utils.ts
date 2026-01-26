import type {
  ConfidenceLevel,
  InsightFilters,
  InsightDraftSummary,
  InsightItem,
  InsightNumber,
  InsightPriority,
  PurchaseOrderStatus,
  InsightSortOption,
  InsightSummaryMetrics,
  InsightUrgency,
} from "./types";

const priorityWeight: Record<InsightPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const urgencyWeight: Record<InsightUrgency, number> = {
  urgent: 3,
  soon: 2,
  later: 1,
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value: number) =>
  currencyFormatter.format(value);

const EMPTY_VALUE = "N/A";

export const formatCompactCurrency = (value: number) => {
  if (value === 0) return "$0";
  const rounded = Math.round(value);
  return `~$${rounded.toLocaleString("en-US")}`;
};

export const formatUnits = (
  value: number | null | undefined,
  suffix = "units"
) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return EMPTY_VALUE;
  }
  const safeValue =
    Math.abs(value) >= 10 ? Math.round(value) : Number(value.toFixed(1));
  return `${safeValue.toLocaleString("en-US")} ${suffix}`;
};

export const formatDays = (days: number | null | undefined) => {
  if (days === null || days === undefined || Number.isNaN(days)) {
    return EMPTY_VALUE;
  }
  const safeDays = Math.max(0, Math.round(days));
  return `${safeDays} day${safeDays === 1 ? "" : "s"}`;
};

export const getConfidenceLevel = (
  confidenceScore: number
): ConfidenceLevel => {
  if (confidenceScore >= 80) return "High";
  if (confidenceScore >= 60) return "Medium";
  return "Low";
};

export const getUrgency = (
  priority: InsightPriority,
  daysUntilAction?: number | null
): InsightUrgency => {
  if (priority === "critical" || priority === "high") return "urgent";
  if (daysUntilAction !== null && daysUntilAction !== undefined) {
    if (daysUntilAction <= 3) return "urgent";
    if (daysUntilAction <= 14) return "soon";
  }
  if (priority === "medium") return "soon";
  return "later";
};

const buildNumbers = (entries: InsightNumber[]) =>
  entries.filter((entry) => entry.value !== EMPTY_VALUE);

const baseLeadTimeDays = 7;

interface ReorderApiPrediction {
  item: {
    id: string;
    name: string;
    quantity: number;
    reorderThreshold: number;
    unitCost: string;
    expirationDate: string;
    category: string;
    location?: string;
  };
  reorderPrediction: {
    daysUntilReorder: number | null;
    recommendedQuantity: number | null;
    priority: InsightPriority;
    currentUsage?: number;
    safetyStock?: number;
  };
  confidence: number;
  reasoning: string;
  orderingOptions?: Array<{
    supplier: { name: string; deliveryTime: number };
    orderingUrl: string;
    estimatedCost: number;
  }>;
}

interface WasteApiPrediction {
  item: {
    id: string;
    name: string;
    quantity: number;
    unitCost: string;
    expirationDate: string;
    category: string;
    location?: string;
  };
  wasteRisk: {
    riskLevel: "low" | "medium" | "high";
    estimatedWasteQuantity: number;
    daysUntilExpiration: number;
    estimatedWasteValue: number;
    recommendation: string;
  };
  usage?: {
    averageDailyUsage: number;
    totalUsage30Days: number;
  };
  confidence: number;
  reasoning: string;
}

const toWeeklyUsage = (dailyUsage: number) => dailyUsage * 7;

const safeDivide = (numerator: number, denominator: number) => {
  if (!denominator || denominator <= 0) return null;
  return numerator / denominator;
};

const buildImpactLabel = (potentialSavings: number, fallback: string) =>
  potentialSavings > 0
    ? `Save ${formatCompactCurrency(potentialSavings)}/mo`
    : fallback;

const buildActionLabel = (
  potentialSavings: number,
  sourceType: InsightItem["sourceType"]
) => {
  if (potentialSavings > 0) return "Apply suggestion";
  return sourceType === "reorder" ? "Create draft PO" : "Use soon";
};

const buildReorderReason = (
  daysUntilReorder: number | null,
  dailyUsage: number | undefined
) => {
  if (daysUntilReorder === null) {
    return "Add more usage history to time your next order.";
  }
  if (daysUntilReorder <= 0) {
    return "You may already be below your reorder point.";
  }
  const usageHint =
    dailyUsage && dailyUsage > 0 ? " at your current usage" : "";
  return `You may run out in ~${daysUntilReorder} days${usageHint}.`;
};

const buildWasteReason = (wasteQty: number, daysUntilExpiration: number) => {
  if (daysUntilExpiration <= 0) {
    return `${wasteQty} units may already be expired.`;
  }
  return `${wasteQty} units could expire in ~${daysUntilExpiration} days.`;
};

export const buildInsightsFromApi = (
  reorderPredictions: ReorderApiPrediction[],
  wastePredictions: WasteApiPrediction[],
  draftsByItemId: Record<string, InsightDraftSummary> = {}
): InsightItem[] => {
  const reorderInsights: InsightItem[] = reorderPredictions.map(
    (prediction) => {
      const draftSummary = draftsByItemId[prediction.item.id];
      const dailyUsage = prediction.reorderPrediction.currentUsage ?? 0;
      const weeklyUsage = toWeeklyUsage(dailyUsage);
      const daysOfSupply = safeDivide(prediction.item.quantity, dailyUsage);
      const daysUntilReorder = prediction.reorderPrediction.daysUntilReorder;
      const recommendedQuantity =
        prediction.reorderPrediction.recommendedQuantity ?? 0;
      const potentialSavings = 0;

      const urgency = getUrgency(
        prediction.reorderPrediction.priority,
        daysUntilReorder
      );
      const confidenceLevel = getConfidenceLevel(prediction.confidence);
      const orderingOption = prediction.orderingOptions?.[0]
        ? {
            name: prediction.orderingOptions[0].supplier.name,
            url: prediction.orderingOptions[0].orderingUrl,
            estimatedCost: prediction.orderingOptions[0].estimatedCost,
            deliveryDays: prediction.orderingOptions[0].supplier.deliveryTime,
          }
        : undefined;

      const numbers = buildNumbers([
        { label: "On hand", value: formatUnits(prediction.item.quantity) },
        {
          label: "Avg weekly usage",
          value:
            weeklyUsage > 0
              ? formatUnits(weeklyUsage, "units/week")
              : EMPTY_VALUE,
        },
        {
          label: "Days of supply",
          value: daysOfSupply ? formatDays(daysOfSupply) : EMPTY_VALUE,
          hint: "Based on on-hand quantity and average daily usage.",
        },
        {
          label: "Lead time",
          value: formatDays(baseLeadTimeDays),
          hint: "Default supplier lead time until customized.",
        },
        {
          label: "Reorder point",
          value: formatUnits(prediction.item.reorderThreshold),
        },
        {
          label: "Safety stock",
          value: formatUnits(prediction.reorderPrediction.safetyStock),
        },
        {
          label: "Recommended order",
          value:
            recommendedQuantity > 0
              ? formatUnits(recommendedQuantity)
              : EMPTY_VALUE,
        },
        {
          label: "Action window",
          value:
            daysUntilReorder !== null
              ? formatDays(daysUntilReorder)
              : EMPTY_VALUE,
        },
      ]);

      const evidence: string[] = [
        `On hand: ${prediction.item.quantity.toLocaleString("en-US")} units.`,
      ];
      if (dailyUsage > 0) {
        evidence.push(
          `Average daily usage: ${dailyUsage.toFixed(2)} units.`,
          `Reorder point: ${prediction.item.reorderThreshold} units with a safety buffer of ${prediction.reorderPrediction.safetyStock ?? 0}.`
        );
      }
      evidence.push(`Lead time assumed: ${baseLeadTimeDays} days.`);

      return {
        id: `reorder-${prediction.item.id}`,
        itemId: prediction.item.id,
        itemName: prediction.item.name,
        sourceType: "reorder",
        priority: prediction.reorderPrediction.priority,
        urgency,
        status: "open",
        reason: buildReorderReason(daysUntilReorder, dailyUsage),
        impactLabel: buildImpactLabel(potentialSavings, "Avoid stockout"),
        actionLabel: buildActionLabel(potentialSavings, "reorder"),
        confidenceScore: prediction.confidence,
        confidenceLevel,
        potentialSavings,
        daysUntilAction: daysUntilReorder ?? undefined,
        locationName: prediction.item.location,
        categoryName: prediction.item.category,
        expirationDate: prediction.item.expirationDate,
        recommendedQuantity: prediction.reorderPrediction.recommendedQuantity,
        reorderThreshold: prediction.item.reorderThreshold,
        safetyStock: prediction.reorderPrediction.safetyStock,
        currentDailyUsage: dailyUsage,
        rawReasoning: prediction.reasoning,
        evidence,
        numbers,
        usageSeries: [],
        orderingOption,
        draftPoId: draftSummary?.id,
        draftPoStatus: draftSummary?.status,
        draftPoTotal: draftSummary?.totalEstimatedCost ?? null,
        draftPoCreatedAt: draftSummary?.createdAt,
      };
    }
  );

  const wasteInsights: InsightItem[] = wastePredictions.map((prediction) => {
    const daysUntilExpiration = prediction.wasteRisk.daysUntilExpiration;
    const wasteQuantity = prediction.wasteRisk.estimatedWasteQuantity;
    const averageDailyUsage = prediction.usage?.averageDailyUsage ?? 0;
    const weeklyUsage = toWeeklyUsage(averageDailyUsage);
    const daysOfSupply = safeDivide(
      prediction.item.quantity,
      averageDailyUsage
    );
    const potentialSavings = prediction.wasteRisk.estimatedWasteValue ?? 0;
    const priority: InsightPriority =
      prediction.wasteRisk.riskLevel === "high"
        ? "high"
        : prediction.wasteRisk.riskLevel;
    const urgency = getUrgency(priority, daysUntilExpiration);
    const confidenceLevel = getConfidenceLevel(prediction.confidence);

    const numbers = buildNumbers([
      { label: "On hand", value: formatUnits(prediction.item.quantity) },
      {
        label: "Avg weekly usage",
        value:
          weeklyUsage > 0
            ? formatUnits(weeklyUsage, "units/week")
            : EMPTY_VALUE,
        hint: "Based on the last 30 days of usage.",
      },
      {
        label: "Days of supply",
        value: daysOfSupply ? formatDays(daysOfSupply) : EMPTY_VALUE,
        hint: "Based on current stock and average daily usage.",
      },
      {
        label: "Lead time",
        value: formatDays(baseLeadTimeDays),
        hint: "Shared assumption used for restock planning.",
      },
      {
        label: "Expiring soon",
        value: formatUnits(wasteQuantity),
      },
      {
        label: "Waste value",
        value:
          potentialSavings > 0 ? formatCurrency(potentialSavings) : EMPTY_VALUE,
      },
      {
        label: "Expiration window",
        value: formatDays(daysUntilExpiration),
      },
    ]);

    const evidence: string[] = [
      `Expires in ${formatDays(daysUntilExpiration).toLowerCase()}.`,
      `${wasteQuantity.toLocaleString("en-US")} units may expire at current usage.`,
    ];
    if (averageDailyUsage > 0) {
      evidence.push(
        `Average daily usage: ${averageDailyUsage.toFixed(2)} units.`
      );
    }
    if (potentialSavings > 0) {
      evidence.push(
        `Estimated waste value: ${formatCurrency(potentialSavings)}.`
      );
    }
    evidence.push(prediction.wasteRisk.recommendation);

    return {
      id: `waste-${prediction.item.id}`,
      itemId: prediction.item.id,
      itemName: prediction.item.name,
      sourceType: "waste_risk",
      priority,
      urgency,
      status: "open",
      reason: buildWasteReason(wasteQuantity, daysUntilExpiration),
      impactLabel: buildImpactLabel(potentialSavings, "Reduce waste"),
      actionLabel: buildActionLabel(potentialSavings, "waste_risk"),
      confidenceScore: prediction.confidence,
      confidenceLevel,
      potentialSavings,
      daysUntilAction: daysUntilExpiration,
      locationName: prediction.item.location,
      categoryName: prediction.item.category,
      expirationDate: prediction.item.expirationDate,
      estimatedWasteQuantity: wasteQuantity,
      estimatedWasteValue: potentialSavings,
      currentDailyUsage: averageDailyUsage,
      rawReasoning: prediction.reasoning,
      evidence,
      numbers,
      usageSeries: [],
    };
  });

  return [...reorderInsights, ...wasteInsights];
};

const matchesTypeFilter = (
  insight: InsightItem,
  type: InsightFilters["type"]
) => {
  if (type === "all") return true;
  if (type === "restock") return insight.sourceType === "reorder";
  if (type === "waste") return insight.sourceType === "waste_risk";
  return insight.potentialSavings > 0;
};

const matchesPriorityFilter = (
  insight: InsightItem,
  priority: InsightFilters["priority"]
) => {
  if (priority === "all") return true;
  return insight.priority === priority;
};

const matchesStatusFilter = (
  insight: InsightItem,
  status: InsightFilters["status"]
) => {
  if (status === "all") return true;
  return insight.status === status;
};

const matchesSearch = (insight: InsightItem, search: string) => {
  if (!search.trim()) return true;
  const query = search.trim().toLowerCase();
  return (
    insight.itemName.toLowerCase().includes(query) ||
    insight.reason.toLowerCase().includes(query) ||
    insight.categoryName?.toLowerCase().includes(query)
  );
};

const byDaysUntilAction = (a: InsightItem, b: InsightItem) => {
  if (a.daysUntilAction === undefined && b.daysUntilAction === undefined)
    return 0;
  if (a.daysUntilAction === undefined) return 1;
  if (b.daysUntilAction === undefined) return -1;
  return a.daysUntilAction - b.daysUntilAction;
};

const sorters: Record<
  InsightSortOption,
  (a: InsightItem, b: InsightItem) => number
> = {
  priority: (a, b) => {
    const urgencyDiff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    const priorityDiff =
      priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    const deadlineDiff = byDaysUntilAction(a, b);
    if (deadlineDiff !== 0) return deadlineDiff;
    return b.potentialSavings - a.potentialSavings;
  },
  savings: (a, b) => {
    const savingsDiff = b.potentialSavings - a.potentialSavings;
    if (savingsDiff !== 0) return savingsDiff;
    const priorityDiff =
      priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return byDaysUntilAction(a, b);
  },
  deadline: (a, b) => {
    const deadlineDiff = byDaysUntilAction(a, b);
    if (deadlineDiff !== 0) return deadlineDiff;
    const priorityDiff =
      priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.potentialSavings - a.potentialSavings;
  },
};

export const applyInsightFilters = (
  insights: InsightItem[],
  filters: InsightFilters
) => {
  const filtered = insights.filter((insight) => {
    return (
      matchesTypeFilter(insight, filters.type) &&
      matchesPriorityFilter(insight, filters.priority) &&
      matchesStatusFilter(insight, filters.status) &&
      matchesSearch(insight, filters.search)
    );
  });

  const sorter = sorters[filters.sort];
  return [...filtered].sort(sorter);
};

export const getInsightSummaryMetrics = (
  insights: InsightItem[]
): InsightSummaryMetrics => {
  const actionableInsights = insights.filter(
    (insight) => insight.status === "open"
  );
  const urgentCount = actionableInsights.filter(
    (insight) => insight.urgency === "urgent"
  ).length;
  const soonCount = actionableInsights.filter(
    (insight) => insight.urgency === "soon"
  ).length;
  const laterCount = actionableInsights.filter(
    (insight) => insight.urgency === "later"
  ).length;
  const estimatedSavings = actionableInsights.reduce(
    (sum, insight) => sum + (insight.potentialSavings || 0),
    0
  );
  const savingsOpportunities = actionableInsights.filter(
    (insight) => insight.potentialSavings > 0
  ).length;

  const overallConfidence =
    actionableInsights.length > 0
      ? Math.round(
          actionableInsights.reduce(
            (sum, insight) => sum + insight.confidenceScore,
            0
          ) / actionableInsights.length
        )
      : null;

  return {
    urgentCount,
    soonCount,
    laterCount,
    estimatedSavings,
    savingsOpportunities,
    overallConfidence,
  };
};

export const getPriorityLabel = (urgency: InsightUrgency) => {
  if (urgency === "urgent") return "Urgent";
  if (urgency === "soon") return "Soon";
  return "Later";
};

export const getPriorityTone = (urgency: InsightUrgency) => {
  if (urgency === "urgent") {
    return "border-l-red-500";
  }
  if (urgency === "soon") {
    return "border-l-amber-500";
  }
  return "border-l-border";
};

export const getDraftStatusLabel = (status: PurchaseOrderStatus) => {
  switch (status) {
    case "PENDING_APPROVAL":
      return "Approval pending";
    case "APPROVED":
      return "Approved";
    case "ORDERED":
      return "Ordered";
    case "CANCELLED":
      return "Cancelled";
    case "DRAFT":
    default:
      return "Draft ready";
  }
};

export const getDraftStatusTone = (status: PurchaseOrderStatus) => {
  switch (status) {
    case "PENDING_APPROVAL":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "ORDERED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "CANCELLED":
      return "border-border bg-muted/40 text-muted-foreground";
    case "DRAFT":
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
};
