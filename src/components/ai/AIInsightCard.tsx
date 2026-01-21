/**
 * AI Insight Card - Displays AI predictions and recommendations with confidence indicators
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingUp, DollarSign, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AIInsight {
  id: string;
  type: "reorder" | "waste_risk" | "threshold_optimization" | "cost_savings";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  confidence: number;
  potentialSavings?: number;
  daysUntilAction?: number;
  reasoning: string;
  actionable: boolean;
  supplier?: {
    name: string;
    url: string;
    estimatedCost: number;
    deliveryDays: number;
  };
}

interface AIInsightCardProps {
  insight: AIInsight;
  onAction?: (action: string) => void;
  onDismiss?: () => void;
  className?: string;
}

const priorityConfig = {
  critical: {
    color: "destructive",
    icon: AlertTriangle,
    bgColor: "bg-red-50 border-red-200",
    textColor: "text-red-900"
  },
  high: {
    color: "destructive",
    icon: AlertTriangle,
    bgColor: "bg-orange-50 border-orange-200",
    textColor: "text-orange-900"
  },
  medium: {
    color: "secondary",
    icon: TrendingUp,
    bgColor: "bg-yellow-50 border-yellow-200",
    textColor: "text-yellow-900"
  },
  low: {
    color: "outline",
    icon: TrendingUp,
    bgColor: "bg-blue-50 border-blue-200",
    textColor: "text-blue-900"
  }
} as const;

const typeConfig = {
  reorder: {
    label: "Reorder Prediction",
    color: "bg-blue-500",
    description: "AI suggests optimal reorder timing"
  },
  waste_risk: {
    label: "Waste Prevention",
    color: "bg-red-500",
    description: "AI detects potential waste risk"
  },
  threshold_optimization: {
    label: "Threshold Optimization",
    color: "bg-green-500",
    description: "AI recommends threshold adjustments"
  },
  cost_savings: {
    label: "Cost Optimization",
    color: "bg-purple-500",
    description: "AI identifies cost-saving opportunities"
  }
} as const;

export function AIInsightCard({ insight, onAction, onDismiss, className }: AIInsightCardProps) {
  const priority = priorityConfig[insight.priority];
  const type = typeConfig[insight.type];
  const Icon = priority.icon;

  const handleSupplierClick = () => {
    if (insight.supplier?.url) {
      window.open(insight.supplier.url, '_blank');
      onAction?.('supplier_clicked');
    }
  };

  return (
    <Card className={cn(
      "relative transition-all duration-200 hover:shadow-md",
      priority.bgColor,
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", type.color)} />
            <Badge variant="secondary" className="text-xs font-medium">
              {type.label}
            </Badge>
            <Badge variant={priority.color as any} className="text-xs">
              <Icon className="w-3 h-3 mr-1" />
              {insight.priority.toUpperCase()}
            </Badge>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              ×
            </Button>
          )}
        </div>

        <div className="space-y-1">
          <CardTitle className={cn("text-lg font-semibold", priority.textColor)}>
            {insight.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {insight.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* AI Confidence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">AI Confidence</span>
            <span className="font-medium">{insight.confidence}%</span>
          </div>
          <Progress value={insight.confidence} className="h-2" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {insight.potentialSavings && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-muted-foreground">Potential Savings</p>
                <p className="font-semibold text-green-600">
                  ${insight.potentialSavings.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {insight.daysUntilAction && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-muted-foreground">Time to Act</p>
                <p className="font-semibold">
                  {insight.daysUntilAction} days
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Supplier Information */}
        {insight.supplier && (
          <div className="bg-white/50 rounded-lg p-3 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{insight.supplier.name}</p>
                <p className="text-xs text-muted-foreground">
                  ${insight.supplier.estimatedCost} • {insight.supplier.deliveryDays} day delivery
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSupplierClick}
                className="flex items-center gap-1 text-xs"
              >
                Order Now
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* AI Reasoning */}
        <div className="bg-white/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">AI Reasoning:</p>
          <p className="text-sm">{insight.reasoning}</p>
        </div>

        {/* Action Buttons */}
        {insight.actionable && onAction && (
          <div className="flex gap-2 pt-2">
            {insight.type === 'reorder' && (
              <>
                <Button size="sm" onClick={() => onAction('accept_reorder')}>
                  Accept Recommendation
                </Button>
                <Button size="sm" variant="outline" onClick={() => onAction('snooze')}>
                  Snooze 7 Days
                </Button>
              </>
            )}

            {insight.type === 'waste_risk' && (
              <>
                <Button size="sm" onClick={() => onAction('prioritize_usage')}>
                  Mark Priority Use
                </Button>
                <Button size="sm" variant="outline" onClick={() => onAction('transfer')}>
                  Transfer Location
                </Button>
              </>
            )}

            {insight.type === 'threshold_optimization' && (
              <>
                <Button size="sm" onClick={() => onAction('apply_threshold')}>
                  Apply Suggestion
                </Button>
                <Button size="sm" variant="outline" onClick={() => onAction('review_later')}>
                  Review Later
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AIInsightCard;