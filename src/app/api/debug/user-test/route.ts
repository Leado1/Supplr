import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({
        error: "No authenticated user",
        authenticated: false
      });
    }

    // Check if user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        organization: true
      }
    });

    // Get total user count
    const totalUsers = await prisma.user.count();

    // Get demo user status
    const demoUser = await prisma.user.findFirst({
      where: { email: "demo@supplr.net" }
    });

    return NextResponse.json({
      clerkUserId: userId,
      userExistsInDB: !!dbUser,
      userDetails: dbUser ? {
        id: dbUser.id,
        email: dbUser.email,
        organizationId: dbUser.organizationId,
        hasOrganization: !!dbUser.organization
      } : null,
      totalUsersInDB: totalUsers,
      demoUserExists: !!demoUser,
      demoUserDetails: demoUser ? {
        id: demoUser.id,
        email: demoUser.email,
        organizationId: demoUser.organizationId
      } : null
    });

  } catch (error) {
    console.error("Debug user test error:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}