import { redirect } from "next/navigation";
import { getUserOrganization } from "@/lib/auth-helpers";
import { getSubscriptionFeatures } from "@/lib/subscription-helpers";
import { AIDashboard } from "@/components/ai";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Sparkles, TrendingUp, DollarSign, Clock, Package, AlertTriangle, Lock } from "lucide-react";
import Image from "next/image";

export default async function AIPage() {
  // Authentication and authorization check
  const { error, organization, user } = await getUserOrganization();
  if (error || !organization || !user) {
    redirect("/sign-in");
  }

  const features = getSubscriptionFeatures(organization.subscription, organization);

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Image
            src="/images/brain.gif"
            alt="AI Brain"
            width={48}
            height={48}
            className="w-12 h-12"
          />
          <div>
            <p className="text-sm text-muted-foreground">
              Clear recommendations to help you reorder on time and avoid waste
            </p>
          </div>
        </div>

        {/* Feature Access Status */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={features.aiPredictions ? "default" : "secondary"} className="flex items-center gap-1">
            {features.aiPredictions ? <TrendingUp className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            Smart insights {!features.aiPredictions && "(Starter+ Required)"}
          </Badge>
          <Badge variant={features.advancedAnalytics ? "default" : "secondary"} className="flex items-center gap-1">
            {features.advancedAnalytics ? <Brain className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            Deeper insights {!features.advancedAnalytics && "(Professional+ Required)"}
          </Badge>
          <Badge variant={features.aiAutomation ? "default" : "secondary"} className="flex items-center gap-1">
            {features.aiAutomation ? <Sparkles className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            Auto-ordering {!features.aiAutomation && "(Enterprise Required)"}
          </Badge>
        </div>
      </div>

      {/* Subscription Upgrade Alert for Trial Users */}
      {!features.aiPredictions && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-2">
              <p><strong>Unlock smart insights:</strong></p>
              <p>
                Get reorder reminders and waste alerts. Upgrade to Starter ($29/month)
                to turn this on.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* AI Capabilities Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className={!features.aiPredictions ? "opacity-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avoid waste</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Alerts</div>
            <p className="text-xs text-muted-foreground">
              See items likely to expire before use
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {features.aiPredictions ? "Active" : "Starter+ Required"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className={!features.advancedAnalytics ? "opacity-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restock reminders</CardTitle>
            <Package className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Reminders</div>
            <p className="text-xs text-muted-foreground">
              When to reorder and how much
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {features.advancedAnalytics ? "Active" : "Professional+ Required"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className={!features.advancedAnalytics ? "opacity-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Save on costs</CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Savings tips</div>
            <p className="text-xs text-muted-foreground">
              Simple ways to reduce spend
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {features.advancedAnalytics ? "Active" : "Professional+ Required"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className={!features.aiAutomation ? "opacity-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-ordering</CardTitle>
            <Clock className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">Auto mode</div>
            <p className="text-xs text-muted-foreground">
              Automatic reorders with approval
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {features.aiAutomation ? "Active" : "Enterprise Required"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How AI Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            How it works
          </CardTitle>
          <CardDescription>
            We look at your inventory activity and give clear next steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <h4 className="font-semibold">We look at your usage</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                We review what you use, what expires, and what you order
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <h4 className="font-semibold">We spot what is coming</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                We estimate when you may run low or risk waste
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <h4 className="font-semibold">We give clear next steps</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Simple suggestions you can act on right away
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main AI Dashboard */}
      {features.aiPredictions && (
        <AIDashboard
          organizationId={organization.id}
          className="border-0"
        />
      )}

      {/* Upgrade Prompt for Non-AI Users */}
      {!features.aiPredictions && (
        <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Brain className="w-16 h-16 mx-auto text-primary/50" />
              <h3 className="text-xl font-semibold">Unlock smart insights</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get clear recommendations to reorder, avoid waste, and save money.
                Start improving today.
              </p>
              <div className="flex justify-center gap-4">
                <div className="text-left space-y-1">
                  <p className="text-sm font-medium">Waste risk alerts</p>
                  <p className="text-sm font-medium">Restock reminders</p>
                  <p className="text-sm font-medium">Savings tips</p>
                </div>
                <div className="text-left space-y-1">
                  <p className="text-sm font-medium">Supplier links</p>
                  <p className="text-sm font-medium">Usage trends</p>
                  <p className="text-sm font-medium">How sure we are</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
