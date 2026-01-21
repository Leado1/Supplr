/**
 * AI Services Index - Central export point for AI functionality
 */

export { PredictionEngine } from "./prediction-engine";
export { DataProcessor } from "./data-processor";
export { RecommendationEngine } from "./recommendation-engine";
export { ConfidenceCalculator } from "./confidence-calculator";
export { SupplierIntegration } from "./supplier-integration";

export type {
  PredictionType,
  PredictionResult,
  ItemUsagePattern,
} from "./prediction-engine";

export type {
  OrganizationInsights,
  ItemAnalytics,
  UsageTrend,
} from "./data-processor";

export type {
  Recommendation,
  RecommendationAction,
  RecommendationSummary,
  RecommendationPriority,
  RecommendationType,
} from "./recommendation-engine";

export type {
  ConfidenceFactors,
  ConfidenceMetrics,
} from "./confidence-calculator";

export type {
  SupplierInfo,
  ProductMatch,
  OrderingOption,
} from "./supplier-integration";
