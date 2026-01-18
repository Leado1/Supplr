import { NextRequest, NextResponse } from "next/server";
import { requireUserPermission, getTeamMembers } from "@/lib/auth-helpers";
import { Permission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Schema for inviting new team member
const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER"]),
});

/**
 * GET /api/organization/team
 * Get all team members for the current organization
 * Requires MANAGE_TEAM permission
 */
export async function GET() {
  try {
    const teamMembers = await getTeamMembers();

    return NextResponse.json({
      success: true,
      data: teamMembers,
    });
  } catch (error) {
    console.error("Error fetching team members:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }
}

/**
 * POST /api/organization/team/invite
 * Send invitation to join the organization
 * Requires INVITE_USERS permission
 */
export async function POST(request: NextRequest) {
  try {
    // Check permissions
    const { user, organization } = await requireUserPermission(Permission.INVITE_USERS);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = inviteUserSchema.parse(body);

    // Check if user is already in the organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        organizationId: organization.id,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User is already a member of this organization" },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.userInvitation.findUnique({
      where: {
        email_organizationId: {
          email: validatedData.email,
          organizationId: organization.id,
        },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { success: false, error: "Invitation already sent to this email" },
        { status: 400 }
      );
    }

    // Generate secure invitation token
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Create invitation record
    const invitation = await prisma.userInvitation.create({
      data: {
        email: validatedData.email,
        organizationId: organization.id,
        role: validatedData.role,
        invitedBy: user.id,
        token: invitationToken,
        expiresAt,
      },
      include: {
        organization: { select: { name: true } },
        inviter: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    // TODO: Send invitation email here
    // For now, we'll return the invitation token for testing

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${validatedData.email}`,
      data: {
        invitationId: invitation.id,
        token: invitationToken, // Remove this in production
        expiresAt: invitation.expiresAt,
      },
    });

  } catch (error) {
    console.error("Error creating team invitation:", error);

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
      { success: false, error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}