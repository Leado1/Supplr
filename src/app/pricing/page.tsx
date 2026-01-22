"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Check } from "lucide-react";
import { PublicHeader } from "@/components/navigation/public-nav";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async (plan: any, index: number) => {
    if (index === 2) {
      // Enterprise plan - still handle via email
      window.location.href = "mailto:support@supplr.net";
      return;
    }

    try {
      setIsLoading(true);

      const planName = plan.name.toLowerCase(); // 'starter' or 'professional'
      const period = isAnnual ? 'annual' : 'monthly';

      console.log("Creating Polar checkout for:", {
        plan: planName,
        period,
        planObject: plan,
        isAnnual
      });

      // Debug validation
      if (!planName || !period) {
        console.error("Missing plan data:", { planName, period, plan });
        alert("Invalid plan data. Please try again.");
        return;
      }

      const response = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: planName,
          period: period,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.checkout_url;
      } else {
        const errorData = await response.json();
        console.error("Checkout error:", errorData);

        // If user is not authenticated, redirect to signup
        if (response.status === 401) {
          window.location.href = "/sign-up";
          return;
        }

        alert(`Checkout failed: ${errorData.error || "Please try again."}`);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      // If there's a network error or the user is not logged in, redirect to signup
      window.location.href = "/sign-up";
    } finally {
      setIsLoading(false);
    }
  };

  // Pricing data - Now using Polar.sh product IDs (defined in polar-helpers.ts)
  const plans = [
    {
      name: "Starter",
      monthlyPrice: 19,
      annualPrice: 190, // ~17% savings
      monthlyEquivalent: 16,
      description: "Perfect for small practices",
      features: [
        "Up to 50 items",
        "Basic dashboard",
        "Expiration alerts",
        "Email support",
        "AI-powered insights",
      ],
    },
    {
      name: "Professional",
      monthlyPrice: 49,
      annualPrice: 490, // ~17% savings
      monthlyEquivalent: 41,
      description: "For growing medical practices",
      popular: true,
      features: [
        "Up to 200 items",
        "Advanced analytics",
        "Custom categories",
        "Priority support",
        "Team collaboration",
        "Custom reports",
        "Advanced AI predictions",
      ],
    },
    {
      name: "Enterprise",
      monthlyPrice: 149,
      annualPrice: 1490, // ~17% savings
      monthlyEquivalent: 124,
      description: "For large practices & chains",
      features: [
        "Unlimited items",
        "Multi-location support",
        "API integrations",
        "Custom reports",
        "Dedicated support",
      ],
    },
  ];

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
              Simple, Transparent
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                {" "}
                Pricing
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground leading-relaxed">
              Choose the plan that fits your practice.
            </p>
          </div>
        </section>

        {/* Billing Toggle */}
        <section className="pb-8">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <div className="inline-flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                  !isAnnual
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                  isAnnual
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
                <Badge className="ml-2 bg-green-100 text-green-700 text-xs">
                  Save 17%
                </Badge>
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid gap-8 lg:grid-cols-3">
              {plans.map((plan, index) => {
                const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
                const monthlyEquivalent = isAnnual
                  ? plan.monthlyEquivalent
                  : null;
                const originalMonthlyPrice = isAnnual
                  ? plan.monthlyPrice
                  : null;

                return (
                  <Card
                    key={plan.name}
                    className={`relative overflow-hidden ${plan.popular ? "border-primary shadow-xl" : ""}`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-center py-2 text-sm font-medium">
                        Most Popular
                      </div>
                    )}
                    <CardHeader
                      className={`text-center pb-8 ${plan.popular ? "pt-12" : ""}`}
                    >
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <div className="mt-4">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-4xl font-bold">${price}</span>
                          <div className="flex flex-col items-start">
                            <span className="text-muted-foreground">
                              /{isAnnual ? "year" : "month"}
                            </span>
                            {isAnnual && monthlyEquivalent && (
                              <span className="text-xs text-muted-foreground">
                                (${monthlyEquivalent}/mo)
                              </span>
                            )}
                          </div>
                        </div>
                        {isAnnual && originalMonthlyPrice && (
                          <div className="mt-2 space-y-1">
                            <div className="text-sm text-muted-foreground line-through">
                              ${originalMonthlyPrice * 12}/year if paid monthly
                            </div>
                            <div className="text-sm text-green-600 font-medium">
                              Save ${originalMonthlyPrice * 12 - price}/year
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {plan.description}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className="flex items-center space-x-3"
                          >
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={() => handleCheckout(plan, index)}
                        disabled={isLoading}
                        className={`w-full mt-6 ${
                          plan.popular
                            ? "bg-gradient-to-r from-primary to-primary/80"
                            : index === plans.length - 1
                              ? ""
                              : ""
                        }`}
                        variant={
                          index === plans.length - 1 ? "outline" : "default"
                        }
                      >
                        {isLoading
                          ? "Processing..."
                          : index === plans.length - 1
                            ? "Contact Sales"
                            : "Start Free Trial"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <p className="text-sm text-muted-foreground">
                All plans include 14-day free trial • No setup fees • Cancel
                anytime
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Can I change plans anytime?
                </h3>
                <p className="text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time.
                  Changes take effect immediately, and billing is prorated.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  What happens after the free trial?
                </h3>
                <p className="text-muted-foreground">
                  Your 14-day free trial gives you full access to all features.
                  No credit card required. After the trial, choose a plan to
                  continue using Supplr.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Is my data secure?
                </h3>
                <p className="text-muted-foreground">
                  Absolutely. We use enterprise-grade encryption and security
                  measures. Your practice data is protected and never shared
                  with third parties.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Do you offer custom enterprise solutions?
                </h3>
                <p className="text-muted-foreground">
                  Yes! Our Enterprise plan includes custom integrations,
                  dedicated support, and multi-location features. Contact our
                  sales team for more details.
                </p>
              </div>
            </div>
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
