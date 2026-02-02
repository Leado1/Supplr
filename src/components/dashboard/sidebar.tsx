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
  Bot,
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
import { UpgradePopup } from "@/components/ui/upgrade-popup";

// ============================================================================
// TYPES
// ============================================================================

export interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  badge?: string | number;
  iconColor?: string;
  onClick?: () => void;
  disabled?: boolean;
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
  /** Whether the user can access the AI Assistant */
  hasAssistantAccess?: boolean;
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

  const baseClasses = cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
    !isActive && "text-sidebar-foreground",
    item.disabled && "opacity-60 cursor-pointer",
    collapsed && "h-9 w-9 justify-center px-0 mx-auto"
  );

  const iconClasses = cn(
    "h-4 w-4 shrink-0",
    item.disabled ? "text-sidebar-foreground/40" : (item.iconColor ?? "text-sidebar-foreground/70")
  );

  const contentElement = (
    <>
      <Icon className={iconClasses} />
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
    </>
  );

  const content = item.onClick ? (
    <button
      onClick={item.onClick}
      className={baseClasses}
    >
      {contentElement}
    </button>
  ) : (
    <Link
      href={item.href || "#"}
      className={baseClasses}
    >
      {contentElement}
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
  hasAssistantAccess = true,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const [showUpgradePopup, setShowUpgradePopup] = React.useState(false);

  // Build navigation sections
  const mainNav: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, iconColor: "text-sky-500" },
    { title: "Inventory", href: "/inventory", icon: Package, iconColor: "text-emerald-500" },
    { title: "Reports", href: "/reports", icon: BarChart3, iconColor: "text-violet-500" },
    { title: "AI Insights", href: "/ai", icon: Sparkles, iconColor: "text-amber-500" },
  ];

  // Always show Supplr Assistant, but handle access differently
  if (hasAssistantAccess) {
    mainNav.push({
      title: "Supplr Assistant",
      href: "/dashboard/assistant",
      icon: Bot,
      iconColor: "text-indigo-500",
    });
  } else {
    mainNav.push({
      title: "Supplr Assistant",
      icon: Bot,
      iconColor: "text-indigo-500",
      onClick: () => setShowUpgradePopup(true),
      disabled: true,
    });
  }

  const teamNav: NavItem[] = [];
  if (canManageTeam) {
    teamNav.push({ title: "Team", href: "/team", icon: Users, iconColor: "text-rose-500" });
  }
  if (hasMultiLocationAccess) {
    teamNav.push({
      title: "Locations",
      href: "/locations",
      icon: MapPin,
      iconColor: "text-cyan-500",
    });
  }

  const settingsNav: NavItem[] = [
    { title: "Settings", href: "/settings", icon: Settings, iconColor: "text-slate-500" },
    { title: "Billing", href: "/billing", icon: CreditCard, iconColor: "text-orange-500" },
    { title: "Support", href: "/support", icon: HelpCircle, iconColor: "text-lime-500" },
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
          "flex h-14 items-center border-b border-sidebar-border px-4"
        )}>
          <Link href="/dashboard" className="flex items-center">
            <div
              className={cn(
                "overflow-hidden transition-[width] duration-300",
                collapsed ? "w-8" : "w-[120px]"
              )}
            >
              <img
                src="/images/logo.png"
                alt="Supplr"
                className="h-7 w-auto"
              />
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 overflow-y-auto py-4 px-3", collapsed && "px-2")}>
          {/* Main Section */}
          <div className="space-y-1">
            {mainNav.map((item) => (
              <SidebarNavItem
                key={item.href || item.title}
                item={item}
                collapsed={collapsed}
                isActive={item.href ? isActive(item.href) : false}
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
                    key={item.href || item.title}
                    item={item}
                    collapsed={collapsed}
                    isActive={item.href ? isActive(item.href) : false}
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
                key={item.href || item.title}
                item={item}
                collapsed={collapsed}
                isActive={item.href ? isActive(item.href) : false}
              />
            ))}
          </div>
        </nav>

      </motion.aside>

      {/* Upgrade Popup */}
      <UpgradePopup
        isOpen={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        feature="Supplr Assistant"
        description="Upgrade to Professional or Enterprise to access our intelligent inventory assistant with automated insights and recommendations."
      />
    </TooltipProvider>
  );
}

export default Sidebar;
