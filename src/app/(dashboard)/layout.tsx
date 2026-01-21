import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { getUserWithRole } from "@/lib/auth-helpers";
import { hasPermission, Permission } from "@/lib/permissions";
import {
  getSubscriptionFeatures,
  isSubscriptionActive,
} from "@/lib/subscription-helpers";
import { LocationProvider } from "@/contexts/location-context";
import { LocationDropdown } from "@/components/location-dropdown";
import { PaymentRequired } from "@/components/subscription/subscription-guard";
import { Notifications } from "@/components/ui/notifications";

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
    errorDetails: error
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

  return (
    <LocationProvider>
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-20 items-center justify-between px-4">
            <div className="flex items-center space-x-6">
              {/* Logo */}
              <Link
                href="/dashboard"
                className="inline-block hover:opacity-80 transition-opacity"
              >
                <img
                  src="/images/supplr123.png"
                  alt="Supplr Logo"
                  className="h-10 w-auto cursor-pointer block"
                />
              </Link>

              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-4">
                {/* Dashboard Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-sm flex items-center gap-1">
                      Dashboard
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="w-full">
                        Overview
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/inventory" className="w-full">
                        Inventory
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/reports" className="w-full">
                        Reports
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/ai" className="w-full">
                        AI Insights
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Teams Dropdown - Only show if user has team/location access */}
                {(canManageTeam || hasMultiLocationAccess) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-sm flex items-center gap-1">
                        Teams
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {canManageTeam && (
                        <DropdownMenuItem asChild>
                          <Link href="/team" className="w-full">
                            Team
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {hasMultiLocationAccess && (
                        <DropdownMenuItem asChild>
                          <Link href="/locations" className="w-full">
                            Locations
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Settings Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-sm flex items-center gap-1">
                      Settings
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="w-full">
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/billing" className="w-full">
                        Billing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/support" className="w-full">
                        Support
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <LocationDropdown variant="compact" />
              <Notifications organizationId={organization?.id} />
              <ThemeToggle />
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-muted/20">
          {!subscriptionActive && features?.plan !== "enterprise" && (
            <div className="container mx-auto p-4">
              <PaymentRequired
                message={`Your ${features?.plan || "current"} subscription payment failed. Please update your billing information to restore access.`}
                plan={features?.plan || "current"}
              />
            </div>
          )}
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t py-4">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>
              &copy; 2026 Supplr. Built for medical practices that care about
              efficiency.
            </p>
          </div>
        </footer>
      </div>
    </LocationProvider>
  );
}
