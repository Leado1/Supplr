import { NextRequest, NextResponse } from "next/server";
import { getUserOrganization } from "@/lib/auth-helpers";
import { getSubscriptionFeatures } from "@/lib/subscription-helpers";
import { hasPermission, Permission } from "@/lib/permissions";
import { DataProcessor } from "@/lib/ai/data-processor";

export async function GET(request: NextRequest) {
  try {
    const { error, organization, user } = await getUserOrganization();

    if (error || !organization || !user) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    if (!hasPermission(user.role, Permission.VIEW_INVENTORY)) {
      return NextResponse.json(
        { error: "Insufficient permissions to view usage trends" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const itemId = searchParams.get("itemId");
    const locationId = searchParams.get("locationId") || undefined;
    const daysParam = searchParams.get("days");

    if (!itemId) {
      return NextResponse.json(
        { error: "Missing required query parameter: itemId" },
        { status: 400 }
      );
    }

    const parsedDays = daysParam ? Number(daysParam) : 30;
    if (Number.isNaN(parsedDays) || parsedDays <= 0) {
      return NextResponse.json(
        { error: "Invalid days parameter" },
        { status: 400 }
      );
    }

    const days = Math.min(180, Math.max(7, Math.round(parsedDays)));

    const features = getSubscriptionFeatures(
      organization.subscription,
      organization
    );

    const scopedLocationId =
      locationId && features.multiLocation ? locationId : undefined;

    const trends = await DataProcessor.generateUsageTrends(
      organization.id,
      days,
      itemId,
      scopedLocationId
    );

    return NextResponse.json({ trends });
  } catch (error) {
    console.error("Error generating usage trends:", error);
    return NextResponse.json(
      { error: "Failed to generate usage trends" },
      { status: 500 }
    );
  }
}
