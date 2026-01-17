"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

interface FeatureGateProps {
  children: ReactNode;
  feature: string;
  hasAccess: boolean;
  plan: string;
  requiredPlan: "starter" | "professional" | "enterprise";
  fallback?: ReactNode;
}

const planHierarchy = {
  trial: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
};

export function FeatureGate({
  children,
  feature,
  hasAccess,
  plan,
  requiredPlan,
  fallback,
}: FeatureGateProps) {
  // If user has access, show the feature
  if (hasAccess) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  return (
    <Card className="border-2 border-dashed border-muted-foreground/25">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <svg
            className="h-6 w-6 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m0 0v2m0-2h2m-2 0H10m0 0V15m0 0V13m0 0V11m0 0V9m0 0V7a3 3 0 013-3h0a3 3 0 013 3v0a3 3 0 01-3 3h0a3 3 0 01-3 3z"
            />
          </svg>
        </div>
        <CardTitle className="text-xl">{feature} Requires Upgrade</CardTitle>
        <CardDescription>
          This feature is available with the{" "}
          <Badge variant="outline" className="capitalize">
            {requiredPlan}
          </Badge>{" "}
          plan and higher.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="text-sm text-muted-foreground">
          Current plan:{" "}
          <Badge variant="outline" className="capitalize">
            {plan}
          </Badge>
        </div>
        <div className="flex justify-center gap-3">
          <Link href="/billing">
            <Button>Upgrade Plan</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline">View Pricing</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Simpler inline upgrade prompt for smaller UI elements
export function InlineUpgrade({
  feature,
  requiredPlan,
  className = "",
}: {
  feature: string;
  requiredPlan: string;
  className?: string;
}) {
  return (
    <div
      className={`text-center py-8 px-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/25 ${className}`}
    >
      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground">
          {feature} requires {requiredPlan} plan
        </div>
        <Link href="/billing">
          <Button size="sm">Upgrade Now</Button>
        </Link>
      </div>
    </div>
  );
}
