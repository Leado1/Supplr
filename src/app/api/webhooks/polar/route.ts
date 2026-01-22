import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { prisma } from "@/lib/db";

type WebhookPayload = ReturnType<typeof validateEvent>;
type WebhookCheckoutUpdatedPayload = Extract<WebhookPayload, { type: "checkout.updated" }>;
type WebhookSubscriptionActivePayload = Extract<WebhookPayload, { type: "subscription.active" }>;
type WebhookSubscriptionCanceledPayload = Extract<WebhookPayload, { type: "subscription.canceled" }>;
type WebhookSubscriptionUpdatedPayload = Extract<WebhookPayload, { type: "subscription.updated" }>;

export async function POST(request: NextRequest) {
  // Check if Polar is configured
  if (!process.env.POLAR_WEBHOOK_SECRET) {
    console.error("Polar webhook secret not configured");
    return NextResponse.json(
      { error: "Polar not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const headersList = await headers();

  try {
    // Validate webhook using Polar's SDK validator
    const webhookPayload = validateEvent(
      body,
      {
        "webhook-id": headersList.get("webhook-id") ?? "",
        "webhook-timestamp": headersList.get("webhook-timestamp") ?? "",
        "webhook-signature": headersList.get("webhook-signature") ?? "",
      },
      process.env.POLAR_WEBHOOK_SECRET
    );

    await handleWebhookEvent(webhookPayload);

    return NextResponse.json({ received: true });
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 403 });
    }
    console.error("Webhook validation failed:", err);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}

async function handleWebhookEvent(payload: WebhookPayload) {
  console.log("🔔 Polar webhook event:", payload.type);

  try {
    switch (payload.type) {
      case "checkout.updated":
        await handleCheckoutUpdated(payload);
        break;

      case "subscription.active":
        await handleSubscriptionActive(payload);
        break;

      case "subscription.updated":
        await handleSubscriptionUpdated(payload);
        break;

      case "subscription.canceled":
        await handleSubscriptionCanceled(payload);
        break;

      default:
        console.log(`Unhandled Polar webhook event: ${payload.type}`);
    }
  } catch (error) {
    console.error("❌ Error processing Polar webhook:", error);
    throw error;
  }
}

async function handleCheckoutUpdated(payload: WebhookCheckoutUpdatedPayload) {
  const checkout = payload.data;
  console.log("Checkout updated:", checkout.id);

  if (checkout.status !== "succeeded") {
    return;
  }

  const customerId = checkout.customerId;
  const productId = checkout.productId ?? checkout.product?.id ?? null;
  const customerEmail = checkout.customerEmail;

  if (!customerId || !productId) {
    console.error("Missing customer ID or product ID in checkout");
    return;
  }

  if (!customerEmail) {
    console.error("No customer email found in checkout");
    return;
  }

  const user = await prisma.user.findFirst({
    where: { email: customerEmail },
    include: { organization: true },
  });

  if (!user?.organization) {
    console.error("No organization found for customer email:", customerEmail);
    return;
  }

  const planDetails = getPlanDetailsFromProductId(productId);

  await prisma.subscription.upsert({
    where: { organizationId: user.organization.id },
    create: {
      organizationId: user.organization.id,
      polarCustomerId: customerId,
      polarProductId: productId,
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
      polarCustomerId: customerId,
      polarProductId: productId,
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

  console.log("Subscription created/updated for checkout completion");
}

async function handleSubscriptionActive(payload: WebhookSubscriptionActivePayload) {
  const subscription = payload.data;
  console.log("Subscription activated:", subscription.id);

  const customerId = subscription.customerId;
  const productId = subscription.productId;

  if (!customerId || !productId) {
    console.error("Missing customer ID or product ID in subscription");
    return;
  }

  const planDetails = getPlanDetailsFromProductId(productId);

  await prisma.subscription.updateMany({
    where: { polarCustomerId: customerId },
    data: {
      polarSubscriptionId: subscription.id,
      polarProductId: productId,
      plan: planDetails.plan,
      status: "active",
      isActive: true,
      itemLimit: planDetails.itemLimit,
      advancedAnalytics: planDetails.advancedAnalytics,
      customCategories: planDetails.customCategories,
      apiAccess: planDetails.apiAccess,
      multiLocation: planDetails.multiLocation,
      customReports: planDetails.customReports,
    },
  });

  console.log("Subscription activated successfully");
}

async function handleSubscriptionUpdated(payload: WebhookSubscriptionUpdatedPayload) {
  const subscription = payload.data;
  console.log("Subscription updated:", subscription.id);

  const customerId = subscription.customerId;
  const productId = subscription.productId;

  if (!customerId || !productId) {
    console.error("Missing customer ID or product ID in subscription update");
    return;
  }

  const planDetails = getPlanDetailsFromProductId(productId);
  const isActive = subscription.status === "active";

  await prisma.subscription.updateMany({
    where: { polarCustomerId: customerId },
    data: {
      polarSubscriptionId: subscription.id,
      polarProductId: productId,
      plan: planDetails.plan,
      status: subscription.status,
      isActive,
      itemLimit: planDetails.itemLimit,
      advancedAnalytics: planDetails.advancedAnalytics,
      customCategories: planDetails.customCategories,
      apiAccess: planDetails.apiAccess,
      multiLocation: planDetails.multiLocation,
      customReports: planDetails.customReports,
    },
  });

  console.log("Subscription updated successfully");
}

async function handleSubscriptionCanceled(payload: WebhookSubscriptionCanceledPayload) {
  const subscription = payload.data;
  console.log("Subscription canceled:", subscription.id);

  await prisma.subscription.updateMany({
    where: { polarSubscriptionId: subscription.id },
    data: {
      status: "canceled",
      isActive: false,
      canceledAt: new Date(),
    },
  });

  console.log("Subscription cancellation processed");
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
    "97a755c6-a969-4cdc-8d89-b2bdf12ef01b": { // Enterprise Monthly
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
