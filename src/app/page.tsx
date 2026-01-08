import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = await auth();

  // If user is authenticated, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-primary">Supplr</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Medical Inventory
              <span className="text-primary"> Simplified</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
              Stop losing money on expired supplies. Supplr gives medical spas and
              clinics a simple dashboard to track inventory, expiration dates, and
              stock levels.
            </p>
            <div className="flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link href="/sign-up">
                <Button size="lg" className="px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Everything you need to manage clinic inventory
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span>Visual Dashboard</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    See all your inventory at a glance with color-coded status badges.
                    Quickly identify what's expiring soon or running low.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span>Expiration Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Never lose money on expired Botox, fillers, or medical supplies again.
                    Get automatic warnings before items expire.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <span>Simple Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Add, edit, and track inventory items easily. Organize by categories
                    like Injectables, Skincare, and Consumables.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2026 Supplr. Built for medical practices that care about efficiency.</p>
        </div>
      </footer>
    </div>
  );
}
