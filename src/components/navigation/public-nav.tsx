"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function PublicNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/use-cases", label: "Use Cases" },
    { href: "/pricing", label: "Pricing" },
    { href: "/blog", label: "Blog" },
    { href: "/support", label: "Support" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav className="hidden md:flex items-center space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-sm transition-colors ${
            pathname === item.href
              ? "font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

interface PublicHeaderProps {
  showThemeToggle?: boolean;
}

export function PublicHeader({ showThemeToggle = true }: PublicHeaderProps) {
  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src="/images/supplr123.png"
              alt="Supplr"
              className="h-8 w-auto"
            />
          </Link>

          {/* Navigation Tabs */}
          <PublicNavigation />
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-4">
          {showThemeToggle && <ThemeToggle />}
          <Link href="/sign-in">
            <Button variant="ghost" className="text-sm">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-sm">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
