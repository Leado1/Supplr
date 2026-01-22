"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Calendar,
  CreditCard,
  Package,
  Settings,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { DevActivation } from "@/components/billing/dev-activation";

interface SubscriptionData {
  id: string;
  plan: string;
  status: string;
  itemLimit: number;
  isActive: boolean;
  stripeCurrentPeriodEnd?: Date;
  canceledAt?: Date;
  currentItemCount: number;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch("/api/billing/subscription");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period."
      )
    ) {
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch("/api/billing/cancel-subscription", {
        method: "POST",
      });

      if (response.ok) {
        await fetchSubscriptionData(); // Refresh data
        alert(
          "Your subscription has been scheduled for cancellation at the end of your billing period."
        );
      } else {
        alert("Failed to cancel subscription. Please try again.");
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    // Check if user has a paid subscription
    if (subscription?.plan === "trial") {
      alert(
        "Billing portal is only available for paid subscriptions. Please upgrade to access billing management."
      );
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch("/api/billing/customer-portal", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.provider === 'polar') {
          // Open Polar's customer portal in a new tab
          window.open(data.url, "_blank");
        } else {
          // For other providers (if any), open external portal
          window.open(data.url, "_blank");
        }
      } else {
        const errorData = await response.json();
        alert(
          errorData.message ||
            "Failed to access billing portal. Please try again."
        );
      }
    } catch (error) {
      console.error("Error opening billing portal:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckout = async (plan: any, index: number) => {
    try {
      setIsProcessing(true);

      const planName = plan.name.toLowerCase(); // Convert to lowercase
      const period = isAnnual ? 'annual' : 'monthly';

      console.log("Creating Polar checkout for:", { plan: planName, period });

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
        alert(`Checkout failed: ${errorData.message || "Please try again."}`);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanDisplayName = (plan: string) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  // Pricing plans data
  const plans = [
    {
      name: "Starter",
      monthlyPrice: 29,
      annualPrice: 288,
      monthlyEquivalent: 24,
      monthlyPriceId:
        process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID || "",
      annualPriceId:
        process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID || "",
      description: "Perfect for small practices",
      features: [
        "Up to 100 items",
        "Basic dashboard",
        "Expiration alerts",
        "Email support",
      ],
    },
    {
      name: "Professional",
      monthlyPrice: 79,
      annualPrice: 792,
      monthlyEquivalent: 66,
      monthlyPriceId:
        process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || "",
      annualPriceId:
        process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID || "",
      description: "For growing medical practices",
      popular: true,
      features: [
        "Up to 500 items",
        "Advanced analytics",
        "Custom categories",
        "Priority support",
        "Team collaboration",
      ],
    },
  ];

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }

    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "trialing":
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case "past_due":
        return <Badge variant="destructive">Past Due</Badge>;
      case "canceled":
        return <Badge variant="secondary">Canceled</Badge>;
      case "canceling":
        return (
          <Badge className="bg-orange-100 text-orange-800">Canceling</Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto space-y-8 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription, billing, and account settings
          </p>
        </div>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Current Plan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  {getPlanDisplayName(subscription.plan)} Plan
                </h3>
                <p className="text-muted-foreground">
                  {subscription.itemLimit === -1
                    ? "Unlimited items"
                    : `Up to ${subscription.itemLimit} items`}
                </p>
              </div>
              {getStatusBadge(subscription.status, subscription.isActive)}
            </div>

            {subscription.stripeCurrentPeriodEnd && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {subscription.status === "canceling"
                    ? "Cancels on"
                    : "Renews on"}{" "}
                  {formatDate(subscription.stripeCurrentPeriodEnd)}
                </span>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Items Used</p>
                  <p className="text-2xl font-bold">
                    {subscription.currentItemCount}
                    {subscription.itemLimit !== -1 && (
                      <span className="text-lg font-normal text-muted-foreground">
                        {" "}
                        / {subscription.itemLimit}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {subscription.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {subscription.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {subscription.itemLimit !== -1 &&
                subscription.currentItemCount >=
                  subscription.itemLimit * 0.8 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      You're approaching your item limit. Consider upgrading
                      your plan to add more items.
                    </AlertDescription>
                  </Alert>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Manage Billing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Payment & Billing</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Update your payment method, download invoices, and manage billing
              details.
            </p>
            <Button
              onClick={handleManageBilling}
              disabled={isProcessing || subscription?.plan === "trial"}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {subscription?.plan === "trial"
                ? "Upgrade Required"
                : "Manage Billing"}
            </Button>
          </CardContent>
        </Card>

        {/* Plan Changes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Available Plans</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose a plan that fits your practice's needs.
            </p>

            {/* Plan Toggle */}
            <div className="flex items-center justify-center space-x-4 p-1 bg-muted rounded-lg">
              <Button
                variant={!isAnnual ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsAnnual(false)}
                className="h-8"
              >
                Monthly
              </Button>
              <Button
                variant={isAnnual ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsAnnual(true)}
                className="h-8"
              >
                Annual
                <Badge variant="secondary" className="ml-2">
                  Save 17%
                </Badge>
              </Button>
            </div>

            {/* Plans Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {plans.slice(0, 2).map((plan, index) => (
                <div
                  key={plan.name}
                  className={`border rounded-lg p-4 ${plan.popular ? "border-primary bg-primary/5" : ""}`}
                >
                  {plan.popular && <Badge className="mb-2">Most Popular</Badge>}
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold">
                        ${isAnnual ? plan.monthlyEquivalent : plan.monthlyPrice}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">
                        /month
                      </span>
                    </div>
                    {isAnnual && (
                      <p className="text-xs text-muted-foreground">
                        Billed annually (${plan.annualPrice})
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => handleCheckout(plan, index)}
                    disabled={
                      isProcessing ||
                      subscription?.plan === plan.name.toLowerCase()
                    }
                    className="w-full mb-3"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {subscription?.plan === plan.name.toLowerCase()
                      ? "Current Plan"
                      : "Choose Plan"}
                  </Button>

                  <ul className="space-y-1 text-xs">
                    {plan.features.slice(0, 3).map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Enterprise option */}
            <div className="border rounded-lg p-4">
              <div className="mb-3">
                <h3 className="font-semibold text-lg">Enterprise</h3>
                <p className="text-sm text-muted-foreground">
                  For large practices & chains
                </p>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">
                    ${isAnnual ? 166 : 199}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">
                    /month
                  </span>
                </div>
                {isAnnual && (
                  <p className="text-xs text-muted-foreground">
                    Billed annually ($1992)
                  </p>
                )}
              </div>

              <Button
                onClick={() =>
                  handleCheckout(
                    {
                      name: "Enterprise",
                      monthlyPrice: 199,
                      annualPrice: 1992,
                      monthlyEquivalent: 166,
                      monthlyPriceId:
                        process.env
                          .NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || "",
                      annualPriceId:
                        process.env
                          .NEXT_PUBLIC_STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || "",
                    },
                    2
                  )
                }
                disabled={isProcessing || subscription?.plan === "enterprise"}
                className="w-full mb-3"
                variant="outline"
              >
                {subscription?.plan === "enterprise"
                  ? "Current Plan"
                  : "Choose Plan"}
              </Button>

              <ul className="space-y-1 text-xs">
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                  Unlimited items
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                  Multi-location support
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                  API integrations
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Actions */}
      {subscription?.status === "active" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Subscription Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Cancel Subscription</h4>
                <p className="text-sm text-muted-foreground">
                  Cancel your subscription. You'll retain access until the end
                  of your current billing period.
                </p>
                <Button
                  variant="outline"
                  onClick={handleCancelSubscription}
                  disabled={isProcessing}
                  className="mt-2"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Cancel Subscription
                </Button>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-red-600">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
                <Link href="/dashboard/billing/delete-account">
                  <Button variant="destructive" className="mt-2">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trial Information */}
      {subscription?.plan === "trial" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Trial Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 mb-4">
              You're currently on a trial account with limited features. Upgrade
              to unlock the full potential of Supplr.
            </p>
            <Link href="/pricing">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Upgrade Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Development Tools - only visible in development */}
      <DevActivation />
    </div>
  );
}
