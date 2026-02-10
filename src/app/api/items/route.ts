import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addStatusToItems } from "@/lib/inventory-status";
import { createItemSchema } from "@/lib/validations";
import { getUserOrganization } from "@/lib/auth-helpers";
import { getSubscriptionFeatures } from "@/lib/subscription-helpers";
import { hasPermission, Permission } from "@/lib/permissions";

// GET /api/items - Get all items for the organization
export async function GET(request: NextRequest) {
  try {
    // Get user's organization with security checks
    const { error: orgError, organization, user } = await getUserOrganization();
    if (orgError) return orgError;

    if (!user || !hasPermission(user.role, Permission.VIEW_INVENTORY)) {
      return NextResponse.json(
        { message: "Insufficient permissions to view inventory" },
        { status: 403 }
      );
    }

    // Check for locationId parameter
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");

    // Build where clause
    const whereClause: any = {
      organizationId: organization!.id,
    };

    // Add location filter if specified and multi-location is enabled
    if (locationId && locationId !== "all") {
      // Check if user has multi-location access
      const features = getSubscriptionFeatures(organization!.subscription, organization!);

      if (features.multiLocation) {
        // Verify the location belongs to this organization
        const location = await prisma.location.findFirst({
          where: {
            id: locationId,
            organizationId: organization!.id,
          },
        });

        if (location) {
          whereClause.locationId = locationId;
        }
      }
    }

    // Fetch all items for the organization
    const items = await prisma.item.findMany({
      where: whereClause,
      include: {
        category: true,
        organization: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add status calculations
    const itemsWithStatus = addStatusToItems(items, organization!.settings!);

    return NextResponse.json(itemsWithStatus);
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/items - Create a new item
export async function POST(request: NextRequest) {
  try {
    // Get user's organization with security checks
    const { error: orgError, organization, user } = await getUserOrganization();
    if (orgError) return orgError;

    if (!user || !hasPermission(user.role, Permission.MANAGE_INVENTORY)) {
      return NextResponse.json(
        { message: "Insufficient permissions to add items" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Debug: Log the incoming data
    console.log("Received item creation data:", body);

    // Parse and validate the input
    const parsedBody = {
      ...body,
      quantity: Number(body.quantity),
      unitCost: Number(body.unitCost),
      reorderThreshold: Number(body.reorderThreshold),
      expirationDate: new Date(body.expirationDate),
    };

    console.log("Parsed data for validation:", parsedBody);

    const validationResult = createItemSchema.safeParse(parsedBody);

    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error.issues);
      return NextResponse.json(
        {
          message: "Invalid data",
          errors: validationResult.error.issues,
          receivedData: body,
          parsedData: parsedBody,
        },
        { status: 400 }
      );
    }

    // Check subscription limits
    if (organization!.subscription) {
      const currentItemCount = await prisma.item.count({
        where: { organizationId: organization!.id },
      });

      const subscription = organization!.subscription;
      const itemLimit = subscription.itemLimit;

      // Check if trial has expired
      if (
        subscription.plan === "trial" &&
        subscription.trialEndsAt &&
        new Date() > subscription.trialEndsAt
      ) {
        return NextResponse.json(
          {
            message:
              "Trial period has expired. Please upgrade to continue adding items.",
            error: "TRIAL_EXPIRED",
            trialEndsAt: subscription.trialEndsAt,
          },
          { status: 402 } // Payment Required
        );
      }

      // Check if subscription is active
      if (!subscription.isActive) {
        return NextResponse.json(
          {
            message:
              "Subscription is not active. Please contact support or update your payment method.",
            error: "SUBSCRIPTION_INACTIVE",
            status: subscription.status,
          },
          { status: 403 }
        );
      }

      // Check if adding this item would exceed the limit (-1 means unlimited)
      if (itemLimit !== -1 && currentItemCount >= itemLimit) {
        return NextResponse.json(
          {
            message: `Item limit exceeded. Your ${subscription.plan} plan allows up to ${itemLimit} items. Please upgrade your plan to add more items.`,
            error: "SUBSCRIPTION_LIMIT_EXCEEDED",
            currentCount: currentItemCount,
            limit: itemLimit,
            plan: subscription.plan,
          },
          { status: 403 }
        );
      }
    } else {
      // No subscription found - shouldn't happen but prevent item creation
      return NextResponse.json(
        {
          message: "No subscription found. Please contact support.",
          error: "NO_SUBSCRIPTION",
        },
        { status: 403 }
      );
    }

    // Create the item
    const item = await prisma.item.create({
      data: {
        ...validationResult.data,
        organizationId: organization!.id,
      },
      include: {
        category: true,
        organization: true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
