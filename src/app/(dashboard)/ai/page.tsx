import { redirect } from "next/navigation";
import { getUserOrganization } from "@/lib/auth-helpers";
import { getSubscriptionFeatures } from "@/lib/subscription-helpers";
import { AIDashboard } from "@/components/ai";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Lock, Sparkles } from "lucide-react";

export default async function AIPage() {
  const { error, organization, user } = await getUserOrganization();
  if (error || !organization || !user) {
    redirect("/sign-in");
  }

  const features = getSubscriptionFeatures(
    organization.subscription,
    organization
  );

  return (
    <div className="container mx-auto space-y-6 p-6">
      {!features.aiPredictions && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unlock AI Insights</AlertTitle>
          <AlertDescription>
            Get reorder reminders and waste alerts. Upgrade to Starter to turn
            this on.
          </AlertDescription>
        </Alert>
      )}

      {features.aiPredictions ? (
        <div className="space-y-4">
          {!features.advancedAnalytics && (
            <Alert className="border-border bg-muted/40">
              <Lock className="h-4 w-4" />
              <AlertTitle>Restock insights need Professional</AlertTitle>
              <AlertDescription>
                Waste prevention insights are still available on your current
                plan.
              </AlertDescription>
            </Alert>
          )}
          <AIDashboard organizationId={organization.id} className="border-0" />
        </div>
      ) : (
        <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Insights
            </CardTitle>
            <CardDescription>
              Clear next steps to reorder on time and avoid waste.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              Upgrade to see a focused action queue with restock, waste
              prevention, and savings suggestions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
