import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    // Get current Clerk user ID
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "No current user session found" },
        { status: 401 }
      );
    }

    console.log("Current Clerk User ID:", userId);

    // Check if demo user exists
    const demoUser = await prisma.user.findFirst({
      where: {
        email: "demo@supplr.net"
      }
    });

    if (!demoUser) {
      return NextResponse.json(
        { error: "Demo user not found in database" },
        { status: 404 }
      );
    }

    // Update demo user with current Clerk ID
    const updatedUser = await prisma.user.update({
      where: {
        email: "demo@supplr.net"
      },
      data: {
        clerkId: userId
      },
      include: {
        organization: {
          include: {
            subscription: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Demo user synced successfully",
      user: {
        email: updatedUser.email,
        clerkId: updatedUser.clerkId,
        role: updatedUser.role,
        organization: updatedUser.organization.name,
        plan: updatedUser.organization.subscription?.plan
      }
    });

  } catch (error) {
    console.error("Error syncing demo user:", error);
    return NextResponse.json(
      { error: "Failed to sync demo user" },
      { status: 500 }
    );
  }
}