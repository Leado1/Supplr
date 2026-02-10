import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { hasPermission, Permission } from "@/lib/permissions";

export async function GET() {
  try {
    const debugEnabled =
      process.env.NODE_ENV !== "production" ||
      process.env.ALLOW_DEBUG_SUBSCRIPTION === "true";

    if (!debugEnabled) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find user and organization
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        organization: {
          include: {
            subscription: true
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json({
        debug: {
          userId,
          userFound: false,
          userEmail: null,
          organizationId: null,
          organization: null,
          subscription: null,
          issue: "User not found in database with this Clerk ID"
        }
      });
    }

    if (!hasPermission(user.role, Permission.MANAGE_BILLING)) {
      return NextResponse.json(
        { error: "Insufficient permissions to view billing debug data" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      debug: {
        userId,
        userFound: true,
        userEmail: user.email,
        userDatabaseId: user.id,
        organizationId: user.organizationId,
        organization: user.organization ? {
          id: user.organization.id,
          name: user.organization.name,
        } : null,
        subscription: user.organization?.subscription ? {
          id: user.organization.subscription.id,
          plan: user.organization.subscription.plan,
          status: user.organization.subscription.status,
          isActive: user.organization.subscription.isActive,
          polarCustomerId: user.organization.subscription.polarCustomerId,
          polarSubscriptionId: user.organization.subscription.polarSubscriptionId,
          polarProductId: user.organization.subscription.polarProductId,
          itemLimit: user.organization.subscription.itemLimit,
          advancedAnalytics: user.organization.subscription.advancedAnalytics,
          customCategories: user.organization.subscription.customCategories,
        } : null,
        issue: !user.organization ? "User exists but has no organization linked" :
               !user.organization.subscription ? "Organization exists but has no subscription" : null
      }
    });
  } catch (error) {
    console.error("Error debugging subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to debug subscription",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
