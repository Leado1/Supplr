import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSubscriptionProvider } from "@/lib/subscription-helpers";
import { cancelPolarSubscription } from "@/lib/polar-helpers";

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

    const subscription = user?.organization?.subscription;
    if (!subscription) {
      return NextResponse.json(
        { message: "No active subscription found" },
        { status: 404 }
      );
    }

    const provider = getSubscriptionProvider(subscription);

    if (provider === 'polar' && subscription.polarSubscriptionId) {
      // Cancel Polar.sh subscription
      await cancelPolarSubscription(subscription.polarSubscriptionId);

      // Update local subscription record
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "canceling", // Will be updated by webhook to "canceled"
        },
      });

      return NextResponse.json({
        message: "Subscription cancellation initiated. You'll retain access until the end of your billing period.",
      });
    } else if (provider === 'stripe') {
      return NextResponse.json(
        { message: "Stripe subscriptions no longer supported. Please contact support." },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { message: "No active subscription found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { message: "Failed to cancel subscription. Please contact support." },
      { status: 500 }
    );
  }
}
