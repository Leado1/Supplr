import { auth } from "@clerk/nextjs/server";
import { prisma } from "./db";

export interface SubscriptionFeatures {
  advancedAnalytics: boolean;
  customCategories: boolean;
  apiAccess: boolean;
  multiLocation: boolean;
  customReports: boolean;
  itemLimit: number;
  plan: string;
}

/**
 * Get the current organization's subscription and feature flags
 */
export async function getSubscriptionFeatures(): Promise<SubscriptionFeatures | null> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return null;
    }

    let organizationId = orgId;

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
    }

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (!subscription) {
      // Return default trial features if no subscription found
      return {
        advancedAnalytics: false,
        customCategories: false,
        apiAccess: false,
        multiLocation: false,
        customReports: false,
        itemLimit: 5,
        plan: "trial",
      };
    }

    return {
      advancedAnalytics: subscription.advancedAnalytics,
      customCategories: subscription.customCategories,
      apiAccess: subscription.apiAccess,
      multiLocation: subscription.multiLocation,
      customReports: subscription.customReports,
      itemLimit: subscription.itemLimit,
      plan: subscription.plan,
    };
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
  const features = await getSubscriptionFeatures();

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
