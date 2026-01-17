"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import { BarcodeScannerModal } from "@/components/modals/barcode-scanner-modal";
import type { ItemWithStatus, InventorySummary } from "@/types/inventory";
import type { Category } from "@prisma/client";

interface DashboardContentProps {
  organizationName: string;
  items: ItemWithStatus[];
  categories: Category[];
  summary: InventorySummary;
}

export function DashboardContent({
  organizationName,
  items,
  categories,
  summary,
}: DashboardContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    // Check for checkout success parameter
    if (searchParams.get("checkout_success") === "true") {
      setShowSuccessMessage(true);

      // Clean up the URL
      window.history.replaceState({}, document.title, "/dashboard");

      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    }
  }, [searchParams]);

  const handleAddItem = () => {
    router.push("/inventory?action=add");
  };

  // Barcode scanner handlers
  const handleItemScanned = (item: any) => {
    // Show success message and redirect to inventory
    alert(`Item found: ${item.name}\nQuantity: ${item.quantity}`);
    router.push("/inventory");
  };

  const handleNewItemFromBarcode = (barcode: string) => {
    // Redirect to inventory with the barcode for new item creation
    router.push(`/inventory?new_barcode=${encodeURIComponent(barcode)}`);
  };

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
            Welcome back to {organizationName}
          </p>
        </div>
        <div className="flex space-x-2">
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
          <Button variant="outline" onClick={handleAddItem}>
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Quick Add
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={summary} />

      {/* Recent Activity & Quick Overview */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Inventory Activity</h2>
          <Link href="/inventory">
            <Button variant="outline" size="sm">
              View All Items
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No inventory items yet
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by adding your first inventory item
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleAddItem}>
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add First Item
              </Button>
              <Link href="/import">
                <Button variant="outline">
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
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                  Import Items
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/inventory?action=add">
                <div className="p-4 border border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="font-medium">Add New Item</span>
                  </div>
                </div>
              </Link>

              <Link href="/import">
                <div className="p-4 border border-dashed border-green-300 rounded-lg bg-green-50 hover:bg-green-100 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-2 text-green-700">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                    <span className="font-medium">Import Items</span>
                  </div>
                </div>
              </Link>

              <div
                onClick={() => setIsScannerOpen(true)}
                className="p-4 border border-dashed border-purple-300 rounded-lg bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-2 text-purple-700">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2zM8 21l4-7 4 7M8 5h8v4H8z"
                    />
                  </svg>
                  <span className="font-medium">Scan Barcode</span>
                </div>
              </div>
            </div>

            {/* Recently Added Items Preview */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Recently Added Items
                </h3>
                <p className="text-sm text-gray-500">
                  Latest {Math.min(items.length, 5)} inventory items
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {items.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.category.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          Qty: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-500">
                          ${item.unitCost.toString()}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {item.status === "ok" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            OK
                          </span>
                        )}
                        {item.status === "low_stock" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Low Stock
                          </span>
                        )}
                        {item.status === "expiring_soon" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Expiring Soon
                          </span>
                        )}
                        {item.status === "expired" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Expired
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {summary.expiringSoon > 0 ||
      summary.expired > 0 ||
      summary.lowStock > 0 ? (
        <div className="rounded-lg bg-muted/50 p-6">
          <h3 className="mb-4 text-lg font-semibold">
            Items Needing Attention
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {summary.expired > 0 && (
              <div className="rounded-lg border bg-red-50 p-4">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span className="font-medium text-red-700">
                    {summary.expired} Expired Items
                  </span>
                </div>
                <p className="mt-2 text-sm text-red-600">
                  Remove these items from inventory to avoid safety issues.
                </p>
              </div>
            )}

            {summary.expiringSoon > 0 && (
              <div className="rounded-lg border bg-yellow-50 p-4">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                  <span className="font-medium text-yellow-700">
                    {summary.expiringSoon} Expiring Soon
                  </span>
                </div>
                <p className="mt-2 text-sm text-yellow-600">
                  Use these items first or mark for quick sale.
                </p>
              </div>
            )}

            {summary.lowStock > 0 && (
              <div className="rounded-lg border bg-orange-50 p-4">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <span className="font-medium text-orange-700">
                    {summary.lowStock} Low Stock Items
                  </span>
                </div>
                <p className="mt-2 text-sm text-orange-600">
                  Reorder these items to maintain adequate inventory.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-green-50 border border-green-200 p-6 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-800">All Good!</h3>
          <p className="text-green-600">
            Your inventory is well-stocked with no immediate attention needed.
          </p>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onItemScanned={handleItemScanned}
        onNewItemRequested={handleNewItemFromBarcode}
      />
    </div>
  );
}
