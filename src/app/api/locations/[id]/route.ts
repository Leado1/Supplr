import { NextRequest, NextResponse } from "next/server";
import { getUserOrganization } from "@/lib/auth-helpers";
import { getSubscriptionFeatures } from "@/lib/subscription-helpers";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Get user's organization with subscription
    const { error, organization } = await getUserOrganization();

    if (error || !organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if user has multi-location access
    const features = getSubscriptionFeatures(organization.subscription, organization);

    if (!features.multiLocation) {
      return NextResponse.json(
        { error: "Multi-location access requires Enterprise subscription" },
        { status: 403 }
      );
    }

    // Fetch specific location
    const location = await prisma.location.findFirst({
      where: {
        id: id,
        organizationId: organization.id,
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      location,
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    return NextResponse.json(
      { error: "Failed to fetch location" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Get user's organization with subscription
    const { error, organization, user } = await getUserOrganization();

    if (error || !organization || !user) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if user has multi-location access
    const features = getSubscriptionFeatures(organization.subscription, organization);

    if (!features.multiLocation) {
      return NextResponse.json(
        { error: "Multi-location access requires Enterprise subscription" },
        { status: 403 }
      );
    }

    // Check if user has permission to update locations (OWNER or ADMIN)
    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions to update locations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, address, phone, email, timezone, currency, isActive } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Location name is required" },
        { status: 400 }
      );
    }

    // Check if location exists and belongs to this organization
    const existingLocation = await prisma.location.findFirst({
      where: {
        id: id,
        organizationId: organization.id,
      },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Check if new name conflicts with another location
    if (name.trim() !== existingLocation.name) {
      const nameConflict = await prisma.location.findFirst({
        where: {
          organizationId: organization.id,
          name: name.trim(),
          id: { not: id },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "Location name already exists" },
          { status: 409 }
        );
      }
    }

    // Update location
    const updatedLocation = await prisma.location.update({
      where: { id: id },
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        timezone: timezone || existingLocation.timezone,
        currency: currency || existingLocation.currency,
        isActive: isActive !== undefined ? isActive : existingLocation.isActive,
      },
    });

    return NextResponse.json({
      location: updatedLocation,
    });
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Get user's organization with subscription
    const { error, organization, user } = await getUserOrganization();

    if (error || !organization || !user) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if user has multi-location access
    const features = getSubscriptionFeatures(organization.subscription, organization);

    if (!features.multiLocation) {
      return NextResponse.json(
        { error: "Multi-location access requires Enterprise subscription" },
        { status: 403 }
      );
    }

    // Check if user has permission to delete locations (OWNER only)
    if (user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only organization owners can delete locations" },
        { status: 403 }
      );
    }

    // Check if location exists and belongs to this organization
    const location = await prisma.location.findFirst({
      where: {
        id: id,
        organizationId: organization.id,
      },
      include: {
        items: true,
        categories: true,
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Check if location has any inventory items
    if (location.items.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete location. It contains ${location.items.length} inventory items. Please move or delete all items first.`,
        },
        { status: 409 }
      );
    }

    // Check if this is the only location
    const locationCount = await prisma.location.count({
      where: {
        organizationId: organization.id,
      },
    });

    if (locationCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the only location. Organizations must have at least one location." },
        { status: 409 }
      );
    }

    // Delete location (categories will be cascade deleted)
    await prisma.location.delete({
      where: { id: id },
    });

    return NextResponse.json({
      message: "Location deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 }
    );
  }
}