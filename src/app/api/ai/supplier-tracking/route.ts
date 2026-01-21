import { NextRequest, NextResponse } from "next/server";
import { getUserOrganization } from "@/lib/auth-helpers";
import { SupplierIntegration } from "@/lib/ai/supplier-integration";

/**
 * Track supplier interactions for analytics and commission tracking
 */
export async function POST(request: NextRequest) {
  try {
    const { error, organization, user } = await getUserOrganization();

    if (error || !organization || !user) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { itemId, supplierId, action, estimatedValue, metadata } = body;

    // Validate required fields
    if (!itemId || !supplierId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: itemId, supplierId, action" },
        { status: 400 }
      );
    }

    // Track the action
    await SupplierIntegration.trackOrderingAction(
      organization.id,
      itemId,
      supplierId,
      action,
      estimatedValue
    );

    // Get analytics for response (useful for A/B testing)
    const analytics = await SupplierIntegration.getSupplierAnalytics(organization.id);

    return NextResponse.json({
      message: "Action tracked successfully",
      analytics: {
        totalOrdersTracked: analytics.totalOrdersTracked,
        conversionRate: analytics.conversionRate,
      },
    });

  } catch (error) {
    console.error("Error tracking supplier action:", error);
    return NextResponse.json(
      { error: "Failed to track supplier action" },
      { status: 500 }
    );
  }
}

/**
 * Get supplier analytics and preferences for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const { error, organization, user } = await getUserOrganization();

    if (error || !organization || !user) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const analytics = await SupplierIntegration.getSupplierAnalytics(organization.id);

    return NextResponse.json({
      analytics,
      message: "Supplier analytics retrieved successfully",
    });

  } catch (error) {
    console.error("Error getting supplier analytics:", error);
    return NextResponse.json(
      { error: "Failed to get supplier analytics" },
      { status: 500 }
    );
  }
}