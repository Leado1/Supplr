import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateOrganizationSettingsSchema } from "@/lib/validations";
import { getUserOrganization } from "@/lib/auth-helpers";

// GET /api/settings - Get organization and settings
export async function GET() {
  try {
    // Get user's organization with security checks
    const { error: orgError, organization } = await getUserOrganization();
    if (orgError) return orgError;

    if (!organization!.settings) {
      return NextResponse.json(
        { message: "Settings not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organization,
      settings: organization!.settings,
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
    // Get user's organization with security checks
    const { error: orgError, organization } = await getUserOrganization();
    if (orgError) return orgError;

    const body = await request.json();

    // Validate settings input
    const settingsData = {
      expirationWarningDays: body.expirationWarningDays,
      lowStockThreshold: body.lowStockThreshold,
      currency: body.currency,
      timezone: body.timezone,
    };

    const validationResult =
      updateOrganizationSettingsSchema.safeParse(settingsData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid data", errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Update organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: organization!.id },
      data: {
        name: body.organizationName,
        type: body.organizationType,
      },
    });

    // Update settings
    const updatedSettings = await prisma.settings.update({
      where: { organizationId: organization!.id },
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
