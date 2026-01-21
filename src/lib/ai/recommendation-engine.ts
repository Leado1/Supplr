/**
 * AI Recommendation Engine - Business logic for intelligent suggestions
 * Combines predictions with business rules and subscription features
 */

import 'server-only';

import { prisma } from "@/lib/db";
import { PredictionEngine, type PredictionResult } from "./prediction-engine";
import { DataProcessor } from "./data-processor";
import { getSubscriptionFeatures } from "@/lib/subscription-helpers";
import type { Item, Organization, Subscription } from "@prisma/client";

export type RecommendationPriority = "low" | "medium" | "high" | "critical";
export type RecommendationType =
  | "reorder"
  | "waste_prevention"
  | "threshold_optimization"
  | "usage_optimization";

export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  actionable: boolean;
  estimatedSavings?: number;
  estimatedImpact: string;
  item?: {
    id: string;
    name: string;
    category: string;
    location?: string;
  };
  actions: RecommendationAction[];
  metadata: {
    confidenceScore: number;
    reasoning: string;
    validUntil: Date;
    featureRequired?: string;
  };
}

export interface RecommendationAction {
  type:
    | "adjust_quantity"
    | "reorder_now"
    | "change_threshold"
    | "prioritize_usage"
    | "transfer_location";
  label: string;
  value?: any;
  confirmationRequired: boolean;
}

export interface RecommendationSummary {
  totalRecommendations: number;
  highPriorityCount: number;
  potentialMonthlySavings: number;
  topCategories: Array<{
    type: RecommendationType;
    count: number;
    avgPriority: number;
  }>;
}

