import 'server-only';

import { auth } from "@clerk/nextjs/server";
import { prisma } from "./db";
import type { Subscription } from "@prisma/client";

export interface SubscriptionFeatures {
  advancedAnalytics: boolean;
  customCategories: boolean;
  apiAccess: boolean;
  multiLocation: boolean;
  customReports: boolean;
  itemLimit: number;
  plan: string;
  // AI Features
  aiPredictions: boolean;
  aiAutomation: boolean;
}

/**
 * Get features from a subscription object
 */
export function getSubscriptionFeatures(
  subscription: Subscription | null
): SubscriptionFeatures;
/**
 * Get features from a subscription object with organization context for demo override
 */
export function getSubscriptionFeatures(
  subscription: Subscription | null,
  organization?: { users?: { email: string }[] }
): SubscriptionFeatures;
export function getSubscriptionFeatures(
  subscription: Subscription | null,
  organization?: { users?: { email: string }[] }
): SubscriptionFeatures {
  // Check for demo override
  if (organization?.users?.some((user) => user.email === "demo@supplr.net")) {
    return {
      advancedAnalytics: true,
      customCategories: true,
      apiAccess: true,
      multiLocation: true,
      customReports: true,
      itemLimit: 999999, // Unlimited for demo
      plan: "enterprise",
      aiPredictions: true,
      aiAutomation: true,
    };
  }

  // If no subscription, return trial features
  if (!subscription) {
    return getTrialFeatures();
  }

  // Check subscription status - inactive subscriptions get trial features
  if (!subscription.isActive || subscription.status !== "active") {
    console.warn(
      `Subscription inactive: status=${subscription.status}, isActive=${subscription.isActive}`
    );
    return getTrialFeatures();
  }

  // Return features based on plan tier with proper validation
  return getPlanFeatures(subscription.plan, subscription);
}

/**
 * Get trial/free tier features
 */
function getTrialFeatures(): SubscriptionFeatures {
  return {
    advancedAnalytics: false,
    customCategories: false,
    apiAccess: false,
    multiLocation: false,
    customReports: false,
    itemLimit: 5, // Very limited for trial
    plan: "trial",
    aiPredictions: false,
    aiAutomation: false,
  };
}

/**
 * Get features based on plan tier with database validation
 */
function getPlanFeatures(
  plan: string,
  subscription: Subscription
): SubscriptionFeatures {
  const baseFeatures = {
    itemLimit: subscription.itemLimit,
    plan: subscription.plan,
  };

  switch (plan.toLowerCase()) {
    case "enterprise":
      return {
        ...baseFeatures,
        advancedAnalytics: subscription.advancedAnalytics,
        customCategories: subscription.customCategories,
        apiAccess: subscription.apiAccess,
        multiLocation: subscription.multiLocation,
        customReports: subscription.customReports,
        aiPredictions: true,
        aiAutomation: true,
      };

    case "professional":
    case "pro":
      return {
        ...baseFeatures,
        advancedAnalytics: subscription.advancedAnalytics,
        customCategories: subscription.customCategories,
        apiAccess: false, // API access only for enterprise
        multiLocation: false, // Multi-location only for enterprise
        customReports: subscription.customReports,
        aiPredictions: true,
        aiAutomation: false, // Automation only for enterprise
      };

    case "basic":
    case "starter":
      return {
        ...baseFeatures,
        advancedAnalytics: false,
        customCategories: subscription.customCategories,
        apiAccess: false,
        multiLocation: false,
        customReports: false,
        aiPredictions: true, // Basic AI features for Starter
        aiAutomation: false,
      };

    case "trial":
    default:
      return getTrialFeatures();
  }
}

/**
 * Get the current organization's subscription and feature flags
 */
