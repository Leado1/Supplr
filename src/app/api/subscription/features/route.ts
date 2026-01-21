import { NextRequest, NextResponse } from "next/server";
import { getUserOrganization } from "@/lib/auth-helpers";
import { getSubscriptionFeatures } from "@/lib/subscription-helpers";

export async function GET(request: NextRequest) {
  try {
    // Get user's organization with subscription
    const { error, organization } = await getUserOrganization();

    if (error || !organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get subscription features with organization context for demo override
    const features = getSubscriptionFeatures(
      organization.subscription,
      organization
    );

    return NextResponse.json({
      features,
      plan: organization.subscription?.plan || "trial",
      status: organization.subscription?.status || "trialing",
    });
  } catch (error) {
    console.error("Error fetching subscription features:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription features" },
      { status: 500 }
    );
  }
}
