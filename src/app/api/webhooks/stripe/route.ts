import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  // Check if Stripe is configured before proceeding
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe configuration missing - skipping webhook");
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  // Initialize Stripe only when we know configuration exists
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler failed:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const priceId = subscription.items.data[0]?.price.id;

  // Map price ID to plan details
  const planDetails = getPlanDetails(priceId);

  // Find organization by stripe customer ID
  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
    include: { organization: true },
  });

  if (existingSubscription) {
    // Update existing subscription
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        plan: planDetails.plan,
        status: subscription.status,
        itemLimit: planDetails.itemLimit,
        isActive: subscription.status === "active",
      },
    });
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: "canceled",
      isActive: false,
      canceledAt: new Date(),
    },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  if (subscriptionId) {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: "active",
        isActive: true,
      },
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (subscriptionId) {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: "past_due",
        isActive: false,
      },
    });
  }
}

function getPlanDetails(priceId?: string) {
  // Map Stripe price IDs to plan details
  const plans: Record<string, { plan: string; itemLimit: number }> = {
    // Replace with your actual Stripe price IDs
    "price_starter_monthly": { plan: "starter", itemLimit: 100 },
    "price_starter_annual": { plan: "starter", itemLimit: 100 },
    "price_professional_monthly": { plan: "professional", itemLimit: 500 },
    "price_professional_annual": { plan: "professional", itemLimit: 500 },
    "price_enterprise_monthly": { plan: "enterprise", itemLimit: -1 }, // unlimited
    "price_enterprise_annual": { plan: "enterprise", itemLimit: -1 }, // unlimited
  };

  return plans[priceId || ""] || { plan: "trial", itemLimit: 5 };
}