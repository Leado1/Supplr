import 'server-only';

import type { Item, Settings } from "@prisma/client";
import type {
  InventoryStatus,
  ItemWithStatus,
  InventorySummary,
  ItemWithRelations,
} from "@/types/inventory";
import { PredictionEngine } from "@/lib/ai";

/**
 * Calculate the status of an inventory item based on current date,
 * expiration date, quantity, and organization settings
 */
export function calculateItemStatus(
  item: Item,
  settings: Settings,
  currentDate: Date = new Date()
): InventoryStatus {
  const { quantity, expirationDate, reorderThreshold } = item;
  const { expirationWarningDays, lowStockThreshold } = settings;

  // Check if expired
  if (currentDate > expirationDate) {
    return "expired";
  }

  // Check if expiring soon
  const daysUntilExpiration = Math.floor(
    (expirationDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiration <= expirationWarningDays) {
    return "expiring_soon";
  }

  // Check if low stock (use item-specific threshold or organization default)
  const effectiveThreshold = reorderThreshold || lowStockThreshold;
  if (quantity <= effectiveThreshold) {
    return "low_stock";
  }

  return "ok";
}

/**
 * Add status to an array of items with their settings
 */
export function addStatusToItems(
  items: ItemWithRelations[],
  settings: Settings,
  currentDate: Date = new Date()
): ItemWithStatus[] {
  return items.map((item) => ({
    ...item,
    status: calculateItemStatus(item, settings, currentDate),
  }));
}

/**
 * Calculate summary statistics for the inventory dashboard
 */
export function calculateInventorySummary(
  items: ItemWithStatus[]
): InventorySummary {
  const summary = items.reduce(
    (acc, item) => {
      acc.totalItems += 1;
      acc.totalValue += Number(item.unitCost) * item.quantity;

      switch (item.status) {
        case "expiring_soon":
          acc.expiringSoon += 1;
          break;
        case "expired":
          acc.expired += 1;
          break;
        case "low_stock":
          acc.lowStock += 1;
          break;
      }

      return acc;
    },
    {
      totalItems: 0,
      totalValue: 0,
      expiringSoon: 0,
      expired: 0,
      lowStock: 0,
    }
  );

  return summary;
}

/**
 * Filter items by status
 */
export function filterItemsByStatus(
  items: ItemWithStatus[],
  status: InventoryStatus | "all"
): ItemWithStatus[] {
  if (status === "all") {
    return items;
  }
  return items.filter((item) => item.status === status);
}

/**
 * Search items by name, SKU, or category name
 */
export function searchItems(
  items: ItemWithStatus[],
  searchTerm: string
): ItemWithStatus[] {
  if (!searchTerm.trim()) {
    return items;
  }

  const term = searchTerm.toLowerCase().trim();
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(term) ||
      (item.sku && item.sku.toLowerCase().includes(term)) ||
      item.category.name.toLowerCase().includes(term)
  );
}

/**
 * Get status badge color for UI components
 */
export function getStatusBadgeVariant(
  status: InventoryStatus
): "default" | "secondary" | "destructive" | "warning" {
  switch (status) {
    case "ok":
      return "default";
    case "low_stock":
      return "warning";
    case "expiring_soon":
      return "warning";
    case "expired":
      return "destructive";
    default:
      return "secondary";
  }
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: InventoryStatus): string {
  switch (status) {
    case "ok":
      return "In Stock";
    case "low_stock":
      return "Low Stock";
    case "expiring_soon":
      return "Expiring Soon";
    case "expired":
      return "Expired";
    default:
      return "Unknown";
  }
}

/**
 * Get items that need attention (expired, expiring soon, or low stock)
 */
export function getItemsNeedingAttention(
  items: ItemWithStatus[]
): ItemWithStatus[] {
  return items.filter(
    (item) =>
      item.status === "expired" ||
      item.status === "expiring_soon" ||
      item.status === "low_stock"
  );
}

/**
 * Calculate waste report - items that have expired
 */
export function calculateWasteReport(
  items: ItemWithStatus[],
  days: number = 30
): {
  expiredItems: ItemWithStatus[];
  totalWasteValue: number;
  wasteCount: number;
} {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const expiredItems = items.filter(
    (item) => item.status === "expired" && item.expirationDate >= cutoffDate
  );

  const totalWasteValue = expiredItems.reduce(
    (sum, item) => sum + Number(item.unitCost) * item.quantity,
    0
  );

  return {
    expiredItems,
    totalWasteValue,
    wasteCount: expiredItems.length,
  };
}

/**
 * Enhanced status with AI predictions
 */
export type InventoryStatusWithAI =
  | InventoryStatus
  | "ai_waste_risk"
  | "ai_reorder_soon";

export interface ItemWithAIStatus extends ItemWithStatus {
  aiStatus?: InventoryStatusWithAI;
  aiInsights?: {
    wasteRisk?: "low" | "medium" | "high";
    reorderSuggestion?: {
      daysUntilReorder: number;
      recommendedQuantity: number;
      priority: "low" | "medium" | "high";
    };
    confidence?: number;
  };
}

/**
 * Add AI-enhanced status to an item
 */
