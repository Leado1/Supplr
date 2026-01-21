/**
 * AI Prediction Engine - Core ML algorithms for inventory predictions
 * Handles reorder predictions, waste prevention, and threshold optimization
 */

import 'server-only';

import { prisma } from "@/lib/db";
import type { Item, InventoryChange, Organization } from "@prisma/client";

export type PredictionType =
  | "reorder"
  | "waste_risk"
  | "threshold_optimization"
  | "demand_forecast";

export interface PredictionResult {
  type: PredictionType;
  value: any;
  confidenceScore: number;
  expiresAt?: Date;
  reasoning: string;
}

export interface ItemUsagePattern {
  averageDailyUsage: number;
  usageVariance: number;
  seasonalTrend: number;
  lastRestockDays: number;
  expirationRiskScore: number;
}

export class PredictionEngine {
  /**
   * Analyzes historical usage patterns for an item
   */
  static async analyzeUsagePattern(itemId: string): Promise<ItemUsagePattern> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get recent inventory changes for this item
    const changes = await prisma.inventoryChange.findMany({
      where: {
        itemId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (changes.length < 2) {
      // Not enough data for analysis
      return {
        averageDailyUsage: 0,
        usageVariance: 0,
        seasonalTrend: 0,
        lastRestockDays: 999,
        expirationRiskScore: 0.5,
      };
    }

    // Calculate daily usage
    const usageChanges = changes.filter((c) => c.changeType === "usage");
    const totalUsage = usageChanges.reduce((sum, change) => {
      return sum + (change.quantityBefore - change.quantityAfter);
    }, 0);

    const daysCovered = Math.max(
      1,
      (Date.now() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24)
    );
    const averageDailyUsage = totalUsage / daysCovered;

    // Calculate variance in usage
    const dailyUsages: number[] = [];
    for (let i = 0; i < usageChanges.length - 1; i++) {
      const currentChange = usageChanges[i];
      const nextChange = usageChanges[i + 1];
      const daysBetween = Math.max(
        1,
        (nextChange.createdAt.getTime() - currentChange.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const usageInPeriod =
        currentChange.quantityBefore - currentChange.quantityAfter;
      dailyUsages.push(usageInPeriod / daysBetween);
    }

    const variance =
      dailyUsages.length > 1
        ? dailyUsages.reduce(
            (sum, usage) => sum + Math.pow(usage - averageDailyUsage, 2),
            0
          ) / dailyUsages.length
        : 0;

    // Find last restock
    const restockChanges = changes
      .filter((c) => c.changeType === "restock")
      .reverse();
    const lastRestock = restockChanges[0];
    const lastRestockDays = lastRestock
      ? (Date.now() - lastRestock.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    return {
      averageDailyUsage,
      usageVariance: Math.sqrt(variance),
      seasonalTrend: 0, // TODO: Implement seasonal analysis
      lastRestockDays,
      expirationRiskScore: this.calculateExpirationRisk(
        averageDailyUsage,
        changes
      ),
    };
  }

  /**
   * Predicts when an item should be reordered
   */
  static async generateReorderPrediction(
    item: Item
  ): Promise<PredictionResult> {
    const pattern = await this.analyzeUsagePattern(item.id);

    if (pattern.averageDailyUsage <= 0) {
      return {
        type: "reorder",
        value: {
          daysUntilReorder: null,
          recommendedQuantity: null,
          priority: "low",
        },
        confidenceScore: 0.1,
        reasoning: "Insufficient usage data for prediction",
      };
    }

    // Calculate days until stock reaches reorder threshold
    const currentQuantity = item.quantity;
    const safetyBuffer = Math.max(3, pattern.usageVariance * 2); // Buffer for uncertainty
    const daysUntilReorder = Math.max(
      0,
      (currentQuantity - item.reorderThreshold - safetyBuffer) /
        pattern.averageDailyUsage
    );

    // Recommend quantity based on usage pattern and lead time
    const estimatedLeadTime = 7; // TODO: Make configurable per item/supplier
    const recommendedQuantity = Math.ceil(
      pattern.averageDailyUsage * (estimatedLeadTime + 14) + safetyBuffer
    );

    let priority: "low" | "medium" | "high" = "low";
    if (daysUntilReorder <= 3) priority = "high";
    else if (daysUntilReorder <= 7) priority = "medium";

    const confidenceScore = this.calculateConfidence(pattern, currentQuantity);

    return {
      type: "reorder",
      value: {
        daysUntilReorder: Math.round(daysUntilReorder),
        recommendedQuantity,
        priority,
        currentUsage: Math.round(pattern.averageDailyUsage * 100) / 100,
        safetyStock: Math.round(safetyBuffer),
      },
      confidenceScore,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      reasoning: `Based on ${Math.round(pattern.averageDailyUsage * 100) / 100} daily usage over 30 days`,
    };
  }

  /**
   * Predicts waste risk for expiring items
   */
  static async generateWasteRiskPrediction(
    item: Item
  ): Promise<PredictionResult> {
    const pattern = await this.analyzeUsagePattern(item.id);

    const daysUntilExpiration = Math.max(
      0,
      (item.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    let wasteRisk: "low" | "medium" | "high" = "low";
    let wasteQuantity = 0;

    if (pattern.averageDailyUsage > 0) {
      const projectedUsage = pattern.averageDailyUsage * daysUntilExpiration;
      wasteQuantity = Math.max(0, item.quantity - projectedUsage);

      const wastePercentage = wasteQuantity / item.quantity;
      if (wastePercentage > 0.5) wasteRisk = "high";
      else if (wastePercentage > 0.2) wasteRisk = "medium";
    } else if (daysUntilExpiration <= 7 && item.quantity > 0) {
      wasteRisk = "high";
      wasteQuantity = item.quantity;
    }

    const confidenceScore =
      pattern.averageDailyUsage > 0
        ? Math.min(
            0.95,
            0.3 +
              (pattern.lastRestockDays < 30 ? 0.4 : 0) +
              (pattern.usageVariance < 2 ? 0.3 : 0)
          )
        : 0.2;

    return {
      type: "waste_risk",
      value: {
        riskLevel: wasteRisk,
        estimatedWasteQuantity: Math.round(wasteQuantity),
        daysUntilExpiration: Math.round(daysUntilExpiration),
        estimatedWasteValue:
          Math.round(wasteQuantity * Number(item.unitCost) * 100) / 100,
        recommendation: this.getWastePreventionRecommendation(
          wasteRisk,
          wasteQuantity,
          daysUntilExpiration
        ),
      },
      confidenceScore,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
      reasoning: `Based on ${Math.round(pattern.averageDailyUsage * 100) / 100} daily usage pattern`,
    };
  }

  /**
   * Optimizes reorder thresholds based on usage patterns
   */
  static async generateThresholdOptimization(
    item: Item
  ): Promise<PredictionResult> {
    const pattern = await this.analyzeUsagePattern(item.id);

    if (pattern.averageDailyUsage <= 0) {
      return {
        type: "threshold_optimization",
        value: {
          currentThreshold: item.reorderThreshold,
          recommendedThreshold: item.reorderThreshold,
          reasoning: "Insufficient usage data",
        },
        confidenceScore: 0.1,
        reasoning: "Not enough usage data for threshold optimization",
      };
    }

    // Calculate optimal threshold: lead time + safety stock
    const leadTime = 7; // TODO: Make configurable
    const safetyStock = Math.ceil(
      pattern.averageDailyUsage * 3 + pattern.usageVariance * 2
    );
    const recommendedThreshold = Math.ceil(
      pattern.averageDailyUsage * leadTime + safetyStock
    );

    const improvement = item.reorderThreshold - recommendedThreshold;
    const improvementPercent = Math.round(
      (improvement / item.reorderThreshold) * 100
    );

    let reasoning = "";
    if (improvement > 5) {
      reasoning = `Can reduce threshold by ${improvement} units (${improvementPercent}%) to free up capital`;
    } else if (improvement < -5) {
      reasoning = `Should increase threshold by ${Math.abs(improvement)} units to prevent stockouts`;
    } else {
      reasoning = "Current threshold is optimal";
    }

    const confidenceScore = Math.min(
      0.9,
      0.4 +
        (pattern.lastRestockDays < 60 ? 0.3 : 0) +
        (pattern.usageVariance < 3 ? 0.2 : 0)
    );

    return {
      type: "threshold_optimization",
      value: {
        currentThreshold: item.reorderThreshold,
        recommendedThreshold,
        potentialSavings:
          improvement > 0 ? improvement * Number(item.unitCost) : 0,
        confidence: Math.round(confidenceScore * 100),
      },
      confidenceScore,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      reasoning,
    };
  }

  /**
   * Calculate confidence score based on data quality
   */
  private static calculateConfidence(
    pattern: ItemUsagePattern,
    currentQuantity: number
  ): number {
    let confidence = 0.3; // Base confidence

    // More usage data = higher confidence
    if (pattern.averageDailyUsage > 0) confidence += 0.3;

    // Recent restock data = higher confidence
    if (pattern.lastRestockDays < 30) confidence += 0.2;

    // Consistent usage = higher confidence
    if (pattern.usageVariance < 2) confidence += 0.2;

    // Sufficient current stock = higher confidence
    if (currentQuantity > pattern.averageDailyUsage * 5) confidence += 0.1;

    return Math.min(0.95, confidence);
  }

  /**
   * Calculate expiration risk score
   */
  private static calculateExpirationRisk(
    averageDailyUsage: number,
    changes: InventoryChange[]
  ): number {
    // Higher usage = lower expiration risk
    if (averageDailyUsage <= 0) return 0.8;
    if (averageDailyUsage > 5) return 0.1;
    return Math.max(0.1, 0.8 - (averageDailyUsage / 5) * 0.7);
  }

  /**
   * Get waste prevention recommendation
   */
  private static getWastePreventionRecommendation(
    riskLevel: string,
    wasteQuantity: number,
    daysUntilExpiration: number
  ): string {
    if (riskLevel === "high") {
      if (daysUntilExpiration <= 3) {
        return `URGENT: Use ${wasteQuantity} units immediately - expires in ${Math.round(daysUntilExpiration)} days`;
      }
      return `High waste risk: Prioritize using ${wasteQuantity} units over next ${Math.round(daysUntilExpiration)} days`;
    } else if (riskLevel === "medium") {
      return `Moderate waste risk: Monitor usage and prioritize this item`;
    }
    return "Low waste risk - on track for normal consumption";
  }
}
