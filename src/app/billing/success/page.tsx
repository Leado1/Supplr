import { Suspense } from "react";
import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SuccessHandler } from "@/components/billing/success-handler";

function SuccessContent() {
  return (
    <div className="container mx-auto max-w-md py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for subscribing to Supplr. Your account has been upgraded and you now have access to all your plan features.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <SuccessHandler />
          <p className="text-sm text-muted-foreground">
            You will receive a confirmation email shortly with your receipt and billing details.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Continue to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/billing">
                View Billing Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-md py-16 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}