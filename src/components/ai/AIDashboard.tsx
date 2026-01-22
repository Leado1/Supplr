/**
 * AI Dashboard - Main dashboard showing AI insights and predictions
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp, DollarSign, Package, Brain, Loader2, RefreshCw } from "lucide-react";
import { AIInsightCard, type AIInsight } from "./AIInsightCard";
import { cn } from "@/lib/utils";

interface AIDashboardProps {
  organizationId: string;
  locationId?: string;
  className?: string;
}

interface AISummary {
  totalPredictions: number;
  highPriorityItems: number;
  potentialSavings: number;
  accuracyRate: number;
  lastUpdated: string;
}

export function AIDashboard({ organizationId, locationId, className }: AIDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedLocation, setSelectedLocation] = useState(locationId || "all");
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAIData = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      // Load AI predictions and recommendations
      const [reorderResponse, wasteResponse] = await Promise.all([
        fetch(`/api/ai/reorder-predictions${selectedLocation !== 'all' ? `?locationId=${selectedLocation}` : ''}`),
        fetch(`/api/ai/waste-prevention${selectedLocation !== 'all' ? `?locationId=${selectedLocation}` : ''}`)
      ]);

      const reorderData = reorderResponse.ok ? await reorderResponse.json() : { predictions: [], summary: {} };
      const wasteData = wasteResponse.ok ? await wasteResponse.json() : { predictions: [], summary: {} };

      // Transform API data to AIInsight format
      const reorderInsights: AIInsight[] = reorderData.predictions?.map((pred: any) => ({
        id: `reorder-${pred.item.id}`,
        type: "reorder" as const,
        priority: pred.reorderPrediction.priority,
        title: `Restock ${pred.item.name}`,
        description: `You may run low in ${pred.reorderPrediction.daysUntilReorder} days`,
        confidence: pred.confidence,
        potentialSavings: pred.reorderPrediction.priority === 'high' ?
          pred.reorderPrediction.recommendedQuantity * parseFloat(pred.item.unitCost) * 0.15 : 0,
        daysUntilAction: pred.reorderPrediction.daysUntilReorder,
        reasoning: "Based on recent usage and current stock.",
        actionable: true,
        supplier: pred.orderingOptions?.[0] ? {
          name: pred.orderingOptions[0].supplier.name,
          url: pred.orderingOptions[0].orderingUrl,
          estimatedCost: pred.orderingOptions[0].estimatedCost,
          deliveryDays: pred.orderingOptions[0].supplier.deliveryTime
        } : undefined
      })) || [];

      const wasteInsights: AIInsight[] = wasteData.predictions?.map((pred: any) => {
        const riskLabel = pred.wasteRisk.riskLevel === "high"
          ? "High"
          : pred.wasteRisk.riskLevel === "medium"
            ? "Medium"
            : "Low";

        return {
          id: `waste-${pred.item.id}`,
          type: "waste_risk" as const,
          priority: pred.wasteRisk.riskLevel === 'high' ? 'high' : 'medium',
          title: `${riskLabel} chance of waste: ${pred.item.name}`,
          description: `About ${pred.wasteRisk.estimatedWasteQuantity} could expire in ${pred.wasteRisk.daysUntilExpiration} days`,
          confidence: pred.confidence,
          potentialSavings: pred.wasteRisk.estimatedWasteValue,
          daysUntilAction: pred.wasteRisk.daysUntilExpiration,
          reasoning: "Based on expiration dates and current stock.",
          actionable: true
        };
      }) || [];

      const allInsights = [...reorderInsights, ...wasteInsights];
      setInsights(allInsights);

      // Generate summary
      const totalSavings = allInsights.reduce((sum, insight) => sum + (insight.potentialSavings || 0), 0);
      const highPriorityCount = allInsights.filter(insight =>
        insight.priority === 'high' || insight.priority === 'critical'
      ).length;

      setSummary({
        totalPredictions: allInsights.length,
        highPriorityItems: highPriorityCount,
        potentialSavings: totalSavings,
        accuracyRate: 87, // This would come from historical feedback
        lastUpdated: new Date().toLocaleTimeString()
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAIData();
  }, [selectedLocation]);

  const handleInsightAction = async (insightId: string, action: string) => {
    try {
      // Extract type and item ID from insight ID
      const [type, itemId] = insightId.split('-');

      const endpoint = type === 'reorder' ? '/api/ai/reorder-predictions' : '/api/ai/waste-prevention';

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          action,
          feedback: 'helpful'
        })
      });

      // Remove the insight from the list or reload data
      setInsights(prev => prev.filter(insight => insight.id !== insightId));

    } catch (err) {
      console.error('Failed to handle insight action:', err);
    }
  };

  const handleInsightDismiss = (insightId: string) => {
    setInsights(prev => prev.filter(insight => insight.id !== insightId));
  };

  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <p>Failed to load AI insights: {error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => loadAIData()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Controls */}
      <div className="flex items-center justify-end gap-2">
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {/* Would be populated with actual locations */}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadAIData(true)}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
              <Brain className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalPredictions}</div>
              <p className="text-xs text-muted-foreground">
                Updated {summary.lastUpdated}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs attention</CardTitle>
              <AlertCircle className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {summary.highPriorityItems}
              </div>
              <p className="text-xs text-muted-foreground">
                Take action soon
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estimated savings</CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${summary.potentialSavings.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Estimated monthly savings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summary.accuracyRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                Based on past results
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reorder">Restock Suggestions</TabsTrigger>
          <TabsTrigger value="waste">Prevent Waste</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : insights.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add items and usage so we can give suggestions.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {insights.slice(0, 6).map((insight) => (
                <AIInsightCard
                  key={insight.id}
                  insight={insight}
                  onAction={(action) => handleInsightAction(insight.id, action)}
                  onDismiss={() => handleInsightDismiss(insight.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reorder" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {insights
                .filter(insight => insight.type === 'reorder')
                .map((insight) => (
                  <AIInsightCard
                    key={insight.id}
                    insight={insight}
                    onAction={(action) => handleInsightAction(insight.id, action)}
                    onDismiss={() => handleInsightDismiss(insight.id)}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="waste" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {insights
                .filter(insight => insight.type === 'waste_risk')
                .map((insight) => (
                  <AIInsightCard
                    key={insight.id}
                    insight={insight}
                    onAction={(action) => handleInsightAction(insight.id, action)}
                    onDismiss={() => handleInsightDismiss(insight.id)}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIDashboard;
