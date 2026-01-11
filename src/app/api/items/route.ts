import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addStatusToItems } from "@/lib/inventory-status";
import { createItemSchema } from "@/lib/validations";
import { getUserOrganization } from "@/lib/auth-helpers";

// GET /api/items - Get all items for the organization
export async function GET() {
  try {
    // Get user's organization with security checks
    const { error: orgError, organization } = await getUserOrganization();
    if (orgError) return orgError;

    // Fetch all items for the organization
    const items = await prisma.item.findMany({
      where: {
        organizationId: organization!.id,
      },
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
    const { error: orgError, organization } = await getUserOrganization();
    if (orgError) return orgError;

    const body = await request.json();

    // Validate the input
    const validationResult = createItemSchema.safeParse({
      ...body,
      expirationDate: new Date(body.expirationDate),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid data", errors: validationResult.error.issues },
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
      if (subscription.plan === "trial" && subscription.trialEndsAt && new Date() > subscription.trialEndsAt) {
        return NextResponse.json(
          {
            message: "Trial period has expired. Please upgrade to continue adding items.",
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
            message: "Subscription is not active. Please contact support or update your payment method.",
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