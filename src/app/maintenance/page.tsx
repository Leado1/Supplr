import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { RefreshButton } from "./refresh-button";
import { Clock, Mail, RefreshCw, Twitter, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Maintenance - Supplr",
  description:
    "Supplr is currently undergoing scheduled maintenance. We'll be back soon.",
};

export default async function MaintenancePage() {
  const { userId, sessionClaims } = await auth();
  const isSignedIn = Boolean(userId);

  const normalizeIdentifier = (value: string) => value.trim().toLowerCase();

  const maintenanceBypassIdentifiers = new Set(
    (process.env.MAINTENANCE_BYPASS_USER_IDS ?? "")
      .split(",")
      .map(normalizeIdentifier)
      .filter(Boolean)
  );

  const claims = (sessionClaims ?? {}) as Record<string, unknown>;
  const claimIdentifiers: string[] = [];

  if (userId) {
    claimIdentifiers.push(userId);
  }

  const username = claims.username;
  if (typeof username === "string") {
    claimIdentifiers.push(username);
  }

  const email = claims.email;
  if (typeof email === "string") {
    claimIdentifiers.push(email);
  }

  const emailAddress = claims.email_address;
  if (typeof emailAddress === "string") {
    claimIdentifiers.push(emailAddress);
  }

  const emailAddresses = claims.email_addresses;
  if (Array.isArray(emailAddresses)) {
    for (const entry of emailAddresses) {
      if (typeof entry === "string") {
        claimIdentifiers.push(entry);
      }
    }
  }

  const hasMaintenanceBypass = claimIdentifiers
    .map(normalizeIdentifier)
    .some((identifier) => maintenanceBypassIdentifiers.has(identifier));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/maintenance" className="flex items-center">
            <img
              src="/images/LOGOB.png"
              alt="Supplr"
              className="h-8 w-auto sm:h-9 dark:hidden"
            />
            <img
              src="/images/LOGOW.png"
              alt="Supplr"
              className="hidden h-8 w-auto sm:h-9 dark:block"
            />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="mx-auto max-w-2xl space-y-8 text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <Wrench className="h-12 w-12 text-primary" />
              </div>
              <div className="absolute -right-2 -top-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <RefreshCw className="h-4 w-4 animate-spin text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              We will be back soon
            </h1>
            <p className="mx-auto max-w-xl text-xl leading-relaxed text-muted-foreground">
              We are currently performing scheduled maintenance to improve your
              experience.
            </p>
          </div>

          <Card className="mx-auto max-w-md">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold">Estimated Duration</p>
                    <p className="text-sm text-muted-foreground">TBA</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Status</p>
                    <p className="text-sm text-muted-foreground">
                      System updates in progress
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">What we are working on</h2>
            <div className="mx-auto grid max-w-lg gap-3 text-left">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm">Performance improvements</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm">Security updates</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm">New inventory features</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              {isSignedIn && hasMaintenanceBypass ? (
                <Link href="/dashboard">
                  <Button>Open Supplr</Button>
                </Link>
              ) : !isSignedIn ? (
                <Link href="/sign-in">
                  <Button>Owner Login</Button>
                </Link>
              ) : (
                <Button disabled>Access Restricted</Button>
              )}
              <RefreshButton />
              <a href="mailto:support@supplr.net">
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              {isSignedIn && hasMaintenanceBypass
                ? "You are signed in. Use Open Supplr to access the app during maintenance."
                : isSignedIn
                  ? "You are signed in, but this account is not listed in MAINTENANCE_BYPASS_USER_IDS."
                  : "Sign in from this page to access Supplr while maintenance mode is enabled."}
            </p>
          </div>

          <div className="border-t border-border pt-8">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Need immediate assistance?
              </p>
              <div className="flex flex-col items-center justify-center gap-4 text-sm sm:flex-row">
                <a
                  href="mailto:support@supplr.net"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  support@supplr.net
                </a>
                <span className="hidden text-muted-foreground sm:inline">
                  |
                </span>
                <a
                  href="#"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Twitter className="h-4 w-4" />
                  @SupplrUpdates
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            setTimeout(() => {
              window.location.reload();
            }, 300000);
          `,
        }}
      />
    </div>
  );
}
