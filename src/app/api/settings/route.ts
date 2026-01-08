import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateOrganizationSettingsSchema } from "@/lib/validations";

// GET /api/settings - Get organization and settings
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get the first organization (for MVP)
    const organization = await prisma.organization.findFirst({
      include: {
        settings: true,
      },
    });

    if (!organization || !organization.settings) {
      return NextResponse.json({ message: "Organization or settings not found" }, { status: 404 });
    }

    return NextResponse.json({
      organization,
      settings: organization.settings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update organization and settings
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get the first organization (for MVP)
    const organization = await prisma.organization.findFirst({
      include: {
        settings: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ message: "Organization not found" }, { status: 404 });
    }

    // Validate settings input
    const settingsData = {
      expirationWarningDays: body.expirationWarningDays,
      lowStockThreshold: body.lowStockThreshold,
      currency: body.currency,
      timezone: body.timezone,
    };

    const validationResult = updateOrganizationSettingsSchema.safeParse(settingsData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid data", errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Update organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: organization.id },
      data: {
        name: body.organizationName,
        type: body.organizationType,
      },
    });

    // Update settings
    const updatedSettings = await prisma.settings.update({
      where: { organizationId: organization.id },
      data: validationResult.data,
    });

    return NextResponse.json({
      organization: updatedOrganization,
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}