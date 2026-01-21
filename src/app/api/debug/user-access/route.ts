import { NextResponse } from "next/server";
import { getUserWithRole } from "@/lib/auth-helpers";
import { getSubscriptionFeatures } from "@/lib/subscription-helpers";
import { hasPermission, Permission } from "@/lib/permissions";

export async function GET() {
  try {
    // Get user permissions for navigation
    const { error, user, organization } = await getUserWithRole();

    if (error || !user || !organization) {
      return NextResponse.json({
        error: "User or organization not found",
        details: { error: !!error, user: !!user, organization: !!organization },
      });
    }

    const canManageTeam =
      user && hasPermission(user.role, Permission.MANAGE_TEAM);

    // Check if user has multi-location access
    const isDemoUser = user.email === "demo@supplr.net";
    const organizationForFeatures = isDemoUser
      ? { users: [{ email: "demo@supplr.net" }] }
      : undefined;

    const features = organization?.subscription
      ? getSubscriptionFeatures(
          organization.subscription,
          organizationForFeatures
        )
      : null;
    const hasMultiLocationAccess = features?.multiLocation && canManageTeam;

    return NextResponse.json({
      user: {
        email: user.email,
        role: user.role,
        status: user.status,
      },
      organization: {
        name: organization.name,
        type: organization.type,
      },
      subscription: {
        plan: organization.subscription?.plan,
        status: organization.subscription?.status,
        multiLocation: organization.subscription?.multiLocation,
      },
      permissions: {
        canManageTeam,
        hasMultiLocationAccess,
      },
      features,
      debug: {
        userExists: !!user,
        orgExists: !!organization,
        subscriptionExists: !!organization.subscription,
        featuresFromSub: features,
        calculation: {
          multiLocationFeature: features?.multiLocation,
          canManageTeamPermission: canManageTeam,
          finalAccess: hasMultiLocationAccess,
        },
      },
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({
      error: "Debug failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
