"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { InsightSummaryMetrics } from "./types";
import { formatCurrency } from "./utils";

interface InsightsSummaryCardsProps {
  metrics: InsightSummaryMetrics | null;
  isLoading: boolean;
}

export function InsightsSummaryCards({
  metrics,
  isLoading,
}: InsightsSummaryCardsProps) {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Action items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-2xl font-semibold">
            {metrics.urgentCount + metrics.soonCount + metrics.laterCount}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="destructive">Urgent {metrics.urgentCount}</Badge>
            <Badge variant="warning">Soon {metrics.soonCount}</Badge>
            <Badge variant="outline">Later {metrics.laterCount}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Estimated savings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-semibold">
            {formatCurrency(metrics.estimatedSavings)}
          </div>
          <p className="text-xs text-muted-foreground">
            From {metrics.savingsOpportunities} opportunit
            {metrics.savingsOpportunities === 1 ? "y" : "ies"} this month.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
            Confidence
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                    aria-label="Confidence details"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Based on past outcomes and recent data quality.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-semibold">
            {metrics.overallConfidence === null
              ? "N/A"
              : `${metrics.overallConfidence}%`}
          </div>
          <p className="text-xs text-muted-foreground">
            Overall accuracy across recent insights.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default InsightsSummaryCards;
