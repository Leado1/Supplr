export type InsightSourceType = "reorder" | "waste_risk";

export type InsightPriority = "low" | "medium" | "high" | "critical";

export type InsightUrgency = "urgent" | "soon" | "later";

export type InsightStatus = "open" | "snoozed" | "done";

export type InsightFilterType = "all" | "restock" | "waste" | "savings";

export type InsightSortOption = "priority" | "savings" | "deadline";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type DateRangeOption = "30" | "90" | "180" | "custom";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "ORDERED"
  | "CANCELLED";

export interface InsightNumber {
  label: string;
  value: string;
  hint?: string;
}

export interface InsightDraftSummary {
  id: string;
  status: PurchaseOrderStatus;
  totalEstimatedCost: number | null;
  createdAt?: string;
}

export interface InsightOrderingOption {
  name: string;
  url: string;
  estimatedCost: number;
  deliveryDays: number;
}

export interface InsightItem {
  id: string;
  itemId: string;
  itemName: string;
  sourceType: InsightSourceType;
  priority: InsightPriority;
  urgency: InsightUrgency;
  status: InsightStatus;
  reason: string;
  impactLabel: string;
  actionLabel: string;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  potentialSavings: number;
  daysUntilAction?: number;
  locationName?: string;
  categoryName?: string;
  expirationDate?: string;
  recommendedQuantity?: number | null;
  reorderThreshold?: number;
  safetyStock?: number;
  currentDailyUsage?: number;
  estimatedWasteQuantity?: number;
  estimatedWasteValue?: number;
  rawReasoning: string;
  evidence: string[];
  numbers: InsightNumber[];
  usageSeries: number[];
  orderingOption?: InsightOrderingOption;
  draftPoId?: string;
  draftPoStatus?: PurchaseOrderStatus;
  draftPoTotal?: number | null;
  draftPoCreatedAt?: string;
  snoozedUntil?: string;
}

export interface InsightSummaryMetrics {
  urgentCount: number;
  soonCount: number;
  laterCount: number;
  estimatedSavings: number;
  savingsOpportunities: number;
  overallConfidence: number | null;
}

export interface InsightFilters {
  type: InsightFilterType;
  priority: "all" | InsightPriority;
  status: "all" | InsightStatus;
  search: string;
  sort: InsightSortOption;
}

export interface InsightAutomationSettings {
  autoCreateDrafts: boolean;
  requireApproval: boolean;
}
