import { NextRequest, NextResponse } from "next/server";
import { requireUserPermission } from "@/lib/auth-helpers";
import { Permission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Schema for updating user role
const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "MEMBER"]),
});

interface Params {
  userId: string;
}

/**
 * PUT /api/organization/team/[userId]
 * Update a team member's role
 * Requires MANAGE_TEAM permission
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const resolvedParams = await params;
    const { userId } = resolvedParams;

    // Check permissions
    const { user, organization } = await requireUserPermission(
      Permission.MANAGE_TEAM
    );

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateUserRoleSchema.parse(body);

    // Prevent user from changing their own role
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    // Find the target user
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: organization.id,
        status: "ACTIVE",
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 }
      );
    }

    // Prevent changing the role of another OWNER (only one owner per organization)
    if (targetUser.role === "OWNER") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot change the organization owner's role",
        },
        { status: 400 }
      );
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: validatedData.role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        joinedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Role updated to ${validatedData.role}`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating team member role:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update team member role" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organization/team/[userId]
 * Remove a team member from the organization
 * Requires MANAGE_TEAM permission
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const resolvedParams = await params;
    const { userId } = resolvedParams;

    // Check permissions
    const { user, organization } = await requireUserPermission(
      Permission.MANAGE_TEAM
    );

    // Prevent user from removing themselves
    if (userId === user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot remove yourself from the organization",
        },
        { status: 400 }
      );
    }

    // Find the target user
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: organization.id,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 }
      );
    }

    // Prevent removing another OWNER
    if (targetUser.role === "OWNER") {
      return NextResponse.json(
        { success: false, error: "Cannot remove the organization owner" },
        { status: 400 }
      );
    }

    // Remove the user (this will cascade delete related data)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "Team member removed successfully",
    });
  } catch (error) {
    console.error("Error removing team member:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
