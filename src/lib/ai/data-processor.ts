/**
 * AI Data Processor - Historical data analysis and preparation for ML models
 * Handles data aggregation, cleaning, and feature extraction
 */

import 'server-only';

import { prisma } from "@/lib/db";
import type {
  Item,
  InventoryChange,
  Organization,
  Location,
} from "@prisma/client";

export interface OrganizationInsights {
  totalItems: number;
  totalValue: number;
  averageDailyUsage: number;
  wasteRiskItems: number;
  understockedItems: number;
  optimizableThresholds: number;
  projectedMonthlySavings: number;
}

export interface ItemAnalytics {
  itemId: string;
  name: string;
  category: string;
  location?: string;
  totalUsage30Days: number;
  averageDailyUsage: number;
  daysOfStock: number;
  turnoverRate: number;
  wasteRisk: number;
  costImpact: number;
}

export interface UsageTrend {
  date: string;
  usage: number;
  restock: number;
  waste: number;
}

export class DataProcessor {
  /**
   * Generate comprehensive organization insights
   */
  static async generateOrganizationInsights(
    organizationId: string
  ): Promise<OrganizationInsights> {
    const [items, recentChanges] = await Promise.all([
      prisma.item.findMany({
        where: { organizationId },
        include: { category: true, location: true },
      }),
      prisma.inventoryChange.findMany({
        where: {
          organizationId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    const totalItems = items.length;
    const totalValue = items.reduce(
      (sum, item) => sum + item.quantity * Number(item.unitCost),
      0
    );

    // Calculate average daily usage across all items
    const usageChanges = recentChanges.filter((c) => c.changeType === "usage");
    const totalUsage = usageChanges.reduce((sum, change) => {
      return sum + (change.quantityBefore - change.quantityAfter);
    }, 0);
    const averageDailyUsage = totalUsage / 30;

    // Analyze risk items
    const currentDate = new Date();
    let wasteRiskItems = 0;
    let understockedItems = 0;
    let optimizableThresholds = 0;
    let projectedMonthlySavings = 0;

    for (const item of items) {
      const daysUntilExpiration =
        (item.expirationDate.getTime() - currentDate.getTime()) /
        (1000 * 60 * 60 * 24);
      const itemChanges = recentChanges.filter((c) => c.itemId === item.id);
      const itemUsage = this.calculateItemUsage(itemChanges);

      // Waste risk calculation
      if (daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
        const projectedUsage =
          itemUsage.averageDailyUsage * daysUntilExpiration;
        if (item.quantity > projectedUsage * 1.5) {
          wasteRiskItems++;
          const potentialWaste = item.quantity - projectedUsage;
          projectedMonthlySavings +=
            potentialWaste * Number(item.unitCost) * 0.1; // 10% of potential waste as savings
        }
      }

      // Understock risk
      if (
        item.quantity <= item.reorderThreshold &&
        itemUsage.averageDailyUsage > 0
      ) {
        understockedItems++;
      }

      // Threshold optimization opportunities
      if (itemUsage.averageDailyUsage > 0) {
        const optimalThreshold = itemUsage.averageDailyUsage * 7 + 5; // 7 days + safety
        if (Math.abs(item.reorderThreshold - optimalThreshold) > 3) {
          optimizableThresholds++;
          // Savings from better capital allocation
          if (item.reorderThreshold > optimalThreshold) {
            projectedMonthlySavings +=
              (item.reorderThreshold - optimalThreshold) *
              Number(item.unitCost) *
              0.02; // 2% carrying cost
          }
        }
      }
    }

    return {
      totalItems,
      totalValue: Math.round(totalValue * 100) / 100,
      averageDailyUsage: Math.round(averageDailyUsage * 100) / 100,
      wasteRiskItems,
      understockedItems,
      optimizableThresholds,
      projectedMonthlySavings: Math.round(projectedMonthlySavings * 100) / 100,
    };
  }

  /**
   * Generate analytics for all items in an organization
   */
  static async generateItemAnalytics(
    organizationId: string,
    locationId?: string
  ): Promise<ItemAnalytics[]> {
    const whereClause: any = { organizationId };
    if (locationId) {
      whereClause.locationId = locationId;
    }

    const [items, recentChanges] = await Promise.all([
      prisma.item.findMany({
        where: whereClause,
        include: { category: true, location: true },
      }),
      prisma.inventoryChange.findMany({
        where: {
          organizationId,
          ...(locationId && { locationId }),
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return items.map((item) => {
      const itemChanges = recentChanges.filter((c) => c.itemId === item.id);
      const usage = this.calculateItemUsage(itemChanges);
      const daysOfStock =
        usage.averageDailyUsage > 0
          ? item.quantity / usage.averageDailyUsage
          : 999;
      const turnoverRate =
        usage.totalUsage > 0
          ? (usage.totalUsage / (item.quantity + usage.totalUsage)) * 30
          : 0;

      // Calculate waste risk
      const daysUntilExpiration =
        (item.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      let wasteRisk = 0;
      if (daysUntilExpiration > 0 && usage.averageDailyUsage > 0) {
        const projectedUsage = usage.averageDailyUsage * daysUntilExpiration;
        wasteRisk = Math.max(
          0,
          Math.min(1, (item.quantity - projectedUsage) / item.quantity)
        );
      }

      return {
        itemId: item.id,
        name: item.name,
        category: item.category.name,
        location: item.location?.name,
        totalUsage30Days: usage.totalUsage,
        averageDailyUsage: Math.round(usage.averageDailyUsage * 100) / 100,
        daysOfStock: Math.round(daysOfStock),
        turnoverRate: Math.round(turnoverRate * 100) / 100,
        wasteRisk: Math.round(wasteRisk * 100) / 100,
        costImpact:
          Math.round(item.quantity * Number(item.unitCost) * 100) / 100,
      };
    });
  }

  /**
   * Generate usage trends for visualization
   */
  static async generateUsageTrends(
    organizationId: string,
    days: number = 30,
    itemId?: string,
    locationId?: string
  ): Promise<UsageTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const whereClause: any = {
      organizationId,
      createdAt: { gte: startDate },
    };

    if (itemId) {
      whereClause.itemId = itemId;
    }

    if (locationId) {
      whereClause.locationId = locationId;
    }

    const changes = await prisma.inventoryChange.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
    });

    // Group changes by date
    const dailyData = new Map<
      string,
      { usage: number; restock: number; waste: number }
    >();

    // Initialize all dates with zero values
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateKey = date.toISOString().split("T")[0];
      dailyData.set(dateKey, { usage: 0, restock: 0, waste: 0 });
    }

    // Aggregate changes by date and type
    changes.forEach((change) => {
      const dateKey = change.createdAt.toISOString().split("T")[0];
      const existing = dailyData.get(dateKey) || {
        usage: 0,
        restock: 0,
        waste: 0,
      };

      switch (change.changeType) {
        case "usage":
          existing.usage += Math.max(
            0,
            change.quantityBefore - change.quantityAfter
          );
          break;
        case "restock":
          existing.restock += Math.max(
            0,
            change.quantityAfter - change.quantityBefore
          );
          break;
        case "waste":
          existing.waste += Math.max(
            0,
            change.quantityBefore - change.quantityAfter
          );
          break;
      }

      dailyData.set(dateKey, existing);
    });

    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      usage: data.usage,
      restock: data.restock,
      waste: data.waste,
    }));
  }

  /**
   * Find items needing immediate attention
   */
  static async getActionableItems(organizationId: string): Promise<{
    criticalReorders: ItemAnalytics[];
    wasteRisks: ItemAnalytics[];
    thresholdOptimizations: ItemAnalytics[];
  }> {
    const analytics = await this.generateItemAnalytics(organizationId);

    const criticalReorders = analytics
      .filter((item) => item.daysOfStock <= 7 && item.averageDailyUsage > 0)
      .sort((a, b) => a.daysOfStock - b.daysOfStock)
      .slice(0, 10);

    const wasteRisks = analytics
      .filter((item) => item.wasteRisk > 0.3)
      .sort((a, b) => b.wasteRisk - a.wasteRisk)
      .slice(0, 10);

    const thresholdOptimizations = analytics
      .filter((item) => {
        if (item.averageDailyUsage <= 0) return false;
        const optimalThreshold = item.averageDailyUsage * 7 + 5;
        return (
          Math.abs(
            optimalThreshold - item.daysOfStock * item.averageDailyUsage
          ) > 3
        );
      })
      .sort((a, b) => b.costImpact - a.costImpact)
      .slice(0, 10);

    return {
      criticalReorders,
      wasteRisks,
      thresholdOptimizations,
    };
  }

  /**
   * Calculate item usage metrics from changes
   */
  private static calculateItemUsage(changes: InventoryChange[]): {
    totalUsage: number;
    averageDailyUsage: number;
    totalRestock: number;
    totalWaste: number;
  } {
    let totalUsage = 0;
    let totalRestock = 0;
    let totalWaste = 0;

    changes.forEach((change) => {
      const quantityDiff = change.quantityBefore - change.quantityAfter;

      switch (change.changeType) {
        case "usage":
          totalUsage += Math.max(0, quantityDiff);
          break;
        case "restock":
          totalRestock += Math.max(0, -quantityDiff);
          break;
        case "waste":
          totalWaste += Math.max(0, quantityDiff);
          break;
      }
    });

    const averageDailyUsage = totalUsage / 30;

    return {
      totalUsage,
      averageDailyUsage,
      totalRestock,
      totalWaste,
    };
  }

  /**
   * Clean and validate historical data for AI training
   */
  static async cleanHistoricalData(organizationId: string): Promise<{
    cleanedChanges: number;
    invalidChanges: number;
    dataQualityScore: number;
  }> {
    const allChanges = await prisma.inventoryChange.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    });

    let cleanedChanges = 0;
    let invalidChanges = 0;
    const validChanges: InventoryChange[] = [];

    for (const change of allChanges) {
      // Validate change data
      if (
        change.quantityBefore >= 0 &&
        change.quantityAfter >= 0 &&
        Math.abs(change.quantityBefore - change.quantityAfter) > 0 &&
        Math.abs(change.quantityBefore - change.quantityAfter) < 10000 // Reasonable max change
      ) {
        validChanges.push(change);
        cleanedChanges++;
      } else {
        invalidChanges++;
      }
    }

    // Calculate data quality score
    const totalChanges = allChanges.length;
    const dataQualityScore =
      totalChanges > 0 ? cleanedChanges / totalChanges : 0;

    return {
      cleanedChanges,
      invalidChanges,
      dataQualityScore,
    };
  }

  /**
   * Export data for external ML training (future use)
   */
  static async exportTrainingData(organizationId: string): Promise<{
    items: any[];
    changes: any[];
    features: any[];
  }> {
    const [items, changes] = await Promise.all([
      prisma.item.findMany({
        where: { organizationId },
        include: { category: true, location: true },
      }),
      prisma.inventoryChange.findMany({
        where: { organizationId },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Generate feature vectors for each item
    const features = await Promise.all(
      items.map(async (item) => {
        const itemChanges = changes.filter((c) => c.itemId === item.id);
        const usage = this.calculateItemUsage(itemChanges);

        return {
          itemId: item.id,
          category: item.category.name,
          hasLocation: !!item.location,
          currentQuantity: item.quantity,
          unitCost: Number(item.unitCost),
          reorderThreshold: item.reorderThreshold,
          daysUntilExpiration:
            (item.expirationDate.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
          averageDailyUsage: usage.averageDailyUsage,
          usageVariability: this.calculateUsageVariability(itemChanges),
          turnoverRate:
            usage.totalUsage > 0 ? usage.totalUsage / item.quantity : 0,
          changeFrequency: itemChanges.length,
        };
      })
    );

    return {
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        categoryId: item.categoryId,
        quantity: item.quantity,
        unitCost: Number(item.unitCost),
        expirationDate: item.expirationDate,
        reorderThreshold: item.reorderThreshold,
      })),
      changes: changes.map((change) => ({
        itemId: change.itemId,
        quantityBefore: change.quantityBefore,
        quantityAfter: change.quantityAfter,
        changeType: change.changeType,
        createdAt: change.createdAt,
      })),
      features,
    };
  }

  /**
   * Calculate usage variability for an item
   */
  private static calculateUsageVariability(changes: InventoryChange[]): number {
    const usageChanges = changes
      .filter((c) => c.changeType === "usage")
      .map((c) => c.quantityBefore - c.quantityAfter);

    if (usageChanges.length < 2) return 0;

    const mean =
      usageChanges.reduce((sum, usage) => sum + usage, 0) / usageChanges.length;
    const variance =
      usageChanges.reduce((sum, usage) => sum + Math.pow(usage - mean, 2), 0) /
      usageChanges.length;

    return Math.sqrt(variance);
  }
}
