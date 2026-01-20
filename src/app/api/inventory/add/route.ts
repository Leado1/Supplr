import { NextRequest, NextResponse } from "next/server";
import { getUserOrganization } from "@/lib/auth-helpers";
import { hasExceededItemLimit, requireActiveSubscription, getSubscriptionFeatures } from "@/lib/subscription-helpers";
import { hasPermission, Permission } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Get user's organization with subscription
    const { error, organization, user } = await getUserOrganization();

    if (error || !organization || !user) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to add items
    if (!hasPermission(user.role, Permission.MANAGE_INVENTORY)) {
      return NextResponse.json(
        { error: "Insufficient permissions to add inventory items" },
        { status: 403 }
      );
    }

    // Require active subscription
    try {
      await requireActiveSubscription(organization.id);
    } catch (subscriptionError) {
      return NextResponse.json(
        { error: `${subscriptionError}` },
        { status: 402 } // Payment Required
      );
    }

    // Check item limit
    const exceedsLimit = await hasExceededItemLimit(organization.id);
    if (exceedsLimit) {
      const features = getSubscriptionFeatures(organization.subscription, organization);
      return NextResponse.json(
        {
          error: `Item limit reached for ${features.plan} plan (${features.itemLimit} items). Please upgrade your subscription to add more items.`,
          currentPlan: features.plan,
          itemLimit: features.itemLimit
        },
        { status: 402 } // Payment Required
      );
    }

    const body = await request.json();
    const {
      name,
      quantity,
      unitCost,
      expirationDate,
      categoryId,
      locationId,
      sku,
      reorderThreshold
    } = body;

    // Validate required fields
    if (!name || !quantity || !unitCost || !expirationDate || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields: name, quantity, unitCost, expirationDate, categoryId" },
        { status: 400 }
      );
    }

    // Validate location if provided
    if (locationId) {
      const features = getSubscriptionFeatures(organization.subscription, organization);

      if (!features.multiLocation) {
        return NextResponse.json(
          { error: "Location assignment requires Enterprise subscription" },
          { status: 403 }
        );
      }

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
    }

    // Validate category exists and belongs to organization
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        organizationId: organization.id,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Create the item
    const item = await prisma.item.create({
      data: {
        name: name.trim(),
        quantity: parseInt(quantity),
        unitCost: parseFloat(unitCost),
        expirationDate: new Date(expirationDate),
        categoryId,
        locationId: locationId || null,
        organizationId: organization.id,
        sku: sku?.trim() || null,
        reorderThreshold: parseInt(reorderThreshold) || 5,
      },
      include: {
        category: true,
        location: true,
      },
    });

    return NextResponse.json({
      item: {
        ...item,
        unitCost: item.unitCost.toString(),
        expirationDate: item.expirationDate.toISOString(),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    }, { status: 201 });

  } catch (error) {
    console.error("Error adding inventory item:", error);
    return NextResponse.json(
      { error: "Failed to add inventory item" },
      { status: 500 }
    );
  }
}