import { Polar } from "@polar-sh/sdk";

const polarServer = process.env.POLAR_SERVER === "production" ? "production" : "sandbox";

// Initialize Polar API client
const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: polarServer,
});

export interface PolarCheckoutSession {
  id: string;
  url: string;
}

export interface CreateCheckoutParams {
  productId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl?: string;
}

/**
 * Create a Polar checkout session
 */
export async function createPolarCheckout({
  productId,
  customerEmail,
  successUrl,
  cancelUrl,
}: CreateCheckoutParams): Promise<PolarCheckoutSession> {
  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      customerEmail: customerEmail,
      successUrl: successUrl,
      returnUrl: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        source: "supplr_web",
      },
    });

    return {
      id: checkout.id,
      url: checkout.url,
    };
  } catch (error) {
    console.error("Error creating Polar checkout:", error);
    throw new Error("Failed to create checkout session");
  }
}

/**
 * Get Polar product details by ID
 */
export async function getPolarProduct(productId: string) {
  try {
    const product = await polar.products.get({
      id: productId,
    });
    return product;
  } catch (error) {
    console.error("Error fetching Polar product:", error);
    throw new Error("Failed to fetch product details");
  }
}

/**
 * Get all Polar products for pricing page
 */
export async function getAllPolarProducts() {
  try {
    const response = await polar.products.list({
      organizationId: process.env.POLAR_ORGANIZATION_ID,
    });
    return response.result.items;
  } catch (error) {
    console.error("Error fetching Polar products:", error);
    return [];
  }
}

/**
 * Get customer by email
 */
export async function getPolarCustomer(email: string) {
  try {
    const response = await polar.customers.list({
      email,
      limit: 1,
    });
    return response.result.items[0] || null;
  } catch (error) {
    console.error("Error fetching Polar customer:", error);
    return null;
  }
}

/**
 * Create or get Polar customer
 */
export async function createOrGetPolarCustomer(email: string, name?: string) {
  try {
    console.log("Attempting to create/get Polar customer:", { email, name });

    // Check if we have the access token
    if (!process.env.POLAR_ACCESS_TOKEN) {
      throw new Error("POLAR_ACCESS_TOKEN environment variable is not set");
    }

    // First try to get existing customer
    const existingCustomer = await getPolarCustomer(email);
    if (existingCustomer) {
      console.log("Found existing Polar customer:", existingCustomer.id);
      return existingCustomer;
    }

    console.log("Creating new Polar customer...");

    // Create new customer
    const customer = await polar.customers.create({
      email,
      name: name || email, // Fallback to email if no name
      metadata: {
        source: "supplr_web",
      },
    });

    console.log("Successfully created Polar customer:", customer.id);
    return customer;
  } catch (error) {
    console.error("Detailed error creating Polar customer:", {
      error: error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      email,
      name,
    });

    // Pass through more specific error information
    if (error instanceof Error) {
      throw new Error(`Failed to create customer in Polar: ${error.message}`);
    } else {
      throw new Error(`Failed to create customer in Polar: ${String(error)}`);
    }
  }
}

/**
 * Polar product IDs mapping
 */
export const POLAR_PRODUCT_IDS = {
  STARTER_MONTHLY: "80233fb0-8372-4b73-b584-5e156e47c801",
  STARTER_ANNUAL: "c6b81c8b-2fb6-4ab7-ad27-dbb51525557e",
  PROFESSIONAL_MONTHLY: "421dbc95-45f5-4233-bc13-c0975d8df9c2",
  PROFESSIONAL_ANNUAL: "dcce171f-ba7d-4ebf-b76d-ee4cf91492aa",
  ENTERPRISE_MONTHLY: "97a755c6-a969-4cdc-8d89-b2bdf12ef01b",
  ENTERPRISE_ANNUAL: "332fafed-0207-4c80-837a-6f884ca7d6bb",
} as const;

/**
 * Get plan name from product ID
 */
