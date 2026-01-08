import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { addStatusToItems, calculateInventorySummary } from "@/lib/inventory-status";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  try {
    // For now, let's just use the existing seeded data instead of creating users dynamically
    // In a production app, you'd get the actual user data from Clerk and sync with database
    const existingOrg = await prisma.organization.findFirst({
      include: {
        settings: true,
        users: true,
        categories: true,
      },
    });

    if (!existingOrg) {
      throw new Error("No organization found. Please run database seed first.");
    }

    // Fetch all inventory data for the organization
    const [items, categories, settings] = await Promise.all([
      prisma.item.findMany({
        where: { organizationId: existingOrg.id },
        include: {
          category: true,
          organization: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({
        where: { organizationId: existingOrg.id },
        orderBy: { name: "asc" },
      }),
      prisma.settings.findUnique({
        where: { organizationId: existingOrg.id },
      }),
    ]);

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