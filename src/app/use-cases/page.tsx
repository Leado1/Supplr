import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/navigation/public-nav";

// Page-specific metadata
export const metadata: Metadata = {
  title: "Use Cases - Medical Inventory Management Solutions",
  description:
    "Discover how Supplr helps medical spas, aesthetic clinics, dental practices, and plastic surgery clinics streamline inventory management, reduce waste, and improve operational efficiency.",
  keywords: [
    "medical spa inventory",
    "aesthetic clinic management",
    "dental practice software",
    "plastic surgery inventory",
    "medical inventory use cases",
    "clinic efficiency solutions",
  ],
  openGraph: {
    title: "Use Cases - Medical Inventory Management Solutions | Supplr",
    description:
      "See how medical practices use Supplr to manage inventory, track expiration dates, and reduce waste across different practice types.",
    url: "https://www.supplr.net/use-cases",
    images: [
      {
        url: "/images/use-cases-og.png",
        width: 1200,
        height: 630,
        alt: "Supplr Use Cases for Medical Practices",
      },
    ],
  },
  twitter: {
    title: "Use Cases - Medical Inventory Management Solutions | Supplr",
    description:
      "See how medical practices use Supplr to manage inventory, track expiration dates, and reduce waste.",
    images: ["/images/use-cases-twitter.png"],
  },
  alternates: {
    canonical: "/use-cases",
  },
};

export default function UseCasesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <PublicHeader showThemeToggle={true} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 lg:py-24">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Built for Every Type of
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                {" "}
                Medical Practice
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground leading-relaxed">
              From medical spas to dental offices, Supplr adapts to your
              practice's unique inventory management needs.
            </p>
          </div>
        </section>

        {/* Use Cases Grid */}
        <section className="pb-20">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Medical Spas & Aesthetics */}
              <Card className="relative overflow-hidden border-2 border-primary/20">
                <CardHeader className="pb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl overflow-hidden">
                      <Image
                        src="/images/spa-stones.gif"
                        alt="Medical Spa Icon"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        Medical Spas & Aesthetics
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Premium injectables and skincare
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Common Challenges</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>
                          • Botox and Juvederm expiring before use ($3,000+
                          monthly losses)
                        </li>
                        <li>
                          • Temperature-sensitive products requiring precise
                          storage
                        </li>
                        <li>
                          • High-value inventory with tight profit margins
                        </li>
                        <li>• Multiple product lines and seasonal demand</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">How Supplr Helps</h4>
                      <div className="space-y-2">
                        <Badge variant="secondary" className="mr-2">
                          Smart expiration alerts
                        </Badge>
                        <Badge variant="secondary" className="mr-2">
                          Temperature monitoring
                        </Badge>
                        <Badge variant="secondary" className="mr-2">
                          Lot tracking for FDA compliance
                        </Badge>
                        <Badge variant="secondary" className="mr-2">
                          ROI optimization
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dental Practices */}
              <Card className="relative overflow-hidden border-2 border-blue-100 dark:border-blue-900/30">
                <CardHeader className="pb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl overflow-hidden">
                      <Image
                        src="/images/stethoscope.gif"
                        alt="Dental Practice Icon"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        Dental Practices
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Dental supplies and consumables
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Common Challenges</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>
                          • Running out of essential supplies during procedures
                        </li>
                        <li>• Tracking hundreds of small consumable items</li>
                        <li>• Dental materials with short shelf lives</li>
                        <li>• Multiple locations with different needs</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">How Supplr Helps</h4>
                      <div className="space-y-2">
                        <Badge variant="secondary" className="mr-2">
                          Low stock alerts
                        </Badge>
                        <Badge variant="secondary" className="mr-2">
                          Bulk item management
                        </Badge>
                        <Badge variant="secondary" className="mr-2">
                          Multi-location support
                        </Badge>
                        <Badge variant="secondary" className="mr-2">
                          Automated reordering
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plastic Surgery Clinics */}
              <Card className="relative overflow-hidden border-2 border-purple-100 dark:border-purple-900/30">
                <CardHeader className="pb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl overflow-hidden">
                      <Image
                        src="/images/first-aid-kit.gif"
                        alt="Plastic Surgery Clinic Icon"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        Plastic Surgery Clinics
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Surgical supplies and implants
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Common Challenges</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• High-value implants and surgical materials</li>
                        <li>• Strict sterility and expiration requirements</li>
                        <li>• Custom orders with long lead times</li>
                        <li>• Insurance claims for expired products</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">How Supplr Helps</h4>
                      <div className="space-y-2">
                        <Badge variant="secondary" className="mr-2">
                          Sterile lot tracking
                        </Badge>
                        <Badge variant="secondary" className="mr-2">
                          Insurance documentation
                        </Badge>
                        <Badge variant="secondary" className="mr-2">
                          Custom item categories
                        </Badge>
                        <Badge variant="secondary" className="mr-2">
                          Audit trails
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Multi-Location Chains */}
              <Card className="relative overflow-hidden border-2 border-amber-100 dark:border-amber-900/30">
                <CardHeader className="pb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl overflow-hidden">
                      <Image
                        src="/images/overpopulation.gif"
                        alt="Multi-Location Chain Icon"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        Multi-Location Chains
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Franchise and chain practices
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Common Challenges</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Managing inventory across multiple locations</li>
                        <li>• Inconsistent tracking between sites</li>
                        <li>• Bulk purchasing and distribution</li>
                        <li>• Centralized reporting and compliance</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">How Supplr Helps</h4>
                      <div className="space-y-2">
                        <Badge variant="secondary" className="mr-2">
                          Multi-location dashboard
                        </Badge>
                        <Badge variant="secondary" className="mr-2">
                          Inter-location transfers
                        </Badge>
                        <Badge variant="secondary" className="mr-2">
                          Centralized reporting
                        </Badge>
                        <Badge variant="secondary" className="mr-2">
                          Role-based access
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Common Benefits Section */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-16">
              Benefits Across All Practice Types
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  85%
                </div>
                <div className="text-lg font-semibold mb-2">
                  Average Waste Reduction
                </div>
                <p className="text-muted-foreground">
                  Across all practice types using Supplr
                </p>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  $47k
                </div>
                <div className="text-lg font-semibold mb-2">
                  Average Annual Savings
                </div>
                <p className="text-muted-foreground">
                  From prevented waste and optimized ordering
                </p>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  5 min
                </div>
                <div className="text-lg font-semibold mb-2">
                  Daily Time Investment
                </div>
                <p className="text-muted-foreground">
                  Quick daily checks keep inventory optimized
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join hundreds of medical practices saving thousands with Supplr's
              smart inventory management.
            </p>

            <div className="flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="px-10 py-6 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-10 py-6 text-lg border-2 hover:bg-muted/50 transition-all duration-300"
                >
                  View Pricing
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              14-day free trial • No credit card required • Setup in under 5
              minutes
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>
            &copy; 2026 Supplr. Built for medical practices that care about
            efficiency.
          </p>
        </div>
      </footer>
    </div>
  );
}
