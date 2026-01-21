import { NextRequest, NextResponse } from "next/server";
import { getUserOrganization } from "@/lib/auth-helpers";
import {
  getSubscriptionFeatures,
  isSubscriptionActive,
} from "@/lib/subscription-helpers";
import { prisma } from "@/lib/db";

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

    // Check subscription status first
    if (!isSubscriptionActive(organization.subscription)) {
      return NextResponse.json(
        { error: "Active subscription required for multi-location access" },
        { status: 402 } // Payment Required
      );
    }

    // Check if user has multi-location access
    const features = getSubscriptionFeatures(
      organization.subscription,
      organization
    );

    if (!features.multiLocation) {
      return NextResponse.json(
        { error: "Multi-location access requires Enterprise subscription" },
        { status: 403 }
      );
    }

    // Fetch locations for this organization
    const locations = await prisma.location.findMany({
      where: {
        organizationId: organization.id,
      },
      orderBy: [
        { isActive: "desc" }, // Active locations first
        { name: "asc" },
      ],
    });

    return NextResponse.json({
      locations,
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user's organization with subscription
    const { error, organization, user } = await getUserOrganization();

    if (error || !organization || !user) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check subscription status first
    if (!isSubscriptionActive(organization.subscription)) {
      return NextResponse.json(
        { error: "Active subscription required for multi-location access" },
        { status: 402 } // Payment Required
      );
    }

    // Check if user has multi-location access
    const features = getSubscriptionFeatures(
      organization.subscription,
      organization
    );

    if (!features.multiLocation) {
      return NextResponse.json(
        { error: "Multi-location access requires Enterprise subscription" },
        { status: 403 }
      );
    }

    // Check if user has permission to create locations (OWNER or ADMIN)
    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions to create locations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, address, phone, email, timezone, currency } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Location name is required" },
        { status: 400 }
      );
    }

    // Check if location name already exists for this organization
    const existingLocation = await prisma.location.findFirst({
      where: {
        organizationId: organization.id,
        name: name.trim(),
      },
    });

    if (existingLocation) {
      return NextResponse.json(
        { error: "Location name already exists" },
        { status: 409 }
      );
    }

    // Create new location
    const location = await prisma.location.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        timezone: timezone || "UTC",
        currency: currency || "USD",
        organizationId: organization.id,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        location,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
