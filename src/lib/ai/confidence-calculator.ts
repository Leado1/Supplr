/**
 * AI Confidence Calculator - Risk assessment and uncertainty quantification
 * Provides confidence scores for AI predictions and recommendations
 */

import 'server-only';

import { prisma } from "@/lib/db";
import type { Item, InventoryChange } from "@prisma/client";

export interface ConfidenceFactors {
  dataQuality: number; // Quality and quantity of historical data
  patternConsistency: number; // How consistent usage patterns are
  recentActivity: number; // How recently the item has been used
  seasonalReliability: number; // Seasonal pattern stability
  itemMaturity: number; // How long the item has been tracked
}

export interface ConfidenceMetrics {
  overall: number;
  factors: ConfidenceFactors;
  reasoning: string[];
  dataPoints: number;
  recommendationReliability: "low" | "medium" | "high";
}

export class ConfidenceCalculator {
  /**
   * Calculate comprehensive confidence metrics for an item
   */
  static async calculateItemConfidence(
    itemId: string,
    predictionType: string
  ): Promise<ConfidenceMetrics> {
    const [item, changes, predictions] = await Promise.all([
      prisma.item.findUnique({ where: { id: itemId } }),
      this.getRecentChanges(itemId, 90), // 90 days of history
      this.getRecentPredictions(itemId, predictionType, 30),
    ]);

    if (!item) {
      throw new Error("Item not found");
    }

    const factors = await this.calculateConfidenceFactors(item, changes);
    const overall = this.calculateOverallConfidence(factors, predictions);
    const reasoning = this.generateReasoningExplanation(
      factors,
      changes.length
    );
    const reliability = this.determineReliabilityLevel(overall);

    return {
      overall: Math.round(overall * 100) / 100,
      factors,
      reasoning,
      dataPoints: changes.length,
      recommendationReliability: reliability,
    };
  }

  /**
   * Calculate individual confidence factors
   */
  private static async calculateConfidenceFactors(
    item: Item,
    changes: InventoryChange[]
  ): Promise<ConfidenceFactors> {
    const dataQuality = this.calculateDataQuality(changes);
    const patternConsistency = this.calculatePatternConsistency(changes);
    const recentActivity = this.calculateRecentActivity(changes);
    const seasonalReliability = this.calculateSeasonalReliability(changes);
    const itemMaturity = this.calculateItemMaturity(item.createdAt, changes);

    return {
      dataQuality,
      patternConsistency,
      recentActivity,
      seasonalReliability,
      itemMaturity,
    };
  }

  /**
   * Assess data quality based on quantity and consistency of records
   */
  private static calculateDataQuality(changes: InventoryChange[]): number {
    if (changes.length === 0) return 0;

    let score = 0;

    // Quantity of data points
    if (changes.length >= 20) score += 0.4;
    else if (changes.length >= 10) score += 0.3;
    else if (changes.length >= 5) score += 0.2;
    else score += 0.1;

    // Data completeness (presence of different change types)
    const changeTypes = new Set(changes.map((c) => c.changeType));
    if (changeTypes.has("usage")) score += 0.3;
    if (changeTypes.has("restock")) score += 0.2;
    if (changeTypes.size >= 3) score += 0.1;

    // Data validity (reasonable quantity changes)
    const invalidChanges = changes.filter((c) => {
      const diff = Math.abs(c.quantityBefore - c.quantityAfter);
      return diff === 0 || diff > 1000; // Unreasonable changes
    });
    const validityRatio = Math.max(
      0,
      1 - invalidChanges.length / changes.length
    );
    score *= validityRatio;

    return Math.min(1, score);
  }

  /**
   * Measure consistency in usage patterns
   */
  private static calculatePatternConsistency(
    changes: InventoryChange[]
  ): number {
    const usageChanges = changes.filter((c) => c.changeType === "usage");

    if (usageChanges.length < 3) return 0.2;

    // Calculate usage amounts
    const usageAmounts = usageChanges.map(
      (c) => c.quantityBefore - c.quantityAfter
    );
    const mean =
      usageAmounts.reduce((sum, usage) => sum + usage, 0) / usageAmounts.length;

    if (mean <= 0) return 0.1;

    // Calculate coefficient of variation (CV)
    const variance =
      usageAmounts.reduce((sum, usage) => sum + Math.pow(usage - mean, 2), 0) /
      usageAmounts.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / mean;

    // Lower CV = higher consistency = higher confidence
    // CV < 0.5 = very consistent, CV > 2 = very inconsistent
    let consistencyScore = Math.max(0, 1 - coefficientOfVariation / 2);

    // Bonus for regular usage intervals
    const intervals = this.calculateUsageIntervals(usageChanges);
    if (intervals.length > 1) {
      const intervalMean =
        intervals.reduce((sum, interval) => sum + interval, 0) /
        intervals.length;
      const intervalCV = this.calculateCoefficientOfVariation(intervals);
      if (intervalCV < 0.5) consistencyScore += 0.1; // Bonus for regular intervals
    }

    return Math.min(1, consistencyScore);
  }

