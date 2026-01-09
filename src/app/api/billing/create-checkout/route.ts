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

    const body = await request.json();
    const { priceId, planName } = body;

    if (!priceId) {
      return NextResponse.json({ message: "Price ID is required" }, { status: 400 });
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

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    let customerId = user.organization.subscription?.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        metadata: {
          organizationId: user.organizationId,
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Create or update subscription record
      await prisma.subscription.upsert({
        where: { organizationId: user.organizationId },
        create: {
          organizationId: user.organizationId,
          stripeCustomerId: customerId,
          plan: "trial",
          status: "trialing",
          itemLimit: 5,
        },
        update: {
          stripeCustomerId: customerId,
        },
      });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      billing_address_collection: "required",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        organizationId: user.organizationId,
        planName,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}