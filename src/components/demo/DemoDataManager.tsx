/**
 * Demo Data Manager - Component for generating and managing demo inventory data
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Database,
  Trash2,
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Brain,
  Sparkles,
  CheckCircle
} from "lucide-react";

interface DemoDataOptions {
  itemsPerCategory: number;
  generateUsageHistory: boolean;
  historicalDays: number;
  createExpiredItems: boolean;
  createLowStockItems: boolean;
  wasteRiskPercentage: number;
  cleanExistingData: boolean;
}

interface DemoDataResult {
  categoriesCreated: number;
  itemsCreated: number;
  usageRecordsCreated: number;
  predictionsCreated: number;
  summary: {
    expiredItems: number;
    lowStockItems: number;
    wasteRiskItems: number;
    totalValue: number;
  };
}

export function DemoDataManager() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [result, setResult] = useState<DemoDataResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [options, setOptions] = useState<DemoDataOptions>({
    itemsPerCategory: 4,
    generateUsageHistory: true,
    historicalDays: 90,
    createExpiredItems: true,
    createLowStockItems: true,
    wasteRiskPercentage: 0.15,
    cleanExistingData: true
  });

  const generateDemoData = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/demo/generate-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to generate demo data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate demo data');
    } finally {
      setIsGenerating(false);
    }
  };

  const cleanDemoData = async () => {
    setIsCleaning(true);
    setError(null);

    try {
      const response = await fetch('/api/demo/generate-data', {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setResult(null);
        alert(`Demo data cleaned successfully!\n${data.data.itemsDeleted} items deleted`);
      } else {
        setError(data.error || 'Failed to clean demo data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clean demo data');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6" />
            Demo Data Generator
          </h2>
          <p className="text-muted-foreground">
            Generate realistic medical inventory data to showcase AI features
          </p>
        </div>
      </div>

      {/* Options */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Options</CardTitle>
          <CardDescription>
            Configure the demo data generation parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Options */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="itemsPerCategory">Items per Category</Label>
              <Input
                id="itemsPerCategory"
                type="number"
                min="1"
                max="10"
                value={options.itemsPerCategory}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  itemsPerCategory: parseInt(e.target.value) || 1
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Number of items to create in each medical category (1-10)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="historicalDays">Historical Data Days</Label>
              <Input
                id="historicalDays"
                type="number"
                min="30"
                max="365"
                value={options.historicalDays}
                disabled={!options.generateUsageHistory}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  historicalDays: parseInt(e.target.value) || 90
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Days of historical usage data to generate (30-365)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wasteRiskPercentage">Waste Risk Percentage</Label>
              <Input
                id="wasteRiskPercentage"
                type="number"
                min="0"
                max="0.5"
                step="0.05"
                value={options.wasteRiskPercentage}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  wasteRiskPercentage: parseFloat(e.target.value) || 0.15
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Percentage of items that will have high waste risk (0-0.5)
              </p>
            </div>
          </div>

          <Separator />

          {/* Toggle Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Generate Usage History</Label>
                <p className="text-sm text-muted-foreground">
                  Create historical usage patterns for AI training data
                </p>
              </div>
              <Switch
                checked={options.generateUsageHistory}
                onCheckedChange={(checked) => setOptions(prev => ({
                  ...prev,
                  generateUsageHistory: checked
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Create Expired Items</Label>
                <p className="text-sm text-muted-foreground">
                  Include some expired items to demonstrate waste tracking
                </p>
              </div>
              <Switch
                checked={options.createExpiredItems}
                onCheckedChange={(checked) => setOptions(prev => ({
                  ...prev,
                  createExpiredItems: checked
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Create Low Stock Items</Label>
                <p className="text-sm text-muted-foreground">
                  Include items with low stock to demonstrate reorder alerts
                </p>
              </div>
              <Switch
                checked={options.createLowStockItems}
                onCheckedChange={(checked) => setOptions(prev => ({
                  ...prev,
                  createLowStockItems: checked
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Clean Existing Data</Label>
                <p className="text-sm text-muted-foreground">
                  Remove existing inventory items before generating new data
                </p>
              </div>
              <Switch
                checked={options.cleanExistingData}
                onCheckedChange={(checked) => setOptions(prev => ({
                  ...prev,
                  cleanExistingData: checked
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={generateDemoData}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isGenerating ? 'Generating...' : 'Generate Demo Data'}
        </Button>

        <Button
          variant="destructive"
          onClick={cleanDemoData}
          disabled={isCleaning}
          className="flex items-center gap-2"
        >
          {isCleaning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          {isCleaning ? 'Cleaning...' : 'Clean All Data'}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Demo Data Generated Successfully!
            </CardTitle>
            <CardDescription>
              Your medical inventory is now populated with realistic demo data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{result.itemsCreated}</p>
                  <p className="text-sm text-muted-foreground">Items Created</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">{result.usageRecordsCreated}</p>
                  <p className="text-sm text-muted-foreground">Usage Records</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-indigo-600" />
                <div>
                  <p className="text-2xl font-bold text-indigo-600">{result.predictionsCreated}</p>
                  <p className="text-sm text-muted-foreground">AI Predictions</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    ${result.summary.totalValue.toFixed(0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <p className="font-semibold text-green-800">Demo Features Ready:</p>
              <div className="flex flex-wrap gap-2">
                {result.summary.expiredItems > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {result.summary.expiredItems} Expired Items
                  </Badge>
                )}
                {result.summary.lowStockItems > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {result.summary.lowStockItems} Low Stock Items
                  </Badge>
                )}
                {result.summary.wasteRiskItems > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {result.summary.wasteRiskItems} Waste Risk Items
                  </Badge>
                )}
                <Badge className="text-xs">
                  {result.categoriesCreated} Medical Categories
                </Badge>
              </div>
            </div>

            <Alert className="mt-4 border-blue-200 bg-blue-50">
              <Brain className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Next Steps:</strong> Visit the AI Dashboard to see intelligent recommendations
                based on your generated data. The AI will analyze usage patterns and provide
                waste prevention, reorder predictions, and cost optimization suggestions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DemoDataManager;