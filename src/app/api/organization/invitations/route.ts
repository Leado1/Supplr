import { NextRequest, NextResponse } from "next/server";
import { requireUserPermission } from "@/lib/auth-helpers";
import { Permission } from "@/lib/permissions";
import { prisma } from "@/lib/db";

/**
 * GET /api/organization/invitations
 * Get all pending invitations for the organization
 * Requires MANAGE_TEAM permission
 */
export async function GET() {
  try {
    const { user, organization } = await requireUserPermission(Permission.MANAGE_TEAM);

    const pendingInvitations = await prisma.userInvitation.findMany({
      where: {
        organizationId: organization.id,
        acceptedAt: null, // Only pending invitations
        expiresAt: { gt: new Date() }, // Not expired
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
        inviter: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: pendingInvitations,
    });

  } catch (error) {
    console.error("Error fetching pending invitations:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organization/invitations/[invitationId]
 * Cancel a pending invitation
 * Requires MANAGE_TEAM permission
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user, organization } = await requireUserPermission(Permission.MANAGE_TEAM);

    const url = new URL(request.url);
    const invitationId = url.pathname.split('/').pop();

    if (!invitationId) {
      return NextResponse.json(
        { success: false, error: "Invitation ID is required" },
        { status: 400 }
      );
    }

    // Find and verify the invitation belongs to this organization
    const invitation = await prisma.userInvitation.findFirst({
      where: {
        id: invitationId,
        organizationId: organization.id,
        acceptedAt: null, // Can only cancel pending invitations
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invitation not found or already accepted" },
        { status: 404 }
      );
    }

    // Delete the invitation
    await prisma.userInvitation.delete({
      where: { id: invitationId },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation cancelled successfully",
    });

  } catch (error) {
    console.error("Error cancelling invitation:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to cancel invitation" },
      { status: 500 }
    );
  }
}