export function getPlanFromProductId(productId: string): string {
  const planMapping: Record<string, string> = {
    [POLAR_PRODUCT_IDS.STARTER_MONTHLY]: "starter",
    [POLAR_PRODUCT_IDS.STARTER_ANNUAL]: "starter",
    [POLAR_PRODUCT_IDS.PROFESSIONAL_MONTHLY]: "professional",
    [POLAR_PRODUCT_IDS.PROFESSIONAL_ANNUAL]: "professional",
    [POLAR_PRODUCT_IDS.ENTERPRISE_MONTHLY]: "enterprise",
    [POLAR_PRODUCT_IDS.ENTERPRISE_ANNUAL]: "enterprise",
  };

  return planMapping[productId] || "trial";
}

/**
 * Get billing period from product ID
 */
export function getBillingPeriodFromProductId(productId: string): "monthly" | "annual" {
  const annualProducts = [
    POLAR_PRODUCT_IDS.STARTER_ANNUAL,
    POLAR_PRODUCT_IDS.PROFESSIONAL_ANNUAL,
    POLAR_PRODUCT_IDS.ENTERPRISE_ANNUAL,
  ];

  return annualProducts.includes(productId as any) ? "annual" : "monthly";
}

/**
 * Get product ID for a plan and billing period
 */
export function getProductIdForPlan(plan: string, period: "monthly" | "annual"): string {
  const mapping: Record<string, Record<string, string>> = {
    starter: {
      monthly: POLAR_PRODUCT_IDS.STARTER_MONTHLY,
      annual: POLAR_PRODUCT_IDS.STARTER_ANNUAL,
    },
    professional: {
      monthly: POLAR_PRODUCT_IDS.PROFESSIONAL_MONTHLY,
      annual: POLAR_PRODUCT_IDS.PROFESSIONAL_ANNUAL,
    },
    enterprise: {
      monthly: POLAR_PRODUCT_IDS.ENTERPRISE_MONTHLY,
      annual: POLAR_PRODUCT_IDS.ENTERPRISE_ANNUAL,
    },
  };

  return mapping[plan]?.[period] || POLAR_PRODUCT_IDS.STARTER_MONTHLY;
}

/**
 * Get subscription details from Polar.sh
 */
export async function getPolarSubscription(subscriptionId: string) {
  try {
    const subscription = await polar.subscriptions.get({
      id: subscriptionId,
    });
    return subscription;
  } catch (error) {
    console.error("Error fetching Polar subscription:", error);
    throw new Error("Failed to fetch subscription details");
  }
}

/**
 * Cancel a Polar.sh subscription
 */
export async function cancelPolarSubscription(subscriptionId: string) {
  try {
    const subscription = await polar.subscriptions.revoke({
      id: subscriptionId,
    });
    return subscription;
  } catch (error) {
    console.error("Error canceling Polar subscription:", error);
    throw new Error("Failed to cancel subscription");
  }
}

export type CreateCustomerPortalSessionParams =
  | {
      customerId: string;
      returnUrl?: string | null;
    }
  | {
      externalCustomerId: string;
      returnUrl?: string | null;
    };

/**
 * Create a customer portal session for subscription management
 */
export async function createCustomerPortalSession(
  params: CreateCustomerPortalSessionParams,
) {
  try {
    const idValue =
      "customerId" in params ? params.customerId : params.externalCustomerId;

    if (typeof idValue !== "string" || idValue.trim().length === 0) {
      throw new Error("Customer ID must be a non-empty string");
    }

    console.log("Creating customer portal session for customer:", idValue);

    const session = await polar.customerSessions.create(params);

    console.log("Customer portal session created successfully:", session.customerPortalUrl);
    return session;
  } catch (error) {
    console.error("Detailed error creating Polar customer portal session:", {
      error: error,
      params,
      message: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error) {
      throw new Error(`Failed to create customer portal session: ${error.message}`);
    } else {
      throw new Error(`Failed to create customer portal session: ${String(error)}`);
    }
  }
}
