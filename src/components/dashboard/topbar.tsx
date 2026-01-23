"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Menu } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Notifications } from "@/components/ui/notifications";
import { LocationDropdown } from "@/components/location-dropdown";
import { useSidebar } from "./sidebar";

// ============================================================================
// TYPES
// ============================================================================

export interface TopbarProps {
  /** Organization ID for notifications */
  organizationId?: string;
  /** Show search input */
  showSearch?: boolean;
  /** Custom className */
  className?: string;
}

// ============================================================================
// PAGE TITLE HELPERS
// ============================================================================

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  inventory: "Inventory",
  reports: "Reports",
  ai: "AI Insights",
  team: "Team",
  locations: "Locations",
  settings: "Settings",
  billing: "Billing",
  support: "Support",
};

function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Dashboard";

  const firstSegment = segments[0];
  return routeLabels[firstSegment] || firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
}

// ============================================================================
// PAGE TITLE COMPONENT
// ============================================================================

function PageTitle() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <h1 className="text-xl font-bold text-foreground">{title}</h1>
  );
}

// ============================================================================
// SEARCH COMPONENT
// ============================================================================

function TopbarSearch() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative hidden md:block">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search..."
        className="w-64 pl-9 h-9"
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      />
    </div>
  );
}

// ============================================================================
// MOBILE MENU TRIGGER
// ============================================================================

function MobileMenuTrigger() {
  const { toggle } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={toggle}
      aria-label="Toggle sidebar"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}

// ============================================================================
// TOPBAR COMPONENT
// ============================================================================

export function Topbar({
  organizationId,
  showSearch = true,
  className,
}: TopbarProps) {
  const { collapsed } = useSidebar();

  return (
    <motion.header
      initial={false}
      animate={{
        marginLeft: collapsed ? 64 : 240,
        width: collapsed ? "calc(100% - 64px)" : "calc(100% - 240px)"
      }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed top-0 right-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6",
        className
      )}
    >
      {/* Left: Mobile Menu + Page Title */}
      <div className="flex items-center gap-4">
        <MobileMenuTrigger />
        <PageTitle />
      </div>

      {/* Center: Search (optional) */}
      {showSearch && (
        <div className="hidden lg:flex flex-1 justify-center max-w-md mx-4">
          <TopbarSearch />
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <LocationDropdown variant="compact" />
        <Notifications organizationId={organizationId} />
        <ThemeToggle />
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </motion.header>
  );
}

export default Topbar;
