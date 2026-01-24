import type { InventoryStatus, ItemWithStatus, InventorySummary } from "@/types/inventory";

/**
 * Get status badge color for UI components
 */
export function getStatusBadgeVariant(
  status: InventoryStatus
): "default" | "secondary" | "destructive" | "warning" | "success" {
  switch (status) {
    case "ok":
      return "success";
    case "low_stock":
      return "warning";
    case "expiring_soon":
      return "warning";
    case "expired":
      return "destructive";
    default:
      return "default";
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