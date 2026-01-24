/**
 * AI Status Badge - Shows AI-enhanced inventory status with confidence indicators
 */

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, AlertTriangle, Clock, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InventoryStatusWithAI } from "@/lib/inventory-status";

interface AIStatusBadgeProps {
  status: InventoryStatusWithAI;
  confidence?: number;
  aiInsights?: {
    wasteRisk?: "low" | "medium" | "high";
    reorderSuggestion?: {
      daysUntilReorder: number;
      recommendedQuantity: number;
      priority: "low" | "medium" | "high";
    };
  };
  className?: string;
  showDetails?: boolean;
}

const statusConfig = {
  ok: {
    variant: "success" as const,
    label: "In Stock",
    icon: null,
    color: "bg-green-100 text-green-800 border-green-200"
  },
  low_stock: {
    variant: "destructive" as const,
    label: "Low Stock",
    icon: AlertTriangle,
    color: "bg-orange-100 text-orange-800 border-orange-200"
  },
  expiring_soon: {
    variant: "destructive" as const,
    label: "Expiring Soon",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200"
  },
  expired: {
    variant: "destructive" as const,
    label: "Expired",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-800 border-red-200"
  },
  ai_waste_risk: {
    variant: "secondary" as const,
    label: "AI: Waste Risk",
    icon: Brain,
    color: "bg-purple-100 text-purple-800 border-purple-200"
  },
  ai_reorder_soon: {
    variant: "secondary" as const,
    label: "AI: Reorder Soon",
    icon: TrendingDown,
    color: "bg-blue-100 text-blue-800 border-blue-200"
  }
};

export function AIStatusBadge({
  status,
  confidence,
  aiInsights,
  className,
  showDetails = false
}: AIStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isAIStatus = status.startsWith('ai_');

  const getTooltipContent = () => {
    if (!showDetails) return null;

    if (status === 'ai_waste_risk' && aiInsights?.wasteRisk) {
      return (
        <div className="space-y-1">
          <p className="font-medium">AI Waste Risk Detected</p>
          <p className="text-xs">Risk Level: {aiInsights.wasteRisk.toUpperCase()}</p>
          {confidence && <p className="text-xs">Confidence: {confidence}%</p>}
          <p className="text-xs text-muted-foreground">
            AI predicts potential waste based on usage patterns
          </p>
        </div>
      );
    }

    if (status === 'ai_reorder_soon' && aiInsights?.reorderSuggestion) {
      return (
        <div className="space-y-1">
          <p className="font-medium">AI Reorder Recommendation</p>
          <p className="text-xs">
            Reorder in {aiInsights.reorderSuggestion.daysUntilReorder} days
          </p>
          <p className="text-xs">
            Suggested quantity: {aiInsights.reorderSuggestion.recommendedQuantity}
          </p>
          <p className="text-xs">
            Priority: {aiInsights.reorderSuggestion.priority.toUpperCase()}
          </p>
          {confidence && <p className="text-xs">Confidence: {confidence}%</p>}
          <p className="text-xs text-muted-foreground">
            AI prediction based on usage trends
          </p>
        </div>
      );
    }

    return config.label;
  };

  const badge = (
    <Badge
      variant={config.variant}
      className={cn(
        "flex items-center gap-1 text-xs font-medium transition-colors",
        isAIStatus && config.color,
        className
      )}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {config.label}
      {isAIStatus && confidence && (
        <span className="ml-1 opacity-75">
          ({confidence}%)
        </span>
      )}
    </Badge>
  );

  // For now, just return the badge without tooltip since we have a simple implementation
  return badge;
}

export default AIStatusBadge;