  /**
   * Assess how recently the item has been active
   */
  private static calculateRecentActivity(changes: InventoryChange[]): number {
    if (changes.length === 0) return 0;

    const now = new Date();
    const recentChanges = changes.filter((c) => {
      const daysSince =
        (now.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30; // Last 30 days
    });

    const recentUsage = recentChanges.filter((c) => c.changeType === "usage");

    let score = 0;

    // Recent changes boost confidence
    if (recentChanges.length >= 5) score += 0.5;
    else if (recentChanges.length >= 2) score += 0.3;
    else if (recentChanges.length >= 1) score += 0.1;

    // Recent usage specifically boosts confidence
    if (recentUsage.length >= 3) score += 0.3;
    else if (recentUsage.length >= 1) score += 0.2;

    // Time since last activity
    const lastChange = changes[changes.length - 1];
    const daysSinceLastChange =
      (now.getTime() - lastChange.createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastChange <= 7) score += 0.2;
    else if (daysSinceLastChange <= 30) score += 0.1;

    return Math.min(1, score);
  }

  /**
   * Calculate seasonal reliability (placeholder for future enhancement)
   */
  private static calculateSeasonalReliability(
    changes: InventoryChange[]
  ): number {
    // For now, return moderate confidence
    // TODO: Implement actual seasonal analysis when we have more historical data
    if (changes.length < 10) return 0.3;

    // Basic monthly variation analysis
    const monthlyUsage: { [key: string]: number } = {};
    changes
      .filter((c) => c.changeType === "usage")
      .forEach((change) => {
        const month = change.createdAt.toISOString().slice(0, 7); // YYYY-MM
        const usage = change.quantityBefore - change.quantityAfter;
        monthlyUsage[month] = (monthlyUsage[month] || 0) + usage;
      });

    const monthlyValues = Object.values(monthlyUsage);
    if (monthlyValues.length < 2) return 0.4;

    const cv = this.calculateCoefficientOfVariation(monthlyValues);
    return Math.max(0.3, Math.min(0.8, 1 - cv)); // Moderate confidence range
  }

  /**
   * Calculate item maturity based on tracking history
   */
  private static calculateItemMaturity(
    createdAt: Date,
    changes: InventoryChange[]
  ): number {
    const now = new Date();
    const daysSinceCreated =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    let score = 0;

    // Age-based maturity
    if (daysSinceCreated >= 90) score += 0.4;
    else if (daysSinceCreated >= 30) score += 0.3;
    else if (daysSinceCreated >= 14) score += 0.2;
    else score += 0.1;

    // Activity-based maturity
    const changesPerWeek = changes.length / Math.max(1, daysSinceCreated / 7);
    if (changesPerWeek >= 2) score += 0.3;
    else if (changesPerWeek >= 1) score += 0.2;
    else if (changesPerWeek >= 0.5) score += 0.1;

    // Historical depth
    if (changes.length >= 20) score += 0.3;
    else if (changes.length >= 10) score += 0.2;
    else if (changes.length >= 5) score += 0.1;

    return Math.min(1, score);
  }

  /**
   * Calculate overall confidence from individual factors
   */
  private static calculateOverallConfidence(
    factors: ConfidenceFactors,
    recentPredictions: any[]
  ): number {
    // Weighted average of factors
    const weights = {
      dataQuality: 0.3,
      patternConsistency: 0.25,
      recentActivity: 0.2,
      itemMaturity: 0.15,
      seasonalReliability: 0.1,
    };

    let weightedScore = 0;
    Object.entries(factors).forEach(([factor, value]) => {
      weightedScore += value * weights[factor as keyof typeof weights];
    });

    // Adjust based on recent prediction accuracy
    if (recentPredictions.length > 0) {
      const accuratePredictions = recentPredictions.filter(
        (p) => p.feedbackScore === 1
      );
      const accuracyRate =
        accuratePredictions.length / recentPredictions.length;

      if (accuracyRate >= 0.8) weightedScore += 0.05;
      else if (accuracyRate <= 0.3) weightedScore -= 0.1;
    }

    return Math.max(0.05, Math.min(0.95, weightedScore));
  }

  /**
   * Generate human-readable reasoning for confidence score
   */
  private static generateReasoningExplanation(
    factors: ConfidenceFactors,
    dataPoints: number
  ): string[] {
    const reasoning: string[] = [];

    // Data quality explanations
    if (factors.dataQuality >= 0.7) {
      reasoning.push("High-quality data with sufficient historical records");
    } else if (factors.dataQuality >= 0.4) {
      reasoning.push("Moderate data quality with some historical records");
    } else {
      reasoning.push("Limited data quality - predictions may be less reliable");
    }

    // Pattern consistency
    if (factors.patternConsistency >= 0.7) {
      reasoning.push("Very consistent usage patterns");
    } else if (factors.patternConsistency >= 0.4) {
      reasoning.push("Moderately consistent usage patterns");
    } else {
      reasoning.push(
        "Irregular usage patterns - higher prediction uncertainty"
      );
    }

    // Recent activity
    if (factors.recentActivity >= 0.6) {
      reasoning.push("Recent activity confirms current patterns");
    } else if (factors.recentActivity >= 0.3) {
      reasoning.push("Some recent activity available");
    } else {
      reasoning.push("Limited recent activity - patterns may have changed");
    }

    // Item maturity
    if (factors.itemMaturity >= 0.6) {
      reasoning.push("Well-established item with good tracking history");
    } else {
      reasoning.push("Newer item with developing usage patterns");
    }

    // Data points context
    if (dataPoints >= 20) {
      reasoning.push(`Strong foundation with ${dataPoints} data points`);
    } else if (dataPoints >= 5) {
      reasoning.push(`Moderate foundation with ${dataPoints} data points`);
    } else {
      reasoning.push(`Limited foundation with only ${dataPoints} data points`);
    }

    return reasoning;
  }

  /**
   * Determine recommendation reliability level
   */
  private static determineReliabilityLevel(
    confidence: number
  ): "low" | "medium" | "high" {
    if (confidence >= 0.7) return "high";
    if (confidence >= 0.4) return "medium";
    return "low";
  }

  /**
   * Helper: Get recent changes for an item
   */
  private static async getRecentChanges(
    itemId: string,
    days: number
  ): Promise<InventoryChange[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return prisma.inventoryChange.findMany({
      where: {
        itemId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Helper: Get recent predictions for accuracy assessment
   */
  private static async getRecentPredictions(
    itemId: string,
    predictionType: string,
    days: number
  ) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return prisma.aIPrediction.findMany({
      where: {
        itemId,
        predictionType,
        createdAt: { gte: since },
        actioned: true, // Only consider predictions that were acted upon
      },
    });
  }

  /**
   * Helper: Calculate usage intervals
   */
  private static calculateUsageIntervals(
    usageChanges: InventoryChange[]
  ): number[] {
    if (usageChanges.length < 2) return [];

    const intervals: number[] = [];
    for (let i = 1; i < usageChanges.length; i++) {
      const prev = usageChanges[i - 1];
      const curr = usageChanges[i];
      const daysBetween =
        (curr.createdAt.getTime() - prev.createdAt.getTime()) /
        (1000 * 60 * 60 * 24);
      intervals.push(daysBetween);
    }

    return intervals;
  }

  /**
   * Helper: Calculate coefficient of variation
   */
  private static calculateCoefficientOfVariation(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    if (mean === 0) return 0;

    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    const standardDeviation = Math.sqrt(variance);

    return standardDeviation / mean;
  }

  /**
   * Batch calculate confidence for multiple items
   */
  static async calculateBatchConfidence(
    itemIds: string[],
    predictionType: string
  ): Promise<Map<string, ConfidenceMetrics>> {
    const results = new Map<string, ConfidenceMetrics>();

    // Process items in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < itemIds.length; i += batchSize) {
      const batch = itemIds.slice(i, i + batchSize);
      const batchPromises = batch.map((itemId) =>
        this.calculateItemConfidence(itemId, predictionType)
          .then((confidence) => ({ itemId, confidence }))
          .catch((error) => ({ itemId, error }))
      );

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach((result) => {
        if ("confidence" in result) {
          results.set(result.itemId, result.confidence);
        }
      });
    }

    return results;
  }
}
