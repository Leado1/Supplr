import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

type UserDisplayFields = {
  firstName: string | null;
  lastName: string | null;
  email: string;
};

function getUserDisplayName(user: UserDisplayFields) {
  return user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`.trim()
    : user.firstName || user.lastName || user.email;
}

/**
 * Sync current Clerk user to database
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get full user data from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { error: "User not found in Clerk" },
        { status: 404 }
      );
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name = clerkUser.firstName && clerkUser.lastName
      ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
      : clerkUser.firstName || clerkUser.lastName || email || 'User';

    if (!email) {
      return NextResponse.json(
        { error: "No email found for user" },
        { status: 400 }
      );
    }

    // Check if user already exists in database (by clerkId or email)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { clerkId: userId },
          { email: email }
        ]
      },
      include: { organization: true },
    });

    if (user) {
      // If user exists but has wrong clerkId, update it
      if (user.clerkId !== userId) {
        console.log("Updating user clerkId:", { oldClerkId: user.clerkId, newClerkId: userId });
        user = await prisma.user.update({
          where: { id: user.id },
          data: { clerkId: userId },
          include: { organization: true },
        });
      }

      return NextResponse.json({
        message: "User already exists in database",
        user: {
          id: user.id,
          email: user.email,
          name: getUserDisplayName(user),
          clerkId: user.clerkId,
          organizationId: user.organizationId,
        }
      });
    }

    console.log("Creating organization and user:", {
      clerkId: userId,
      email,
      name,
    });

    // Create organization first (without owner initially)
    const organization = await prisma.organization.create({
      data: {
        name: `${name}'s Organization`,
        // ownerId will be set after creating the user
      },
    });

    // Create user with organizationId
    try {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: email,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          organizationId: organization.id,
          role: "OWNER", // Set as organization owner
        },
        include: { organization: true },
      });
    } catch (createError: any) {
      console.error("Error creating user:", createError);

      // If it's a unique constraint error, try to find the existing user
      if (createError.code === 'P2002') {
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { clerkId: userId },
              { email: email }
            ]
          },
          include: { organization: true },
        });

        if (existingUser) {
          return NextResponse.json({
            message: "User already exists in database",
            user: {
              id: existingUser.id,
              email: existingUser.email,
              clerkId: existingUser.clerkId,
              organizationId: existingUser.organizationId,
            }
          });
        }
      }

      throw createError; // Re-throw if it's not a uniqueness issue
    }

    return NextResponse.json({
      success: true,
      message: "User and organization created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: getUserDisplayName(user),
        clerkId: user.clerkId,
        organizationId: user.organizationId,
      },
      organization: {
        id: organization.id,
        name: organization.name,
      }
    });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json(
      {
        error: "Failed to sync user",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