export async function addAIStatusToItem(
  item: ItemWithRelations,
  settings: Settings,
  currentDate: Date = new Date()
): Promise<ItemWithAIStatus> {
  const baseStatus = calculateItemStatus(item, settings, currentDate);
  let aiStatus: InventoryStatusWithAI = baseStatus;
  const aiInsights: ItemWithAIStatus["aiInsights"] = {};

  try {
    // Generate waste risk prediction
    const wasteRiskPrediction =
      await PredictionEngine.generateWasteRiskPrediction(item);
    if (wasteRiskPrediction.value.riskLevel !== "low") {
      aiInsights.wasteRisk = wasteRiskPrediction.value.riskLevel;
      if (
        wasteRiskPrediction.value.riskLevel === "high" &&
        baseStatus === "ok"
      ) {
        aiStatus = "ai_waste_risk";
      }
    }

    // Generate reorder prediction
    const reorderPrediction =
      await PredictionEngine.generateReorderPrediction(item);
    if (reorderPrediction.value.daysUntilReorder !== null) {
      aiInsights.reorderSuggestion = {
        daysUntilReorder: reorderPrediction.value.daysUntilReorder,
        recommendedQuantity: reorderPrediction.value.recommendedQuantity,
        priority: reorderPrediction.value.priority,
      };

      if (
        reorderPrediction.value.daysUntilReorder <= 14 &&
        baseStatus === "ok"
      ) {
        aiStatus = "ai_reorder_soon";
      }
    }

    // Use the higher confidence score from both predictions
    const maxConfidence = Math.max(
      wasteRiskPrediction.confidenceScore,
      reorderPrediction.confidenceScore
    );
    aiInsights.confidence = Math.round(maxConfidence * 100);
  } catch (error) {
    console.error(`Error generating AI status for item ${item.id}:`, error);
  }

  return {
    ...item,
    status: baseStatus,
    aiStatus,
    aiInsights,
  };
}

/**
 * Bulk add AI status to multiple items (more efficient)
 */
export async function addAIStatusToItems(
  items: ItemWithRelations[],
  settings: Settings,
  currentDate: Date = new Date()
): Promise<ItemWithAIStatus[]> {
  const results = await Promise.all(
    items.map(async (item) => {
      try {
        return await addAIStatusToItem(item, settings, currentDate);
      } catch (error) {
        console.error(`Error processing AI status for item ${item.id}:`, error);
        return {
          ...item,
          status: calculateItemStatus(item, settings, currentDate),
          aiStatus: calculateItemStatus(item, settings, currentDate),
        };
      }
    })
  );

  return results;
}

/**
 * Get AI status badge variant for UI components
 */
export function getAIStatusBadgeVariant(
  status: InventoryStatusWithAI
): "default" | "secondary" | "destructive" | "warning" | "ai" {
  switch (status) {
    case "ai_waste_risk":
      return "warning";
    case "ai_reorder_soon":
      return "secondary";
    case "ok":
      return "default";
    case "low_stock":
      return "warning";
    case "expiring_soon":
      return "warning";
    case "expired":
      return "destructive";
    default:
      return "secondary";
  }
}

/**
 * Get AI status label for UI components
 */
export function getAIStatusLabel(status: InventoryStatusWithAI): string {
  switch (status) {
    case "ai_waste_risk":
      return "AI: Waste Risk";
    case "ai_reorder_soon":
      return "AI: Reorder Soon";
    case "ok":
      return "In Stock";
    case "low_stock":
      return "Low Stock";
    case "expiring_soon":
      return "Expiring Soon";
    case "expired":
      return "Expired";
    default:
      return "Unknown";
  }
}

/**
 * Calculate enhanced inventory summary with AI insights
 */
export function calculateAIInventorySummary(
  items: ItemWithAIStatus[]
): InventorySummary & {
  aiWasteRiskItems: number;
  aiReorderSoonItems: number;
  totalAIPotentialSavings: number;
} {
  const baseSummary = calculateInventorySummary(items);

  const aiWasteRiskItems = items.filter(
    (item) => item.aiInsights?.wasteRisk && item.aiInsights.wasteRisk !== "low"
  ).length;

  const aiReorderSoonItems = items.filter(
    (item) =>
      item.aiInsights?.reorderSuggestion &&
      item.aiInsights.reorderSuggestion.daysUntilReorder <= 14
  ).length;

  // Calculate potential savings from waste prevention
  const totalAIPotentialSavings = items
    .filter((item) => item.aiInsights?.wasteRisk === "high")
    .reduce((sum, item) => {
      // Estimate 20% of item value could be saved from waste prevention
      return sum + Number(item.unitCost) * item.quantity * 0.2;
    }, 0);

  return {
    ...baseSummary,
    aiWasteRiskItems,
    aiReorderSoonItems,
    totalAIPotentialSavings: Math.round(totalAIPotentialSavings * 100) / 100,
  };
}

/**
 * Get items with high-priority AI recommendations
 */
export function getAIHighPriorityItems(
  items: ItemWithAIStatus[]
): ItemWithAIStatus[] {
  return items
    .filter((item) => {
      const hasHighWasteRisk = item.aiInsights?.wasteRisk === "high";
      const hasUrgentReorder =
        item.aiInsights?.reorderSuggestion?.priority === "high";
      const hasHighConfidence = (item.aiInsights?.confidence || 0) >= 70;

      return (hasHighWasteRisk || hasUrgentReorder) && hasHighConfidence;
    })
    .sort((a, b) => {
      // Sort by confidence and urgency
      const aScore =
        (a.aiInsights?.confidence || 0) +
        (a.aiInsights?.wasteRisk === "high" ? 30 : 0) +
        (a.aiInsights?.reorderSuggestion?.priority === "high" ? 20 : 0);

      const bScore =
        (b.aiInsights?.confidence || 0) +
        (b.aiInsights?.wasteRisk === "high" ? 30 : 0) +
        (b.aiInsights?.reorderSuggestion?.priority === "high" ? 20 : 0);

      return bScore - aScore;
    });
}
