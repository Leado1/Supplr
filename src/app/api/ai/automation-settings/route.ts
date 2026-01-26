import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserOrganization } from "@/lib/auth-helpers";
import { hasPermission, Permission } from "@/lib/permissions";

export async function GET() {
  try {
    const { error, organization } = await getUserOrganization();

    if (error || !organization) {
      return error ?? NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (!organization.settings) {
      return NextResponse.json(
        { error: "Settings not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      settings: {
        aiAutoDraftEnabled: organization.settings.aiAutoDraftEnabled ?? false,
        aiRequireApproval: organization.settings.aiRequireApproval ?? false,
      },
    });
  } catch (error) {
    console.error("Error fetching AI automation settings:", error);
    return NextResponse.json(
      { error: "Failed to load automation settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, organization, user } = await getUserOrganization();

    if (error || !organization) {
      return error ?? NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (!user || !hasPermission(user.role, Permission.MANAGE_SETTINGS)) {
      return NextResponse.json(
        { error: "Insufficient permissions to update automation settings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: {
      aiAutoDraftEnabled?: boolean;
      aiRequireApproval?: boolean;
    } = {};

    if (typeof body.aiAutoDraftEnabled === "boolean") {
      updates.aiAutoDraftEnabled = body.aiAutoDraftEnabled;
    }
    if (typeof body.aiRequireApproval === "boolean") {
      updates.aiRequireApproval = body.aiRequireApproval;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No automation settings provided" },
        { status: 400 }
      );
    }

    const updatedSettings = await prisma.settings.update({
      where: { organizationId: organization.id },
      data: updates,
    });

    return NextResponse.json({
      settings: {
        aiAutoDraftEnabled: updatedSettings.aiAutoDraftEnabled ?? false,
        aiRequireApproval: updatedSettings.aiRequireApproval ?? false,
      },
    });
  } catch (error) {
    console.error("Error updating AI automation settings:", error);
    return NextResponse.json(
      { error: "Failed to update automation settings" },
      { status: 500 }
    );
  }
}
