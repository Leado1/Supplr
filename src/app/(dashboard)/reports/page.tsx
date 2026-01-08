"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ItemWithStatus } from "@/types/inventory";

interface WasteReport {
  expiredItems: ItemWithStatus[];
  totalWasteValue: number;
  wasteCount: number;
}

export default function ReportsPage() {
  const [items, setItems] = useState<ItemWithStatus[]>([]);
  const [wasteReport, setWasteReport] = useState<WasteReport | null>(null);
  const [reportPeriod, setReportPeriod] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [reportPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/items");

      if (response.ok) {
        const itemsData = await response.json();
        setItems(itemsData);
        generateWasteReport(itemsData, parseInt(reportPeriod));
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateWasteReport = (itemsData: ItemWithStatus[], days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const expiredItems = itemsData.filter(
      (item) =>
        item.status === "expired" &&
        new Date(item.expirationDate) >= cutoffDate
    );

    const totalWasteValue = expiredItems.reduce(
      (sum, item) => sum + (Number(item.unitCost) * item.quantity),
      0
    );

    setWasteReport({
      expiredItems,
      totalWasteValue,
      wasteCount: expiredItems.length,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const exportReport = () => {
    if (!wasteReport) return;

    const csvContent = [
      "Item Name,SKU,Category,Quantity,Unit Cost,Total Value,Expiration Date",
      ...wasteReport.expiredItems.map(item =>
        `"${item.name}","${item.sku || ''}","${item.category.name}",${item.quantity},${item.unitCost},${Number(item.unitCost) * item.quantity},"${formatDate(item.expirationDate)}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waste-report-${reportPeriod}-days.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getInventoryValueByCategory = () => {
    const categoryTotals: Record<string, { value: number; count: number }> = {};

    items.forEach(item => {
      const categoryName = item.category.name;
      const itemValue = Number(item.unitCost) * item.quantity;

      if (!categoryTotals[categoryName]) {
        categoryTotals[categoryName] = { value: 0, count: 0 };
      }

      categoryTotals[categoryName].value += itemValue;
      categoryTotals[categoryName].count += 1;
    });

    return Object.entries(categoryTotals)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.value - a.value);
  };

  if (loading) {
    return (
      <div className="container mx-auto space-y-8 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Track waste, analyze inventory value, and optimize your medical supplies
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Waste Report Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Expired</CardTitle>
            <div className="h-4 w-4 text-red-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {wasteReport?.wasteCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In the last {reportPeriod} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waste Value</CardTitle>
            <div className="h-4 w-4 text-red-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(wasteReport?.totalWasteValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Lost to expiration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <div className="h-4 w-4 text-green-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                items.reduce((sum, item) => sum + (Number(item.unitCost) * item.quantity), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Current stock value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Value by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Value by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getInventoryValueByCategory().map(({ category, value, count }) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{category}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {count} items
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(value)}</div>
                  <div className="text-sm text-muted-foreground">
                    {((value / items.reduce((sum, item) => sum + (Number(item.unitCost) * item.quantity), 0)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expired Items Detail */}
      {wasteReport && wasteReport.expiredItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Expired Items Detail</span>
              <Badge variant="destructive">{wasteReport.expiredItems.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {wasteReport.expiredItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.sku && `SKU: ${item.sku} • `}
                      Category: {item.category.name}
                    </div>
                    <div className="text-sm text-red-600">
                      Expired on {formatDate(item.expirationDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(Number(item.unitCost) * item.quantity)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity} × {formatCurrency(Number(item.unitCost))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State for Waste Report */}
      {wasteReport && wasteReport.expiredItems.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800">Excellent Waste Management!</h3>
              <p className="text-green-600">
                No items have expired in the last {reportPeriod} days.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}