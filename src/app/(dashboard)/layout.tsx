import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getUserWithRole } from "@/lib/auth-helpers";
import { hasPermission, Permission } from "@/lib/permissions";
import { getSubscriptionFeatures, isSubscriptionActive } from "@/lib/subscription-helpers";
import { LocationProvider } from "@/contexts/location-context";
import { LocationDropdown } from "@/components/location-dropdown";
import { PaymentRequired } from "@/components/subscription/subscription-guard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get user permissions for navigation
  const { error, user, organization } = await getUserWithRole();
  const canManageTeam = user && hasPermission(user.role, Permission.MANAGE_TEAM);

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
    ? getSubscriptionFeatures(organization.subscription, organizationForFeatures)
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
              <Link href="/dashboard">
                <Button variant="ghost" className="text-sm">
                  Dashboard
                </Button>
              </Link>
              <Link href="/inventory">
                <Button variant="ghost" className="text-sm">
                  Inventory
                </Button>
              </Link>
              {canManageTeam && (
                <Link href="/team">
                  <Button variant="ghost" className="text-sm">
                    Team
                  </Button>
                </Link>
              )}
              {hasMultiLocationAccess && (
                <Link href="/locations">
                  <Button variant="ghost" className="text-sm">
                    Locations
                  </Button>
                </Link>
              )}
              <Link href="/reports">
                <Button variant="ghost" className="text-sm">
                  Reports
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" className="text-sm">
                  Settings
                </Button>
              </Link>
              <Link href="/billing">
                <Button variant="ghost" className="text-sm">
                  Billing
                </Button>
              </Link>
              <Link href="/support">
                <Button variant="ghost" className="text-sm">
                  Support
                </Button>
              </Link>
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <LocationDropdown variant="compact" />
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
