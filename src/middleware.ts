import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const maintenanceModeValue = (process.env.MAINTENANCE_MODE ?? "").toLowerCase();
const isMaintenanceModeEnabled =
  maintenanceModeValue === "true" || maintenanceModeValue === "1";

const normalizeIdentifier = (value: string) => value.trim().toLowerCase();

const maintenanceBypassIdentifiers = new Set(
  (process.env.MAINTENANCE_BYPASS_USER_IDS ?? "")
    .split(",")
    .map(normalizeIdentifier)
    .filter(Boolean)
);

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/_clerk(.*)",
  "/maintenance",
  "/use-cases",
  "/pricing",
  "/blog",
  "/privacy",
  "/support",
  "/resources",
  "/api/webhooks(.*)",
  "/api/support",
]);

// During maintenance, only these routes remain reachable without an active bypass.
const isMaintenanceAccessRoute = createRouteMatcher([
  "/maintenance",
  "/sign-in(.*)",
  "/_clerk(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth();

  if (isMaintenanceModeEnabled) {
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

    if (!hasMaintenanceBypass && !isMaintenanceAccessRoute(request)) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }

    if (hasMaintenanceBypass && request.nextUrl.pathname === "/maintenance") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
