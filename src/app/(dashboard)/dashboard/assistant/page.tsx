import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getUserOrganization } from "@/lib/auth-helpers";
import {
  getPlanDisplayName,
  isSubscriptionActive,
} from "@/lib/subscription-helpers";
import { AssistantChat } from "@/components/assistant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AssistantPage() {
  const { error, organization } = await getUserOrganization();

  if (error || !organization) {
    redirect("/sign-in");
  }

  const allowedPlans = new Set(["professional", "enterprise", "pro"]);
  const plan = organization.subscription?.plan?.toLowerCase() ?? "trial";
  const subscriptionActive = organization.subscription
    ? isSubscriptionActive(organization.subscription)
    : false;
  const hasAssistantAccess =
    !!organization.subscription && subscriptionActive && allowedPlans.has(plan);
  const planLabel = getPlanDisplayName(plan);

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Supplr Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Manage inventory and get insights
        </p>
      </div>
      {!hasAssistantAccess ? (
        <div className="rounded-xl border border-dashed border-muted-foreground/40 bg-muted/20 p-8">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Supplr Assistant is a paid feature
                </h2>
                <p className="text-sm text-muted-foreground">
                  Upgrade to an active Professional or Enterprise plan to
                  use the Supplr Assistant.
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>Current plan:</span>
                  <Badge variant="secondary" className="capitalize">
                    {planLabel}
                  </Badge>
                  {!subscriptionActive && (
                    <span className="text-xs text-amber-700">
                      Subscription inactive
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link href="/billing">
              <Button>Upgrade Plan</Button>
            </Link>
          </div>
        </div>
      ) : (
        <AssistantChat workspaceId={organization.id} />
      )}
    </div>
  );
}
