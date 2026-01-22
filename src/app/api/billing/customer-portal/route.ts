import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSubscriptionProvider } from "@/lib/subscription-helpers";
import { createCustomerPortalSession, getPolarCustomer } from "@/lib/polar-helpers";
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization and subscription
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

    if (!user?.organization?.subscription) {
      return NextResponse.json(
        { message: "No subscription found" },
        { status: 404 }
      );
    }

    const subscription = user.organization.subscription;
    const provider = getSubscriptionProvider(subscription);

    if (provider === 'polar') {
      // Create Polar customer portal session
      if (!subscription.polarCustomerId) {
        return NextResponse.json(
          { message: "No customer ID found for Polar subscription" },
          { status: 400 }
        );
      }

      try {
        const uuidPattern =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let polarCustomerId = subscription.polarCustomerId;

        if (!uuidPattern.test(polarCustomerId)) {
          const polarCustomer = await getPolarCustomer(user.email);
          if (!polarCustomer) {
            return NextResponse.json(
              { message: "No matching Polar customer found for user email" },
              { status: 404 }
            );
          }

          polarCustomerId = polarCustomer.id;
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { polarCustomerId },
          });
        }

        const portalSession = await createCustomerPortalSession({
          customerId: polarCustomerId,
        });
        return NextResponse.json({
          url: portalSession.customerPortalUrl,
          provider: 'polar',
          message: 'Redirecting to Polar customer portal'
        });
      } catch (error) {
        console.error("Error creating Polar customer portal session:", error);
        return NextResponse.json(
          { message: "Failed to create customer portal session" },
          { status: 500 }
        );
      }
    } else if (provider === 'stripe') {
      // Legacy Stripe support (if any old subscriptions still exist)
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
    console.error("Error accessing billing portal:", error);
    return NextResponse.json(
      { message: "Failed to access billing portal" },
      { status: 500 }
    );
  }
}
