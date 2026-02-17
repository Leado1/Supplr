import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const maintenanceModeValue = (process.env.MAINTENANCE_MODE ?? "").toLowerCase();
const isMaintenanceModeEnabled =
  maintenanceModeValue === "true" || maintenanceModeValue === "1";

const maintenanceBypassUserIds = new Set(
  (process.env.MAINTENANCE_BYPASS_USER_IDS ?? "")
    .split(",")
    .map((userId) => userId.trim())
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
  const { userId } = await auth();

  if (isMaintenanceModeEnabled) {
    const hasMaintenanceBypass =
      !!userId && maintenanceBypassUserIds.has(userId);

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
