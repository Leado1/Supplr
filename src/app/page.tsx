import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { Check, Star, Shield, TrendingUp, AlertTriangle, Calculator } from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { ROICalculator } from "@/components/roi-calculator";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function HomePage() {
  const { userId } = await auth();

  // If user is authenticated, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
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
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-sm font-medium text-foreground">
                Home
              </Link>
              <Link href="/use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Use Cases
              </Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link href="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Support
              </Link>
              <div className="relative group">
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1">
                  <span>Resources</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </nav>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/sign-in">
              <Button variant="ghost" className="text-sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Particles Background */}
          <Particles
            className="absolute inset-0"
            quantity={50}
            ease={80}
            staticity={50}
            color="#6366f1"
            size={0.8}
          />

          <div className="container mx-auto max-w-5xl px-4 text-center relative z-10">
            <h1 className="mb-8 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              Stop Losing Money on
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">Expired Medical Supplies</span>
            </h1>

            <p className="mx-auto mb-12 max-w-2xl text-xl md:text-2xl text-muted-foreground leading-relaxed">
              Stop losing thousands to expired inventory. Track, optimize, and protect your medical supplies with intelligent alerts and insights that keep your practice profitable.
            </p>

            <div className="flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 mb-16">
              <Link href="/sign-up">
                <Button size="lg" className="px-10 py-6 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl hover:shadow-2xl transition-all duration-300">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="px-10 py-6 text-lg border-2 hover:bg-muted/50 transition-all duration-300">
                  Watch Demo
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground mb-20">
              Free 14-day trial • No credit card required • Cancel anytime
            </p>

            {/* How It Works Section */}
            <div className="mt-24">
              <h2 className="text-3xl md:text-4xl font-bold mb-16">How Supplr Works</h2>

              <div className="grid md:grid-cols-3 gap-12">
                {/* Step 1 */}
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold mb-6">
                    1
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Add Your Inventory</h3>
                  <p className="text-muted-foreground">
                    Quickly add your Botox, fillers, and medical supplies with expiration dates and quantities.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold mb-6">
                    2
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Get Smart Alerts</h3>
                  <p className="text-muted-foreground">
                    Receive email and SMS notifications when products are expiring soon or running low.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold mb-6">
                    3
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Save Money</h3>
                  <p className="text-muted-foreground">
                    Use products before they expire and optimize your ordering to reduce waste by 85%.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Benefits Section */}
        <section className="py-20 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-16">
              Why Medical Practices Choose Supplr
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Benefit 1 */}
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl overflow-hidden mb-6">
                  <Image
                    src="/images/abacus.gif"
                    alt="Save Money Icon"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="text-xl font-semibold mb-4">Save $47k Annually</h3>
                <p className="text-muted-foreground">
                  Prevent waste from expired Botox, fillers, and medical supplies with smart tracking and alerts.
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl overflow-hidden mb-6">
                  <Image
                    src="/images/notification.gif"
                    alt="Notification Icon"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="text-xl font-semibold mb-4">Never Run Out</h3>
                <p className="text-muted-foreground">
                  Get notified when inventory is low so you can reorder before running out during procedures.
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl overflow-hidden mb-6">
                  <Image
                    src="/images/shield.gif"
                    alt="Security Icon"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="text-xl font-semibold mb-4">Stay Compliant</h3>
                <p className="text-muted-foreground">
                  HIPAA-secure platform with FDA lot tracking and temperature monitoring capabilities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ROI Calculator */}
        <ROICalculator />

        {/* Social Proof Section */}
        <section className="py-20 bg-gradient-to-b from-background to-primary/5">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Leading Medical Practices
            </h2>
            <p className="text-xl text-muted-foreground mb-16 max-w-2xl mx-auto">
              See what medical professionals are saying about Supplr
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Testimonial 1 */}
              <Card className="text-left p-6">
                <CardContent className="p-0">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-lg mb-4">
                    "Supplr has completely transformed how we manage our Botox and filler inventory.
                    We haven't wasted a single vial in 6 months."
                  </blockquote>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                      S
                    </div>
                    <div>
                      <div className="font-medium">Dr. Sarah Chen</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Testimonial 2 */}
              <Card className="text-left p-6">
                <CardContent className="p-0">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-lg mb-4">
                    "The visual dashboard makes it so easy to see what's running low or expiring soon.
                    My staff can check inventory in seconds."
                  </blockquote>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                      M
                    </div>
                    <div>
                      <div className="font-medium">Maria Rodriguez</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trust Badges */}
            <div className="mt-16">
              <p className="text-sm text-muted-foreground mb-6">Trusted & Compliant</p>
              <div className="flex flex-wrap justify-center items-center gap-6">
                <Badge variant="outline" className="px-4 py-2 text-sm">
                  🔒 HIPAA Compliant
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-sm">
                  🛡️ SOC 2 Type II
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-sm">
                  ✅ FDA 21 CFR Part 11
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 bg-primary/5">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Stop Losing Money on Expired Supplies?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join hundreds of medical practices saving thousands annually with Supplr's smart inventory management.
            </p>

            <div className="flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 mb-8">
              <Link href="/sign-up">
                <Button size="lg" className="px-10 py-6 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl hover:shadow-2xl transition-all duration-300">
                  Start Your Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="px-10 py-6 text-lg border-2 hover:bg-muted/50 transition-all duration-300">
                  View Pricing
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              14-day free trial • No credit card required • Setup in under 5 minutes
            </p>
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
