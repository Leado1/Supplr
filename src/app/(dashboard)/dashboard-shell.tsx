"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Search, PanelLeftClose, PanelLeft } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Sidebar, SidebarProvider, useSidebar } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Notifications } from "@/components/ui/notifications";
import { CommandPalette } from "@/components/ui/command-palette";
import { LocationDropdown } from "@/components/location-dropdown";

interface DashboardShellProps {
  children: React.ReactNode;
  canManageTeam: boolean;
  hasMultiLocationAccess: boolean;
  organizationId?: string;
}

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
  import: "Import",
};

const titleize = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

interface BreadcrumbItem {
  label: string;
  href: string;
}

const getBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: BreadcrumbItem[] = [{ label: "Dashboard", href: "/dashboard" }];

  const filteredSegments =
    segments[0] === "dashboard" ? segments.slice(1) : segments;

  let currentPath = "";
  filteredSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    crumbs.push({
      label: routeLabels[segment] || titleize(segment),
      href: currentPath,
    });
  });

  return crumbs;
};

function DashboardContent({
  children,
  canManageTeam,
  hasMultiLocationAccess,
  organizationId,
}: DashboardShellProps) {
  const { collapsed, toggle } = useSidebar();
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const [commandOpen, setCommandOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      {/* Sidebar */}
      <Sidebar
        canManageTeam={canManageTeam}
        hasMultiLocationAccess={hasMultiLocationAccess}
      />

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{
          marginLeft: collapsed ? 56 : 240,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-screen flex flex-col"
      >
        {/* Fixed Header */}
        <motion.header
          initial={false}
          animate={{
            marginLeft: collapsed ? 56 : 240,
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-0 right-0 left-0 z-20 h-14 border-b border-border bg-background"
          style={{ marginLeft: collapsed ? 56 : 240 }}
        >
          <div className="flex h-full items-center justify-between px-4">
            {/* Sidebar Toggle & Search */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                {collapsed ? (
                  <PanelLeft className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </Button>
              <button
                onClick={() => setCommandOpen(true)}
                className="relative hidden md:flex items-center min-w-[280px] h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Search className="h-4 w-4 mr-2" />
                <span>Search...</span>
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
            </div>

            {/* Right Actions */}
            <div className="ml-auto flex items-center gap-1">
              <LocationDropdown variant="compact" />
              <Notifications organizationId={organizationId} />
              <ThemeToggle />
              <div className="ml-2">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content Area */}
        <div className="flex-1 bg-muted/40 pt-14">
          <div className="p-6">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
            >
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={`${crumb.label}-${index}`}>
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-foreground font-medium">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                  {index < breadcrumbs.length - 1 && (
                    <span className="text-muted-foreground/50">/</span>
                  )}
                </React.Fragment>
              ))}
            </nav>

            {/* Page Content */}
            {children}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-background py-4">
          <div className="px-6 text-center text-xs text-muted-foreground">
            <p>
              &copy; 2026 Supplr. Built for medical practices that care about
              efficiency.
            </p>
          </div>
        </footer>
      </motion.main>
    </div>
  );
}

export function DashboardShell(props: DashboardShellProps) {
  return (
    <SidebarProvider>
      <DashboardContent {...props} />
    </SidebarProvider>
  );
}
