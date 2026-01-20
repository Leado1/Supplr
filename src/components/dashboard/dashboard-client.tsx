"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocationChangeEffect } from "@/contexts/location-context";
import Link from "next/link";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { BarcodeScannerModal } from "@/components/modals/barcode-scanner-modal";
import type { ItemWithStatus, InventorySummary } from "@/types/inventory";
import type { Category } from "@prisma/client";

interface InventoryData {
  items: ItemWithStatus[];
  categories: Category[];
  summary: InventorySummary;
  organizationName: string;
  hasMultiLocationAccess: boolean;
}

export function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<InventoryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch inventory data
  const fetchInventoryData = useCallback(async (locationId?: string) => {
    try {
      setError(null);

      const url = new URL("/api/inventory", window.location.origin);
      if (locationId) {
        url.searchParams.set("locationId", locationId);
      }

      const response = await fetch(url.toString());
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        console.error("Failed to fetch inventory data:", result.error);
        setError(result.error || "Failed to fetch inventory data");
      }
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      setError("Failed to load inventory data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  // Handle location changes
  useLocationChangeEffect(useCallback((location) => {
    if (!isLoading) {
      setIsRefreshing(true);
      fetchInventoryData(location?.id);
    }
  }, [fetchInventoryData, isLoading]));

  // Handle checkout success
  useEffect(() => {
    if (searchParams.get("checkout_success") === "true") {
      setShowSuccessMessage(true);
      window.history.replaceState({}, document.title, "/dashboard");
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    }
  }, [searchParams]);

  const handleAddItem = () => {
    router.push("/inventory?action=add");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchInventoryData();
  };

  // Barcode scanner handlers
  const handleItemScanned = (item: any) => {
    alert(`Item found: ${item.name}\nQuantity: ${item.quantity}`);
    router.push("/inventory");
  };

  const handleNewItemFromBarcode = (barcode: string) => {
    router.push(`/inventory?new_barcode=${encodeURIComponent(barcode)}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="mb-4 text-xl font-semibold text-red-800">
            Error Loading Dashboard
          </h2>
          <p className="text-red-600 mb-4">
            {error || "There was an issue loading your inventory data."}
          </p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <div className="flex items-center justify-between">
              <span>
                🎉 <strong>Welcome to Supplr!</strong> Your subscription has
                been activated successfully. You now have full access to all
                features.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSuccessMessage(false)}
                className="ml-4 border-green-300 text-green-700 hover:bg-green-100"
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back to {data.organizationName}
          </p>
        </div>
        <div className="flex space-x-2">
          {isRefreshing && (
            <Button variant="ghost" size="sm" disabled>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </Button>
          )}
          <Link href="/inventory">
            <Button>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              Manage Inventory
            </Button>
          </Link>
          <Button
            onClick={() => setIsScannerOpen(true)}
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V4a1 1 0 00-1-1H5a1 1 0 00-1 1v3a1 1 0 001 1zm12 0h2a1 1 0 001-1V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v3a1 1 0 001 1zM5 20h2a1 1 0 001-1v-3a1 1 0 00-1-1H5a1 1 0 00-1 1v3a1 1 0 001 1z"
              />
            </svg>
            Scan Barcode
          </Button>
          <Button onClick={handleAddItem} variant="secondary">
            + Add Item
          </Button>
        </div>
      </div>

      {/* Multi-location Notice for Enterprise users */}
      {data.hasMultiLocationAccess && (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            <strong>Multi-Location Enabled:</strong> You can switch between locations using the dropdown above. Inventory data is filtered by your selected location.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <SummaryCards summary={data.summary} />

      {/* Dashboard content continues... */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          {data.items.length === 0 ? (
            <p className="text-muted-foreground">No inventory items found.</p>
          ) : (
            <div className="space-y-2">
              {data.items.slice(0, 5).map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.category.name} • Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.status}</p>
                    {item.location && (
                      <p className="text-xs text-muted-foreground">{item.location.name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Categories</h3>
          {data.categories.length === 0 ? (
            <p className="text-muted-foreground">No categories found.</p>
          ) : (
            <div className="space-y-2">
              {data.categories.map((category) => (
                <div key={category.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.items.filter(item => item.category.id === category.id).length} items
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onItemScanned={(item) => handleItemScanned(item)}
        onNewItemRequested={handleNewItemFromBarcode}
      />
    </div>
  );
}