export async function getCurrentUserSubscriptionFeatures(): Promise<SubscriptionFeatures | null> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return null;
    }

    let organizationId = orgId;
    let userEmail: string | null = null;

    // If no orgId from Clerk, find the user's organization
    if (!organizationId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { organization: true },
      });

      if (!user) {
        return null;
      }

      organizationId = user.organizationId;
      userEmail = user.email;
    } else {
      // Get user email for demo check
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { email: true },
      });
      userEmail = user?.email || null;
    }

    // DEMO OVERRIDE: Give demo user full Enterprise access
    if (userEmail === "demo@supplr.net") {
      return {
        advancedAnalytics: true,
        customCategories: true,
        apiAccess: true,
        multiLocation: true,
        customReports: true,
        itemLimit: 999999, // Unlimited for demo
        plan: "enterprise",
        aiPredictions: true,
        aiAutomation: true,
      };
    }

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (!subscription) {
      // Return default trial features if no subscription found
      return getTrialFeatures();
    }

    // Check subscription and payment status
    if (!subscription.isActive || subscription.status !== "active") {
      console.warn(
        `User ${userEmail} subscription inactive: status=${subscription.status}, isActive=${subscription.isActive}`
      );
      return getTrialFeatures();
    }

    // Return features based on plan with validation
    return getPlanFeatures(subscription.plan, subscription);
  } catch (error) {
    console.error("Error fetching subscription features:", error);
    return null;
  }
}

/**
 * Check if the current subscription has access to a specific feature
 */
export async function hasFeatureAccess(
  feature: keyof Omit<SubscriptionFeatures, "itemLimit" | "plan">
): Promise<boolean> {
  const features = await getCurrentUserSubscriptionFeatures();

  if (!features) {
    return false;
  }

  return features[feature];
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(plan: string): string {
  const planNames: Record<string, string> = {
    trial: "Trial",
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
  };

  return planNames[plan] || "Unknown";
}

/**
 * Get plan color for UI
 */
export function getPlanColor(plan: string): string {
  const planColors: Record<string, string> = {
    trial: "bg-gray-100 text-gray-800",
    starter: "bg-blue-100 text-blue-800",
    professional: "bg-purple-100 text-purple-800",
    enterprise: "bg-gold-100 text-gold-800",
  };

  return planColors[plan] || "bg-gray-100 text-gray-800";
}

/**
 * Check if plan allows advanced analytics
 */
export function planHasAdvancedAnalytics(plan: string): boolean {
  return ["professional", "enterprise"].includes(plan);
}

/**
 * Check if plan allows custom categories
 */
export function planHasCustomCategories(plan: string): boolean {
  return ["professional", "enterprise"].includes(plan);
}

/**
 * Check if plan allows API access
 */
export function planHasApiAccess(plan: string): boolean {
  return plan === "enterprise";
}

/**
 * Check if plan allows multi-location
 */
export function planHasMultiLocation(plan: string): boolean {
  return plan === "enterprise";
}

/**
 * Check if subscription is active and paid
 */
export function isSubscriptionActive(
  subscription: Subscription | null
): boolean {
  if (!subscription) {
    return false;
  }
  return subscription.isActive && subscription.status === "active";
}

/**
 * Check if user has exceeded their item limit
 */
export async function hasExceededItemLimit(
  organizationId: string
): Promise<boolean> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (!subscription || !isSubscriptionActive(subscription)) {
      return true; // Inactive subscriptions are considered over limit
    }

    const itemCount = await prisma.item.count({
      where: { organizationId },
    });

    return itemCount >= subscription.itemLimit;
  } catch (error) {
    console.error("Error checking item limit:", error);
    return true; // Err on the side of caution
  }
}

/**
 * Require active subscription for feature access
 */
export async function requireActiveSubscription(
  organizationId: string
): Promise<Subscription> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  if (!subscription) {
    throw new Error("No subscription found");
  }

  if (!isSubscriptionActive(subscription)) {
    throw new Error(
      `Subscription inactive: status=${subscription.status}, isActive=${subscription.isActive}`
    );
  }

  return subscription;
}

/**
 * Require specific plan tier
 */
export async function requirePlanTier(
  organizationId: string,
  requiredPlan: string
): Promise<Subscription> {
  const subscription = await requireActiveSubscription(organizationId);

  const planHierarchy = ["trial", "starter", "professional", "enterprise"];
  const requiredIndex = planHierarchy.indexOf(requiredPlan.toLowerCase());
  const currentIndex = planHierarchy.indexOf(subscription.plan.toLowerCase());

  if (currentIndex < requiredIndex) {
    throw new Error(
      `Feature requires ${requiredPlan} plan or higher. Current plan: ${subscription.plan}`
    );
  }

  return subscription;
}
