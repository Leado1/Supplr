import { NextRequest, NextResponse } from "next/server";
import { getUserOrganization } from "@/lib/auth-helpers";
import {
  getSubscriptionFeatures,
  hasExceededItemLimit,
  isSubscriptionActive,
} from "@/lib/subscription-helpers";
import { prisma } from "@/lib/db";
import {
  addStatusToItems,
  calculateInventorySummary,
} from "@/lib/inventory-status";
import { DemoSeeder } from "@/lib/demo-seeder";

export async function GET(request: NextRequest) {
  try {
    // Get user's organization with subscription
    const { error, organization } = await getUserOrganization();

    if (error || !organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");

    // Check subscription status
    if (!isSubscriptionActive(organization.subscription)) {
      // For inactive subscriptions, return very limited trial data
      return NextResponse.json({
        items: [],
        categories: [],
        summary: { total: 0, lowStock: 0, expired: 0, expiringSoon: 0 },
        organizationName: organization.name,
        hasMultiLocationAccess: false,
        error:
          "Subscription inactive - please update billing to restore full access",
      });
    }

    // Check if user has multi-location access
    const features = getSubscriptionFeatures(
      organization.subscription,
      organization
    );

    const whereClause: any = {
      organizationId: organization.id,
    };

    // If user has multi-location access and locationId is provided, filter by location
    if (features.multiLocation && locationId) {
      // Verify the location belongs to this organization
      const location = await prisma.location.findFirst({
        where: {
          id: locationId,
          organizationId: organization.id,
        },
      });

      if (!location) {
        return NextResponse.json(
          { error: "Location not found" },
          { status: 404 }
        );
      }

      whereClause.locationId = locationId;
    } else if (!features.multiLocation) {
      // For non-enterprise users, only show items without locationId (legacy items)
      whereClause.locationId = null;
    }

    // Auto-seed demo data if organization has no items
    await DemoSeeder.seedIfEmpty(organization.id);

    // Fetch items
    const items = await prisma.item.findMany({
      where: whereClause,
      include: {
        category: true,
        organization: true,
        location: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch categories (also filter by location if applicable)
    const categoryWhereClause: any = {
      organizationId: organization.id,
    };

    if (features.multiLocation && locationId) {
      categoryWhereClause.locationId = locationId;
    } else if (!features.multiLocation) {
      categoryWhereClause.locationId = null;
    }

    const categories = await prisma.category.findMany({
      where: categoryWhereClause,
      orderBy: { name: "asc" },
    });

    const settings = organization.settings;

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
        organizationId: item.category.organizationId,
        locationId: item.category.locationId,
      },
      location: item.location
        ? {
            id: item.location.id,
            name: item.location.name,
            organizationId: item.location.organizationId,
          }
        : null,
    }));

    const serializedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      createdAt: cat.createdAt,
      organizationId: cat.organizationId,
      locationId: cat.locationId,
    }));

    return NextResponse.json({
      items: serializedItems,
      categories: serializedCategories,
      summary,
      organizationId: organization.id,
      organizationName: organization.name,
      hasMultiLocationAccess: features.multiLocation,
      currentLocationId: locationId,
      hasAIFeatures: features.aiPredictions || features.advancedAnalytics,
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory data" },
      { status: 500 }
    );
  }
}
