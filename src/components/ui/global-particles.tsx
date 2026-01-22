"use client";

import { usePathname } from "next/navigation";
import { Particles } from "@/components/ui/particles";

const DASHBOARD_PREFIXES = [
  "/ai",
  "/billing",
  "/css-test",
  "/dashboard",
  "/import",
  "/inventory",
  "/loading-demo",
  "/locations",
  "/reports",
  "/settings",
  "/slow-page",
  "/team",
];

const isDashboardRoute = (pathname: string) => {
  if (pathname.startsWith("/billing/success")) {
    return false;
  }

  return DASHBOARD_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
};

export function GlobalParticles() {
  const pathname = usePathname();

  if (pathname === "/" || isDashboardRoute(pathname)) {
    return null;
  }

  return (
    <Particles
      className="fixed inset-0 -z-10"
      quantity={50}
      ease={80}
      staticity={50}
      color="#6366f1"
      size={0.8}
    />
  );
}
