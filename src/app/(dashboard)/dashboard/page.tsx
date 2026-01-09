import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { addStatusToItems, calculateInventorySummary } from "@/lib/inventory-status";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { Button } from "@/components/ui/button";
import { getUserOrganization } from "@/lib/auth-helpers";

export default async function DashboardPage() {
  try {
    // Get user's organization with security checks
    const { error: orgError, organization: existingOrg } = await getUserOrganization();
    if (orgError) {
      redirect("/sign-in");
    }

    if (!existingOrg) {
      throw new Error("No organization found. Please run database seed first.");
    }

    // Use the organization data we already have (includes settings and categories)
    const items = await prisma.item.findMany({
      where: { organizationId: existingOrg.id },
      include: {
        category: true,
        organization: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const categories = await prisma.category.findMany({
      where: { organizationId: existingOrg.id },
      orderBy: { name: "asc" },
    });

    const settings = existingOrg.settings;

    // Add status to items and calculate summary
    const itemsWithStatus = addStatusToItems(items, settings!);
    const summary = calculateInventorySummary(itemsWithStatus);

    // Serialize data for client component (convert Dates to strings)
    const serializedItems = itemsWithStatus.map((item) => ({
      ...item,
      unitCost: item.unitCost.toString(),
      expirationDate: item.expirationDate.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      category: {
        id: item.category.id,
        name: item.category.name,
      },
    }));

    const serializedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      createdAt: cat.createdAt,
      organizationId: cat.organizationId,
    }));

    return (
      <DashboardContent
        organizationName={existingOrg.name}
        items={serializedItems as any}
        categories={serializedCategories}
        summary={summary}
      />
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