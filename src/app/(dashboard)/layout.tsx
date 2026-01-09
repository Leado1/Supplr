import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <Link href="/dashboard" className="inline-block hover:opacity-80 transition-opacity">
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
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Supplr. Built for medical practices that care about efficiency.</p>
        </div>
      </footer>
    </div>
  );
}