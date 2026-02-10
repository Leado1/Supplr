import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { Polar } from "@polar-sh/sdk";
import { createOrGetPolarCustomer } from "@/lib/polar-helpers";
import { hasPermission, Permission } from "@/lib/permissions";

/**
 * Manual subscription activation for development
 * This simulates what the Polar webhook would do
 */
export async function POST(request: NextRequest) {
  try {
    const manualActivationEnabled =
      process.env.NODE_ENV !== "production" ||
      process.env.ALLOW_MANUAL_BILLING_ACTIVATION === "true";

    if (!manualActivationEnabled) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { checkoutId, productId: manualProductId, customerId: manualCustomerId } = body;

    if (!checkoutId) {
      return NextResponse.json(
        { error: "Checkout ID is required" },
        { status: 400 }
      );
    }

    let productId: string | null = null;
    let customerId: string | null = null;

    // Check if this is a manual dev activation (has productId and customerId in body)
    if (manualProductId && manualCustomerId) {
      // Development mode: use provided IDs but create real customer
      productId = manualProductId;

      // Create a real Polar customer for development testing
      try {
        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
        });

        if (!user) {
          return NextResponse.json(
            { error: "User not found for customer creation" },
            { status: 404 }
          );
        }

        const customer = await createOrGetPolarCustomer(user.email, user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email);
        customerId = customer.id;
        console.log("Created/found Polar customer for development:", customerId);
      } catch (error) {
        console.error("Failed to create Polar customer for development:", error);
        return NextResponse.json(
          {
            error: "Failed to create customer in Polar",
            details: error instanceof Error ? error.message : String(error),
            suggestion: "Check if POLAR_ACCESS_TOKEN is set in your environment variables"
          },
          { status: 500 }
        );
      }
    } else {
      // Production mode: fetch from Polar API
      const polar = new Polar({
        accessToken: process.env.POLAR_ACCESS_TOKEN,
      });

      let checkout;
      try {
        checkout = await polar.checkouts.get({
          id: checkoutId,
        });
      } catch (error) {
        console.error("Failed to fetch checkout from Polar:", error);
        return NextResponse.json(
          { error: "Failed to fetch checkout details" },
          { status: 400 }
        );
      }

      productId = checkout.products?.[0]?.id ?? null;
      customerId = checkout.customerId ?? null;

      if (!productId || !customerId) {
        return NextResponse.json(
          { error: "Incomplete checkout data - missing product or customer ID" },
          { status: 400 }
        );
      }
    }

    const resolvedProductId = productId!;
    const resolvedCustomerId = customerId!;

    // Find user and organization
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    if (!hasPermission(user.role, Permission.MANAGE_BILLING)) {
      return NextResponse.json(
        { error: "Insufficient permissions to activate billing" },
        { status: 403 }
      );
    }

    // If user doesn't have an organization, create one
    if (!user.organization) {
      console.log("Creating organization for user:", user.email);

      const organization = await prisma.organization.create({
        data: {
          name: user.email + "'s Organization", // Default name
        },
      });

      // Update user to link to the new organization
      user = await prisma.user.update({
        where: { id: user.id },
        data: { organizationId: organization.id },
        include: { organization: true },
      });

      console.log("Created organization:", organization.id);
    }

    // Get plan details from product ID
    const planDetails = getPlanDetailsFromProductId(resolvedProductId);

    console.log("Manually activating subscription:", {
      checkoutId,
      productId: resolvedProductId,
      customerId: resolvedCustomerId,
      planDetails,
      organizationId: user.organization.id,
    });

    // Create or update subscription (same as webhook would do)
    const subscription = await prisma.subscription.upsert({
      where: { organizationId: user.organization.id },
      create: {
        organizationId: user.organization.id,
        polarCustomerId: resolvedCustomerId,
        polarProductId: resolvedProductId,
        plan: planDetails.plan,
        status: "active",
        itemLimit: planDetails.itemLimit,
        isActive: true,
        advancedAnalytics: planDetails.advancedAnalytics,
        customCategories: planDetails.customCategories,
        apiAccess: planDetails.apiAccess,
        multiLocation: planDetails.multiLocation,
        customReports: planDetails.customReports,
      },
      update: {
        polarCustomerId: resolvedCustomerId,
        polarProductId: resolvedProductId,
        plan: planDetails.plan,
        status: "active",
        itemLimit: planDetails.itemLimit,
        isActive: true,
        advancedAnalytics: planDetails.advancedAnalytics,
        customCategories: planDetails.customCategories,
        apiAccess: planDetails.apiAccess,
        multiLocation: planDetails.multiLocation,
        customReports: planDetails.customReports,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription activated successfully",
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        isActive: subscription.isActive,
      },
    });
  } catch (error) {
    console.error("Error manually activating subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to activate subscription",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

function getPlanDetailsFromProductId(productId: string) {
  // Map your Polar product IDs to plan details
  const planMapping: Record<string, {
    plan: string;
    itemLimit: number;
    advancedAnalytics: boolean;
    customCategories: boolean;
    apiAccess: boolean;
    multiLocation: boolean;
    customReports: boolean;
  }> = {
    // Starter Plans
    "c6b81c8b-2fb6-4ab7-ad27-dbb51525557e": { // Starter Annual
      plan: "starter",
      itemLimit: 50,
      advancedAnalytics: false,
      customCategories: false,
      apiAccess: false,
      multiLocation: false,
      customReports: false,
    },
    "80233fb0-8372-4b73-b584-5e156e47c801": { // Starter Monthly
      plan: "starter",
      itemLimit: 50,
      advancedAnalytics: false,
      customCategories: false,
      apiAccess: false,
      multiLocation: false,
      customReports: false,
    },

    // Professional Plans
    "dcce171f-ba7d-4ebf-b76d-ee4cf91492aa": { // Professional Annual
      plan: "professional",
      itemLimit: 200,
      advancedAnalytics: true,
      customCategories: true,
      apiAccess: false,
      multiLocation: false,
      customReports: true,
    },
    "421dbc95-45f5-4233-bc13-c0975d8df9c2": { // Professional Monthly
      plan: "professional",
      itemLimit: 200,
      advancedAnalytics: true,
      customCategories: true,
      apiAccess: false,
      multiLocation: false,
      customReports: true,
    },

    // Enterprise Plans
    "332fafed-0207-4c80-837a-6f884ca7d6bb": { // Enterprise Annual
      plan: "enterprise",
      itemLimit: -1, // Unlimited
      advancedAnalytics: true,
      customCategories: true,
      apiAccess: true,
      multiLocation: true,
      customReports: true,
    },
    "97a755c6-a969-4cdc-8d89-b2bdf12ef01b": { // Enterprise Monthly - CORRECTED ID
      plan: "enterprise",
      itemLimit: -1, // Unlimited
      advancedAnalytics: true,
      customCategories: true,
      apiAccess: true,
      multiLocation: true,
      customReports: true,
    },
  };

  return planMapping[productId] || {
    plan: "trial",
    itemLimit: 5,
    advancedAnalytics: false,
    customCategories: false,
    apiAccess: false,
    multiLocation: false,
    customReports: false,
  };
}
