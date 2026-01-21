"use client";

import { useState, useEffect, useCallback } from "react";

interface SubscriptionFeatures {
  advancedAnalytics: boolean;
  customCategories: boolean;
  apiAccess: boolean;
  multiLocation: boolean;
  customReports: boolean;
  itemLimit: number;
  plan: string;
}

interface SubscriptionData {
  features: SubscriptionFeatures;
  plan: string;
  status: string;
}

interface UseSubscriptionReturn {
  features: SubscriptionFeatures | null;
  plan: string | null;
  status: string | null;
  isLoading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  hasFeature: (
    feature: keyof Omit<SubscriptionFeatures, "itemLimit" | "plan">
  ) => boolean;
  isActive: boolean;
  isNearItemLimit: (currentCount: number) => boolean;
  isOverItemLimit: (currentCount: number) => boolean;
}

export function useSubscription(): UseSubscriptionReturn {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/subscription/features");
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        console.error("Failed to fetch subscription:", result.error);
        setError(result.error || "Failed to fetch subscription data");
        setData(null);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError("Network error");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const hasFeature = useCallback(
    (
      feature: keyof Omit<SubscriptionFeatures, "itemLimit" | "plan">
    ): boolean => {
      return data?.features?.[feature] || false;
    },
    [data]
  );

  const isActive = data?.status === "active" && data?.features !== null;

  const isNearItemLimit = useCallback(
    (currentCount: number): boolean => {
      if (!data?.features) return false;
      return currentCount >= data.features.itemLimit * 0.8;
    },
    [data]
  );

  const isOverItemLimit = useCallback(
    (currentCount: number): boolean => {
      if (!data?.features) return true; // Err on the side of caution
      return currentCount >= data.features.itemLimit;
    },
    [data]
  );

  return {
    features: data?.features || null,
    plan: data?.plan || null,
    status: data?.status || null,
    isLoading,
    error,
    refreshSubscription: fetchSubscription,
    hasFeature,
    isActive,
    isNearItemLimit,
    isOverItemLimit,
  };
}

/**
 * Hook specifically for checking feature access
 */
export function useFeatureAccess(
  feature: keyof Omit<SubscriptionFeatures, "itemLimit" | "plan">
) {
  const { features, isLoading, hasFeature } = useSubscription();

  return {
    hasAccess: hasFeature(feature),
    isLoading,
    features,
  };
}

/**
 * Hook for checking item limits
 */
export function useItemLimit() {
  const { features, isLoading, isNearItemLimit, isOverItemLimit } =
    useSubscription();

  return {
    itemLimit: features?.itemLimit || 0,
    plan: features?.plan || "trial",
    isLoading,
    isNearItemLimit,
    isOverItemLimit,
  };
}
