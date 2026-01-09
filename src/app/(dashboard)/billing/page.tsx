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
  Clock
} from "lucide-react";
import Link from "next/link";

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
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

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
    if (!confirm("Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.")) {
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch("/api/billing/cancel-subscription", {
        method: "POST",
      });

      if (response.ok) {
        await fetchSubscriptionData(); // Refresh data
        alert("Your subscription has been scheduled for cancellation at the end of your billing period.");
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
    try {
      setIsProcessing(true);
      const response = await fetch("/api/billing/customer-portal", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        window.open(data.url, "_blank");
      } else {
        alert("Failed to open billing portal. Please try again.");
      }
    } catch (error) {
      console.error("Error opening billing portal:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanDisplayName = (plan: string) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

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
        return <Badge className="bg-orange-100 text-orange-800">Canceling</Badge>;
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
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
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
                <h3 className="text-2xl font-bold">{getPlanDisplayName(subscription.plan)} Plan</h3>
                <p className="text-muted-foreground">
                  {subscription.itemLimit === -1
                    ? "Unlimited items"
                    : `Up to ${subscription.itemLimit} items`
                  }
                </p>
              </div>
              {getStatusBadge(subscription.status, subscription.isActive)}
            </div>

            {subscription.stripeCurrentPeriodEnd && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {subscription.status === "canceling" ? "Cancels on" : "Renews on"}{" "}
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
                        {" "}/ {subscription.itemLimit}
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

              {subscription.itemLimit !== -1 && subscription.currentItemCount >= subscription.itemLimit * 0.8 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You're approaching your item limit. Consider upgrading your plan to add more items.
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
              Update your payment method, download invoices, and manage billing details.
            </p>
            <Button
              onClick={handleManageBilling}
              disabled={isProcessing}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Billing
            </Button>
          </CardContent>
        </Card>

        {/* Plan Changes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Plan Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upgrade, downgrade, or change your subscription plan.
            </p>
            <Link href="/pricing">
              <Button variant="outline" className="w-full">
                View Plans
              </Button>
            </Link>
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
                  Cancel your subscription. You'll retain access until the end of your current billing period.
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
                  Permanently delete your account and all associated data. This action cannot be undone.
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
              You're currently on a trial account with limited features. Upgrade to unlock the full potential of Supplr.
            </p>
            <Link href="/pricing">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Upgrade Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}