import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/organization-setup";
import { addStatusToItems, calculateInventorySummary } from "@/lib/inventory-status";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { InventoryTable } from "@/components/dashboard/inventory-table";
import { Filters } from "@/components/dashboard/filters";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  try {
    // Get user data from Clerk
    const clerkUser = {
      id: userId,
      emailAddresses: [{ emailAddress: "user@example.com" }], // This would come from Clerk in a real scenario
    };

    // Get or create user with organization
    const user = await getOrCreateUser(clerkUser);

    // Fetch all inventory data for the organization
    const [items, categories, settings] = await Promise.all([
      prisma.item.findMany({
        where: { organizationId: user.organizationId },
        include: {
          category: true,
          organization: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({
        where: { organizationId: user.organizationId },
        orderBy: { name: "asc" },
      }),
      prisma.settings.findUnique({
        where: { organizationId: user.organizationId },
      }),
    ]);

    // Add status to items and calculate summary
    const itemsWithStatus = addStatusToItems(items, settings!);
    const summary = calculateInventorySummary(itemsWithStatus);

    return (
      <div className="container mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back to {user.organization.name}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Report
            </Button>
            <Button>
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
          onSearchChange={() => {}}
          onStatusFilter={() => {}}
          onCategoryFilter={() => {}}
        />

        {/* Inventory Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Inventory Items</h2>
            <div className="text-sm text-muted-foreground">
              {itemsWithStatus.length} total items
            </div>
          </div>

          <InventoryTable items={itemsWithStatus} />
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
  } catch (error) {
    console.error("Dashboard error:", error);

    return (
      <div className="container mx-auto p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="mb-4 text-xl font-semibold text-red-800">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-4">
            There was an issue loading your inventory data. This might be because:
          </p>
          <ul className="text-left text-sm text-red-600 space-y-1 mb-4">
            <li>• Your database connection needs to be configured</li>
            <li>• User synchronization is still in progress</li>
            <li>• Database tables need to be created</li>
          </ul>
          <Button asChild>
            <a href="/api/webhooks/clerk" target="_blank">
              Test Database Connection
            </a>
          </Button>
        </div>
      </div>
    );
  }
}