import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserWithRole } from "@/lib/auth-helpers";
import { hasPermission, Permission } from "@/lib/permissions";
import {
  getSubscriptionFeatures,
  isSubscriptionActive,
} from "@/lib/subscription-helpers";
import { LocationProvider } from "@/contexts/location-context";
import { PaymentRequired } from "@/components/subscription/subscription-guard";
import { DashboardShell } from "./dashboard-shell";

// Force dynamic rendering for all dashboard routes
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("🔍 Dashboard Layout: Starting auth check");

  try {
    const { userId } = await auth();
    console.log("🔍 Dashboard Layout: userId =", userId ? "found" : "not found");

    if (!userId) {
      console.log("🔍 Dashboard Layout: No userId, redirecting to sign-in");
      redirect("/sign-in");
    }
  } catch (error) {
    console.error("🔍 Dashboard Layout: Auth error:", error);
    redirect("/sign-in");
  }

  // Get user permissions for navigation
  console.log("🔍 Dashboard Layout: Getting user role");
  const { error, user, organization } = await getUserWithRole();
  console.log("🔍 Dashboard Layout: User role result:", {
    hasError: !!error,
    hasUser: !!user,
    hasOrg: !!organization,
    userEmail: user?.email,
    organizationId: organization?.id,
    errorDetails: error,
    userRole: user?.role,
    isDemoFallback: user?.email === "demo@supplr.net"
  });

  const canManageTeam =
    user && hasPermission(user.role, Permission.MANAGE_TEAM);

  // Check subscription status and features
  const subscriptionActive = organization?.subscription
    ? isSubscriptionActive(organization.subscription)
    : false;

  // For demo user override, check if current user is demo
  const isDemoUser = user?.email === "demo@supplr.net";
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
  const allowedAssistantPlans = new Set(["starter", "professional", "enterprise", "pro"]);
  const hasAssistantAccess =
    !!organization?.subscription &&
    subscriptionActive &&
    !!features?.plan &&
    allowedAssistantPlans.has(features.plan.toLowerCase());

  return (
    <LocationProvider>
      <DashboardShell
        canManageTeam={!!canManageTeam}
        hasMultiLocationAccess={!!hasMultiLocationAccess}
        hasAssistantAccess={hasAssistantAccess}
        organizationId={organization?.id}
      >
        {!subscriptionActive && features?.plan !== "enterprise" && (
          <div className="mb-4">
            <PaymentRequired
              message={`Your ${features?.plan || "current"} subscription payment failed. Please update your billing information to restore access.`}
              plan={features?.plan || "current"}
            />
          </div>
        )}
        {children}
      </DashboardShell>
    </LocationProvider>
  );
}
