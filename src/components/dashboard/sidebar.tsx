"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Sparkles,
  Users,
  MapPin,
  Settings,
  CreditCard,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// TYPES
// ============================================================================

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export interface SidebarProps {
  /** Whether the user can manage team members */
  canManageTeam?: boolean;
  /** Whether the user has multi-location access */
  hasMultiLocationAccess?: boolean;
  /** Custom className */
  className?: string;
}

// ============================================================================
// SIDEBAR CONTEXT
// ============================================================================

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined
);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(true);

  const toggle = React.useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

// ============================================================================
// NAV ITEM COMPONENT
// ============================================================================

interface NavItemProps {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
}

function SidebarNavItem({ item, collapsed, isActive }: NavItemProps) {
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
        !isActive && "text-sidebar-foreground",
        collapsed && "h-9 w-9 justify-center px-0 mx-auto"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-foreground")} />
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="truncate"
          >
            {item.title}
          </motion.span>
        )}
      </AnimatePresence>
      {!collapsed && item.badge && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.title}
          {item.badge && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
              {item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

export function Sidebar({
  canManageTeam = false,
  hasMultiLocationAccess = false,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  // Build navigation sections
  const mainNav: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Inventory", href: "/inventory", icon: Package },
    { title: "Reports", href: "/reports", icon: BarChart3 },
    { title: "AI Insights", href: "/ai", icon: Sparkles },
  ];

  const teamNav: NavItem[] = [];
  if (canManageTeam) {
    teamNav.push({ title: "Team", href: "/team", icon: Users });
  }
  if (hasMultiLocationAccess) {
    teamNav.push({ title: "Locations", href: "/locations", icon: MapPin });
  }

  const settingsNav: NavItem[] = [
    { title: "Settings", href: "/settings", icon: Settings },
    { title: "Billing", href: "/billing", icon: CreditCard },
    { title: "Support", href: "/support", icon: HelpCircle },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 56 : 240 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-sidebar-border bg-sidebar",
          className
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-14 items-center border-b border-sidebar-border px-4",
          collapsed && "justify-center px-2"
        )}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <img
              src="/images/logo.png"
              alt="Supplr"
              className={cn("h-7 w-auto", collapsed && "h-6")}
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 overflow-y-auto py-4 px-3", collapsed && "px-2")}>
          {/* Main Section */}
          <div className="space-y-1">
            {mainNav.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                collapsed={collapsed}
                isActive={isActive(item.href)}
              />
            ))}
          </div>

          {/* Team Section */}
          {teamNav.length > 0 && (
            <>
              <div className="my-4 border-t border-sidebar-border" />
              <div className="space-y-1">
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70"
                  >
                    Team
                  </motion.p>
                )}
                {teamNav.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    isActive={isActive(item.href)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Settings Section */}
          <div className="my-4 border-t border-sidebar-border" />
          <div className="space-y-1">
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70"
              >
                Settings
              </motion.p>
            )}
            {settingsNav.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                collapsed={collapsed}
                isActive={isActive(item.href)}
              />
            ))}
          </div>
        </nav>

      </motion.aside>
    </TooltipProvider>
  );
}

export default Sidebar;
