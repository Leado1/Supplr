import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

interface Params {
  token: string;
}

/**
 * POST /api/invitations/[token]/accept
 * Accept a team invitation using the token
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const resolvedParams = await params;
    const { token } = resolvedParams;

    // Get the current authenticated user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "You must be logged in to accept invitations" },
        { status: 401 }
      );
    }

    // Find the invitation
    const invitation = await prisma.userInvitation.findUnique({
      where: { token },
      include: {
        organization: { select: { id: true, name: true } },
        inviter: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "This invitation has expired" },
        { status: 400 }
      );
    }

    // Check if invitation was already accepted
    if (invitation.acceptedAt) {
      return NextResponse.json(
        { success: false, error: "This invitation has already been accepted" },
        { status: 400 }
      );
    }

    // Get current user info from Clerk
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    // Verify the email matches the invitation
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    if (userEmail !== invitation.email) {
      return NextResponse.json(
        { success: false, error: "This invitation is not for your email address" },
        { status: 400 }
      );
    }

    // Check if user already exists in this organization
    const existingUser = await prisma.user.findFirst({
      where: {
        clerkId: userId,
        organizationId: invitation.organizationId,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "You are already a member of this organization" },
        { status: 400 }
      );
    }

    // Check if user already belongs to another organization
    // For now, we only support single-organization membership
    const userWithOrganization = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (userWithOrganization) {
      return NextResponse.json(
        {
          success: false,
          error: "You already belong to an organization. Multiple organization membership is not currently supported."
        },
        { status: 400 }
      );
    }

    // Create the user in the organization
    const newUser = await prisma.user.create({
      data: {
        clerkId: userId,
        email: invitation.email,
        firstName: clerkUser.firstName || undefined,
        lastName: clerkUser.lastName || undefined,
        organizationId: invitation.organizationId,
        role: invitation.role,
        status: "ACTIVE",
        invitedBy: invitation.invitedBy,
        joinedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        joinedAt: true,
      },
    });

    // Mark invitation as accepted
    await prisma.userInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: `Welcome to ${invitation.organization.name}!`,
      data: {
        user: newUser,
        organization: invitation.organization,
      },
    });

  } catch (error) {
    console.error("Error accepting invitation:", error);

    return NextResponse.json(
      { success: false, error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}