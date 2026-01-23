"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocationChangeEffect } from "@/contexts/location-context";
import Link from "next/link";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LocationDropdown } from "@/components/location-dropdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Loader2, RefreshCw, X } from "lucide-react";
import { BarcodeScannerModal } from "@/components/modals/barcode-scanner-modal";
import { SubscriptionSuccessModal } from "@/components/modals/subscription-success-modal";
import type { ItemWithStatus, InventorySummary } from "@/types/inventory";
import type { Category } from "@prisma/client";

const MULTI_LOCATION_NOTICE_KEY = "supplr:hide-multi-location-notice";

interface InventoryData {
  items: ItemWithStatus[];
  categories: Category[];
  summary: InventorySummary;
  organizationName: string;
  organizationId: string;
  hasMultiLocationAccess: boolean;
  currentLocationId?: string;
  hasAIFeatures?: boolean;
}

export function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [subscribedPlan, setSubscribedPlan] = useState<string>("starter");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hideMultiLocationNotice, setHideMultiLocationNotice] = useState(false);
  const [multiLocationNoticeReady, setMultiLocationNoticeReady] =
    useState(false);
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
  useLocationChangeEffect(
    useCallback(
      (location) => {
        if (!isLoading) {
          setIsRefreshing(true);
          fetchInventoryData(location?.id);
        }
      },
      [fetchInventoryData, isLoading]
    )
  );

  // Handle checkout success
  useEffect(() => {
    if (searchParams.get("checkout_success") === "true") {
      // Fetch the current subscription plan
      const fetchPlan = async () => {
        try {
          const response = await fetch("/api/subscription/features");
          if (response.ok) {
            const data = await response.json();
            setSubscribedPlan(data.plan || "starter");
          }
        } catch (error) {
          console.error("Error fetching subscription plan:", error);
        }
        setShowSuccessModal(true);
      };
      fetchPlan();
      window.history.replaceState({}, document.title, "/dashboard");
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      const dismissed =
        localStorage.getItem(MULTI_LOCATION_NOTICE_KEY) === "true";
      setHideMultiLocationNotice(dismissed);
    } catch {
      setHideMultiLocationNotice(false);
    } finally {
      setMultiLocationNoticeReady(true);
    }
  }, []);

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

  const handleDismissMultiLocationNotice = () => {
    setHideMultiLocationNotice(true);
    try {
      localStorage.setItem(MULTI_LOCATION_NOTICE_KEY, "true");
    } catch {
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="mb-4 text-xl font-semibold text-red-800">
          Error Loading Dashboard
        </h2>
        <p className="mb-4 text-red-600">
          {error || "There was an issue loading your inventory data."}
        </p>
        <Button onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const summary = {
    totalItems: data.summary?.totalItems ?? 0,
    totalValue: data.summary?.totalValue ?? 0,
    expiringSoon: data.summary?.expiringSoon ?? 0,
    expired: data.summary?.expired ?? 0,
    lowStock: data.summary?.lowStock ?? 0,
  };

  const priorityItems = data.items.filter(
    (item) =>
      item.status === "low_stock" ||
      item.status === "expiring_soon" ||
      item.status === "expired"
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const getStatusLabel = (status: ItemWithStatus["status"]) => {
    if (status === "low_stock") {
      return "low stock";
    }
    if (status === "expiring_soon") {
      return "expiring soon";
    }
    return status;
  };

  const getStatusVariant = (status: ItemWithStatus["status"]) => {
    if (status === "ok") {
      return "secondary";
    }
    return "outline";
  };

  return (
    <div className="space-y-6">
      {/* Subscription Success Modal */}
      <SubscriptionSuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        plan={subscribedPlan}
      />

      {/* Multi-location Notice for Enterprise users */}
      {data.hasMultiLocationAccess &&
        multiLocationNoticeReady &&
        !hideMultiLocationNotice && (
        <Alert className="border-muted/60 bg-muted/40">
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-start justify-between gap-4">
            <AlertDescription className="text-muted-foreground">
              <strong>Multi-Location Enabled:</strong> You can switch between
              locations using the dropdown on this page. Inventory data is
              filtered by your selected location.
            </AlertDescription>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDismissMultiLocationNotice}
              className="mt-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss multi-location notice"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}

      {/* Hero Section */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-4">
          <div>
            <CardTitle className="text-xl">Inventory Overview</CardTitle>
            <CardDescription>
              Welcome back to {data.organizationName}. Keep supplies
              stocked, track expiration, and act on low stock.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isRefreshing && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Refreshing
              </Badge>
            )}
            <LocationDropdown variant="compact" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 pt-0">
          <Link href="/inventory">
            <Button className="bg-foreground text-background hover:bg-foreground/90">
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
            className="border-input text-foreground hover:bg-muted"
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
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <SummaryCards summary={summary} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest inventory changes across your locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.items.length === 0 ? (
              <p className="text-muted-foreground">
                No inventory items found.
              </p>
            ) : (
              <div className="space-y-3">
                {data.items.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.category.name} - Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusVariant(item.status)}>
                        {getStatusLabel(item.status)}
                      </Badge>
                      {item.location && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.location.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar - Priority Items & Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Details</CardTitle>
            <CardDescription>
              Items that need attention and category breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold">Priority Items</p>
              {priorityItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No urgent items right now.
                </p>
              ) : (
                <div className="space-y-3">
                  {priorityItems.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.category.name} - Qty: {item.quantity}
                          {item.location ? ` - ${item.location.name}` : ""}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(item.status)}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-3">
              <p className="text-sm font-semibold">Categories</p>
              {data.categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No categories found.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
                    >
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.items.filter((item) => item.category.id === category.id).length} items
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total items</span>
                <span className="font-medium">{summary.totalItems}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total value</span>
                <span className="font-medium">
                  {formatCurrency(summary.totalValue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expiring soon</span>
                <span className="font-medium">{summary.expiringSoon}</span>
              </div>
            </div>
          </CardContent>
        </Card>
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

