import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        organization: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!user?.organization.subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { message: "No active subscription found" },
        { status: 404 }
      );
    }

    // Cancel subscription at period end
    await stripe.subscriptions.update(
      user.organization.subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // Update local subscription record
    await prisma.subscription.update({
      where: { id: user.organization.subscription.id },
      data: {
        status: "canceling", // Custom status to indicate it will cancel at period end
      },
    });

    return NextResponse.json({
      message: "Subscription will be canceled at the end of the billing period",
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { message: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
