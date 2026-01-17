import type { Item, Settings } from "@prisma/client";
import type {
  InventoryStatus,
  ItemWithStatus,
  InventorySummary,
  ItemWithRelations,
} from "@/types/inventory";

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