export class RecommendationEngine {
  /**
   * Generate comprehensive recommendations for an organization
   */
  static async generateRecommendations(organizationId: string): Promise<{
    recommendations: Recommendation[];
    summary: RecommendationSummary;
  }> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true, users: true },
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    const features = getSubscriptionFeatures(organization.subscription, {
      users: organization.users
        ? organization.users.map((u: { email: string }) => ({ email: u.email }))
        : [],
    });
    const recommendations: Recommendation[] = [];

    // Generate reorder recommendations (Professional+ feature)
    if (features.advancedAnalytics) {
      const reorderRecs =
        await this.generateReorderRecommendations(organizationId);
      recommendations.push(...reorderRecs);
    }

    // Generate waste prevention recommendations (Starter+ feature)
    const wasteRecs =
      await this.generateWastePreventionRecommendations(organizationId);
    recommendations.push(...wasteRecs);

    // Generate threshold optimizations (Professional+ feature)
    if (features.advancedAnalytics) {
      const thresholdRecs =
        await this.generateThresholdRecommendations(organizationId);
      recommendations.push(...thresholdRecs);
    }

    // Generate usage optimization recommendations
    const usageRecs =
      await this.generateUsageOptimizationRecommendations(organizationId);
    recommendations.push(...usageRecs);

    // Sort recommendations by priority and potential impact
    const sortedRecommendations =
      this.prioritizeRecommendations(recommendations);
    const summary = this.generateSummary(sortedRecommendations);

    return {
      recommendations: sortedRecommendations.slice(0, 20), // Limit to top 20 recommendations
      summary,
    };
  }

  /**
   * Generate reorder recommendations
   */
  private static async generateReorderRecommendations(
    organizationId: string
  ): Promise<Recommendation[]> {
    const items = await prisma.item.findMany({
      where: { organizationId },
      include: { category: true, location: true },
    });

    const recommendations: Recommendation[] = [];

    for (const item of items) {
      const prediction = await PredictionEngine.generateReorderPrediction(item);

      if (
        prediction.value.daysUntilReorder !== null &&
        prediction.value.daysUntilReorder <= 14
      ) {
        let priority: RecommendationPriority = "low";
        if (prediction.value.daysUntilReorder <= 3) priority = "critical";
        else if (prediction.value.daysUntilReorder <= 7) priority = "high";
        else if (prediction.value.daysUntilReorder <= 10) priority = "medium";

        const estimatedCost =
          prediction.value.recommendedQuantity * Number(item.unitCost);

        recommendations.push({
          id: `reorder-${item.id}`,
          type: "reorder",
          priority,
          title: `Reorder ${item.name}`,
          description: `Stock will reach reorder point in ${prediction.value.daysUntilReorder} days. Recommended order: ${prediction.value.recommendedQuantity} units.`,
          actionable: true,
          estimatedSavings: priority === "critical" ? estimatedCost * 0.15 : 0, // Emergency order markup savings
          estimatedImpact: this.formatImpact(
            priority,
            `Prevents stockout, saves ${priority === "critical" ? "15%" : "5%"} on emergency orders`
          ),
          item: {
            id: item.id,
            name: item.name,
            category: item.category.name,
            location: item.location?.name,
          },
          actions: [
            {
              type: "reorder_now",
              label: `Reorder ${prediction.value.recommendedQuantity} units`,
              value: { quantity: prediction.value.recommendedQuantity },
              confirmationRequired: estimatedCost > 500,
            },
          ],
          metadata: {
            confidenceScore: prediction.confidenceScore,
            reasoning: prediction.reasoning,
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate waste prevention recommendations
   */
  private static async generateWastePreventionRecommendations(
    organizationId: string
  ): Promise<Recommendation[]> {
    const items = await prisma.item.findMany({
      where: {
        organizationId,
        expirationDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // Next 60 days
        },
      },
      include: { category: true, location: true },
    });

    const recommendations: Recommendation[] = [];

    for (const item of items) {
      const prediction =
        await PredictionEngine.generateWasteRiskPrediction(item);

      if (prediction.value.riskLevel !== "low") {
        let priority: RecommendationPriority = "medium";
        if (prediction.value.riskLevel === "high") {
          priority =
            prediction.value.daysUntilExpiration <= 7 ? "critical" : "high";
        }

        const actions: RecommendationAction[] = [];

        if (prediction.value.daysUntilExpiration <= 14) {
          actions.push({
            type: "prioritize_usage",
            label: "Mark for priority use",
            confirmationRequired: false,
          });
        }

        if (prediction.value.estimatedWasteQuantity > 0) {
          actions.push({
            type: "adjust_quantity",
            label: `Reduce future orders by ${prediction.value.estimatedWasteQuantity} units`,
            value: { reduction: prediction.value.estimatedWasteQuantity },
            confirmationRequired: false,
          });
        }

        recommendations.push({
          id: `waste-${item.id}`,
          type: "waste_prevention",
          priority,
          title: `${prediction.value.riskLevel.toUpperCase()} waste risk: ${item.name}`,
          description: `${prediction.value.estimatedWasteQuantity} units at risk (${prediction.value.daysUntilExpiration} days to expiration). ${prediction.value.recommendation}`,
          actionable: true,
          estimatedSavings: prediction.value.estimatedWasteValue,
          estimatedImpact: this.formatImpact(
            priority,
            `Prevents $${prediction.value.estimatedWasteValue} in waste`
          ),
          item: {
            id: item.id,
            name: item.name,
            category: item.category.name,
            location: item.location?.name,
          },
          actions,
          metadata: {
            confidenceScore: prediction.confidenceScore,
            reasoning: prediction.reasoning,
            validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000),
          },
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate threshold optimization recommendations
   */
  private static async generateThresholdRecommendations(
    organizationId: string
  ): Promise<Recommendation[]> {
    const items = await prisma.item.findMany({
      where: { organizationId },
      include: { category: true, location: true },
    });

    const recommendations: Recommendation[] = [];

    for (const item of items) {
      const prediction =
        await PredictionEngine.generateThresholdOptimization(item);

      const thresholdDiff = Math.abs(
        prediction.value.recommendedThreshold -
          prediction.value.currentThreshold
      );

      if (thresholdDiff >= 3 && prediction.confidenceScore > 0.6) {
        const priority: RecommendationPriority =
          thresholdDiff >= 10 ? "medium" : "low";
        const isReduction =
          prediction.value.recommendedThreshold <
          prediction.value.currentThreshold;

        recommendations.push({
          id: `threshold-${item.id}`,
          type: "threshold_optimization",
          priority,
          title: `${isReduction ? "Reduce" : "Increase"} reorder point for ${item.name}`,
          description: `${isReduction ? "Lower" : "Raise"} threshold from ${prediction.value.currentThreshold} to ${prediction.value.recommendedThreshold} units. ${prediction.reasoning}`,
          actionable: true,
          estimatedSavings: prediction.value.potentialSavings || 0,
          estimatedImpact: this.formatImpact(
            priority,
            isReduction
              ? `Frees up $${prediction.value.potentialSavings} in capital`
              : "Improves stock availability"
          ),
          item: {
            id: item.id,
            name: item.name,
            category: item.category.name,
            location: item.location?.name,
          },
          actions: [
            {
              type: "change_threshold",
              label: `Set threshold to ${prediction.value.recommendedThreshold}`,
              value: { newThreshold: prediction.value.recommendedThreshold },
              confirmationRequired: thresholdDiff >= 10,
            },
          ],
          metadata: {
            confidenceScore: prediction.confidenceScore,
            reasoning: prediction.reasoning,
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate usage optimization recommendations
   */
  private static async generateUsageOptimizationRecommendations(
    organizationId: string
  ): Promise<Recommendation[]> {
    const insights = await DataProcessor.getActionableItems(organizationId);
    const recommendations: Recommendation[] = [];

    // Fast-moving items that might benefit from bulk ordering
    const analytics = await DataProcessor.generateItemAnalytics(organizationId);
    const fastMovingItems = analytics
      .filter((item) => item.turnoverRate > 2 && item.costImpact > 100)
      .sort((a, b) => b.turnoverRate - a.turnoverRate)
      .slice(0, 5);

    fastMovingItems.forEach((item) => {
      recommendations.push({
        id: `usage-${item.itemId}`,
        type: "usage_optimization",
        priority: "medium",
        title: `Optimize ordering for high-turnover item: ${item.name}`,
        description: `This item has ${item.turnoverRate}x monthly turnover. Consider bulk ordering or subscription to reduce costs.`,
        actionable: true,
        estimatedSavings: item.costImpact * 0.05, // 5% bulk discount potential
        estimatedImpact: this.formatImpact(
          "medium",
          "5-10% cost reduction through bulk ordering"
        ),
        item: {
          id: item.itemId,
          name: item.name,
          category: item.category,
          location: item.location,
        },
        actions: [
          {
            type: "adjust_quantity",
            label: "Consider bulk ordering discount",
            confirmationRequired: false,
          },
        ],
        metadata: {
          confidenceScore: 0.7,
          reasoning: `High turnover rate of ${item.turnoverRate}x suggests bulk ordering opportunity`,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    });

    return recommendations;
  }

  /**
   * Prioritize recommendations by business impact
   */
  private static prioritizeRecommendations(
    recommendations: Recommendation[]
  ): Recommendation[] {
    const priorityWeights = { critical: 4, high: 3, medium: 2, low: 1 };

    return recommendations.sort((a, b) => {
      // Primary sort: priority level
      const priorityDiff =
        priorityWeights[b.priority] - priorityWeights[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Secondary sort: estimated savings
      const savingsDiff = (b.estimatedSavings || 0) - (a.estimatedSavings || 0);
      if (savingsDiff !== 0) return savingsDiff;

      // Tertiary sort: confidence score
      return b.metadata.confidenceScore - a.metadata.confidenceScore;
    });
  }

  /**
   * Generate summary statistics
   */
  private static generateSummary(
    recommendations: Recommendation[]
  ): RecommendationSummary {
    const totalRecommendations = recommendations.length;
    const highPriorityCount = recommendations.filter(
      (r) => r.priority === "high" || r.priority === "critical"
    ).length;
    const potentialMonthlySavings = recommendations.reduce(
      (sum, r) => sum + (r.estimatedSavings || 0),
      0
    );

    // Group by type
    const typeGroups = recommendations.reduce(
      (groups, rec) => {
        if (!groups[rec.type]) {
          groups[rec.type] = { count: 0, totalPriority: 0 };
        }
        groups[rec.type].count++;
        groups[rec.type].totalPriority += {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1,
        }[rec.priority];
        return groups;
      },
      {} as Record<string, { count: number; totalPriority: number }>
    );

    const topCategories = Object.entries(typeGroups)
      .map(([type, data]) => ({
        type: type as RecommendationType,
        count: data.count,
        avgPriority: data.totalPriority / data.count,
      }))
      .sort((a, b) => b.avgPriority - a.avgPriority);

    return {
      totalRecommendations,
      highPriorityCount,
      potentialMonthlySavings: Math.round(potentialMonthlySavings * 100) / 100,
      topCategories,
    };
  }

  /**
   * Format impact description based on priority
   */
  private static formatImpact(
    priority: RecommendationPriority,
    description: string
  ): string {
    const urgencyMap = {
      critical: "🚨 URGENT:",
      high: "⚠️ Important:",
      medium: "📊 Beneficial:",
      low: "💡 Suggested:",
    };

    return `${urgencyMap[priority]} ${description}`;
  }

  /**
   * Get personalized recommendations for a specific user
   */
  static async getPersonalizedRecommendations(
    organizationId: string,
    userId: string,
    locationId?: string
  ): Promise<Recommendation[]> {
    const { recommendations } =
      await this.generateRecommendations(organizationId);

    // Filter by location if user has location-specific access
    let filteredRecommendations = recommendations;
    if (locationId) {
      filteredRecommendations = recommendations.filter(
        (rec) => !rec.item?.location || rec.item.location === locationId
      );
    }

    // Limit based on user role and subscription
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true, users: true },
    });

    if (!organization) return [];

    const features = getSubscriptionFeatures(organization.subscription, {
      users: organization.users
        ? organization.users.map((u: { email: string }) => ({ email: u.email }))
        : [],
    });

    // Filter by feature access
    if (!features.advancedAnalytics) {
      filteredRecommendations = filteredRecommendations.filter(
        (rec) => rec.type !== "reorder" && rec.type !== "threshold_optimization"
      );
    }

    return filteredRecommendations.slice(0, 10); // Limit to 10 personal recommendations
  }

  /**
   * Track when a recommendation is acted upon
   */
  static async markRecommendationActioned(
    organizationId: string,
    recommendationId: string,
    action: string,
    feedback?: "helpful" | "not_helpful"
  ): Promise<void> {
    // Extract item ID from recommendation ID if it follows our format
    const match = recommendationId.match(
      /^(reorder|waste|threshold|usage)-(.+)$/
    );
    if (!match) return;

    const [, type, itemId] = match;

    // Find related AI prediction
    const prediction = await prisma.aIPrediction.findFirst({
      where: {
        organizationId,
        itemId,
        predictionType:
          type === "reorder"
            ? "reorder"
            : type === "waste"
              ? "waste_risk"
              : "threshold_optimization",
        actioned: false,
      },
    });

    if (prediction) {
      await prisma.aIPrediction.update({
        where: { id: prediction.id },
        data: {
          actioned: true,
          feedbackScore:
            feedback === "helpful" ? 1 : feedback === "not_helpful" ? -1 : 0,
        },
      });
    }

    // Track feature usage for quota/analytics
    const featureType =
      type === "reorder"
        ? "reorder_prediction"
        : type === "waste"
          ? "waste_prevention"
          : "threshold_optimization";

    const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM format

    await prisma.aIFeatureUsage.upsert({
      where: {
        organizationId_featureType_monthYear: {
          organizationId,
          featureType,
          monthYear,
        },
      },
      update: {
        usageCount: {
          increment: 1,
        },
      },
      create: {
        organizationId,
        featureType,
        monthYear,
        usageCount: 1,
      },
    });
  }
}
