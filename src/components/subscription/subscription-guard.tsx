"use client";

import { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, CreditCard, Zap, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface SubscriptionFeatures {
  advancedAnalytics: boolean;
  customCategories: boolean;
  apiAccess: boolean;
  multiLocation: boolean;
  customReports: boolean;
  itemLimit: number;
  plan: string;
}

interface SubscriptionGuardProps {
  children: ReactNode;
  feature: keyof Omit<SubscriptionFeatures, "itemLimit" | "plan">;
  features: SubscriptionFeatures | null;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  requiredPlan?: string;
}

export function SubscriptionGuard({
  children,
  feature,
  features,
  fallback,
  showUpgradePrompt = true,
  requiredPlan = "Enterprise",
}: SubscriptionGuardProps) {
  // If no features data, show loading state
  if (!features) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-muted h-4 w-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has access to the feature
  const hasAccess = features[feature];

  if (hasAccess) {
    return <>{children}</>;
  }

  // If no access and custom fallback provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default restriction UI
  return (
    <SubscriptionRestriction
      feature={feature}
      currentPlan={features.plan}
      requiredPlan={requiredPlan}
      showUpgradePrompt={showUpgradePrompt}
    />
  );
}

interface SubscriptionRestrictionProps {
  feature: string;
  currentPlan: string;
  requiredPlan: string;
  showUpgradePrompt: boolean;
}

function SubscriptionRestriction({
  feature,
  currentPlan,
  requiredPlan,
  showUpgradePrompt,
}: SubscriptionRestrictionProps) {
  const featureLabels = {
    advancedAnalytics: "Advanced Analytics",
    customCategories: "Custom Categories",
    apiAccess: "API Access",
    multiLocation: "Multi-Location Management",
    customReports: "Custom Reports",
  };

  const featureLabel =
    featureLabels[feature as keyof typeof featureLabels] || feature;

  return (
    <div className="border border-dashed border-muted-foreground/50 rounded-lg p-8 text-center bg-muted/20">
      <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">
        {featureLabel} Unavailable
      </h3>

      <p className="text-muted-foreground mb-4">
        This feature requires a {requiredPlan} subscription.
      </p>

      <div className="flex items-center justify-center space-x-2 mb-6">
        <span className="text-sm text-muted-foreground">Current plan:</span>
        <Badge variant="secondary" className="capitalize">
          {currentPlan}
        </Badge>
      </div>

      {showUpgradePrompt && (
        <div className="space-y-3">
          <Link href="/billing">
            <Button className="w-full sm:w-auto">
              <Zap className="w-4 h-4 mr-2" />
              Upgrade to {requiredPlan}
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            Unlock all features with our {requiredPlan} plan
          </p>
        </div>
      )}
    </div>
  );
}

interface ItemLimitGuardProps {
  children: ReactNode;
  currentCount: number;
  itemLimit: number;
  plan: string;
}

export function ItemLimitGuard({
  children,
  currentCount,
  itemLimit,
  plan,
}: ItemLimitGuardProps) {
  const isNearLimit = currentCount >= itemLimit * 0.8;
  const isOverLimit = currentCount >= itemLimit;

  if (isOverLimit) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <strong>Item Limit Reached:</strong> You've reached your limit of{" "}
              {itemLimit} items for the {plan} plan.
            </div>
            <Link href="/billing">
              <Button size="sm" variant="outline">
                Upgrade Plan
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isNearLimit) {
    const remaining = itemLimit - currentCount;
    return (
      <>
        <Alert className="mb-4 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="flex items-center justify-between">
              <span>
                <strong>Approaching limit:</strong> {remaining} items remaining
                on your {plan} plan
              </span>
              <Link href="/billing">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-700"
                >
                  Upgrade
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
        {children}
      </>
    );
  }

  return <>{children}</>;
}

interface PaymentRequiredProps {
  message: string;
  plan: string;
}

export function PaymentRequired({ message, plan }: PaymentRequiredProps) {
  return (
    <Alert variant="destructive" className="border-red-200 bg-red-50">
      <CreditCard className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <div className="flex items-center justify-between">
          <div>
            <strong>Payment Required:</strong> {message}
          </div>
          <Link href="/billing">
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700"
            >
              Update Billing
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}
