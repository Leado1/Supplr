"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [confirmationText, setConfirmationText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDeleteAccount = async () => {
    if (confirmationText !== "DELETE MY ACCOUNT" || !acknowledged) {
      setError("Please complete all required fields");
      return;
    }

    if (
      !confirm(
        "This action cannot be undone. Are you absolutely sure you want to delete your account?"
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      setError("");

      const response = await fetch("/api/billing/delete-account", {
        method: "DELETE",
      });

      if (response.ok) {
        // Redirect to goodbye page or homepage
        window.location.href = "/";
      } else {
        const data = await response.json();
        setError(data.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setError("An error occurred while deleting your account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <Link
          href="/billing"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Billing
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-red-600">
          Delete Account
        </h1>
        <p className="text-muted-foreground">
          Permanently delete your account and all associated data
        </p>
      </div>

      {/* Warning */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Warning:</strong> This action is irreversible. All your data
          will be permanently deleted.
        </AlertDescription>
      </Alert>

      {/* Deletion Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Account Deletion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">What will be deleted:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>All inventory items and data</li>
              <li>Organization settings and preferences</li>
              <li>User account and profile information</li>
              <li>Subscription and billing information</li>
              <li>All reports and analytics data</li>
              <li>Any uploaded files or documents</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Before you delete:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Export any data you want to keep</li>
              <li>Cancel any active subscriptions</li>
              <li>Download invoices for your records</li>
              <li>Inform team members if applicable</li>
            </ul>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Type <strong>DELETE MY ACCOUNT</strong> to confirm:
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="font-mono"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="acknowledge"
                checked={acknowledged}
                onCheckedChange={(checked) =>
                  setAcknowledged(checked as boolean)
                }
              />
              <Label htmlFor="acknowledge" className="text-sm">
                I understand this action cannot be undone and all data will be
                permanently lost
              </Label>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-3 pt-4">
              <Link href="/billing">
                <Button variant="outline" className="flex-1">
                  Cancel
                </Button>
              </Link>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={
                  confirmationText !== "DELETE MY ACCOUNT" ||
                  !acknowledged ||
                  isDeleting
                }
                className="flex-1"
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
