import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserWithRole } from "@/lib/auth-helpers";
import { createPolarCheckout, getProductIdForPlan } from "@/lib/polar-helpers";
import { hasPermission, Permission } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { error, user, organization } = await getUserWithRole();

    if (error || !user || !organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    if (!hasPermission(user.role, Permission.MANAGE_BILLING)) {
      return NextResponse.json(
        { error: "Insufficient permissions to manage billing" },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log("Raw request body:", JSON.stringify(body, null, 2));
    const { plan, period } = body;
    console.log("Extracted values:", { plan, period, planType: typeof plan, periodType: typeof period });

    if (!plan || !period) {
      return NextResponse.json(
        { error: "Plan and billing period are required" },
        { status: 400 }
      );
    }

    if (!["starter", "professional", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    if (!["monthly", "annual"].includes(period)) {
      return NextResponse.json(
        { error: "Invalid billing period" },
        { status: 400 }
      );
    }

    // Get the product ID for this plan and period
    const productId = getProductIdForPlan(plan, period);
    console.log("Product ID lookup:", { plan, period, productId });

    if (!productId) {
      console.error("No product ID found for plan:", plan, "period:", period);
      return NextResponse.json(
        { error: "Invalid plan configuration" },
        { status: 400 }
      );
    }

    // Create checkout session
    const checkout = await createPolarCheckout({
      productId,
      customerEmail: user.email,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });

    return NextResponse.json({
      success: true,
      checkout_url: checkout.url,
      checkout_id: checkout.id,
    });

  } catch (error) {
    console.error("Error creating checkout session:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
