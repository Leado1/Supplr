"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { InventoryTable } from "@/components/dashboard/inventory-table";
import { Filters } from "@/components/dashboard/filters";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import type { ItemWithStatus, InventorySummary } from "@/types/inventory";
import type { InventoryStatus } from "@/types/inventory";
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
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<InventoryStatus | "all">("all");
    const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    useEffect(() => {
        // Check for checkout success parameter
        if (searchParams.get('checkout_success') === 'true') {
            setShowSuccessMessage(true);

            // Clean up the URL
            window.history.replaceState({}, document.title, '/dashboard');

            // Hide success message after 5 seconds
            setTimeout(() => {
                setShowSuccessMessage(false);
            }, 5000);
        }
    }, [searchParams]);

    const handleAddItem = () => {
        router.push("/inventory");
    };

    // Filter items based on search and filters
    const filteredItems = items.filter((item) => {
        // Search filter
        const matchesSearch =
            !searchTerm ||
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
            item.category.name.toLowerCase().includes(searchTerm.toLowerCase());

        // Status filter
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;

        // Category filter
        const matchesCategory =
            categoryFilter === "all" || item.category.id === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    return (
        <div className="container mx-auto space-y-8 p-6">
            {/* Success Message */}
            {showSuccessMessage && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                        <div className="flex items-center justify-between">
                            <span>
                                🎉 <strong>Welcome to Supplr!</strong> Your subscription has been activated successfully.
                                You now have full access to all features.
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
                    <Button variant="outline">
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export Report
                    </Button>
                    <Link href="/import">
                        <Button variant="outline">
                            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                            </svg>
                            Import Items
                        </Button>
                    </Link>
                    <Button onClick={handleAddItem}>
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Item
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <SummaryCards summary={summary} />

            {/* Filters */}
            <Filters
                categories={categories}
                onSearchChange={setSearchTerm}
                onStatusFilter={setStatusFilter}
                onCategoryFilter={setCategoryFilter}
                searchValue={searchTerm}
                statusFilter={statusFilter}
                categoryFilter={categoryFilter}
            />

            {/* Inventory Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Inventory Items</h2>
                    <div className="text-sm text-muted-foreground">
                        {filteredItems.length} total items
                    </div>
                </div>

                <InventoryTable items={filteredItems} onAddItem={handleAddItem} />
            </div>

            {/* Quick Actions */}
            {summary.expiringSoon > 0 || summary.expired > 0 || summary.lowStock > 0 ? (
                <div className="rounded-lg bg-muted/50 p-6">
                    <h3 className="mb-4 text-lg font-semibold">Items Needing Attention</h3>
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
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-green-800">All Good!</h3>
                    <p className="text-green-600">
                        Your inventory is well-stocked with no immediate attention needed.
                    </p>
                </div>
            )}
        </div>
    );
}
