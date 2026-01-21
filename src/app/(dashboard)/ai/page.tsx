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
        <div className="flex items-start gap-3">
          <Image
            src="/images/brain.gif"
            alt="AI Brain"
            width={48}
            height={48}
            className="w-12 h-12 mt-1"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              AI-Powered Inventory Intelligence
            </h1>
            <p className="text-sm text-muted-foreground">
              Advanced AI recommendations to optimize your medical inventory management
            </p>
          </div>
        </div>

        {/* Feature Access Status */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={features.aiPredictions ? "default" : "secondary"} className="flex items-center gap-1">
            {features.aiPredictions ? <TrendingUp className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            Basic AI Features {!features.aiPredictions && "(Starter+ Required)"}
          </Badge>
          <Badge variant={features.advancedAnalytics ? "default" : "secondary"} className="flex items-center gap-1">
            {features.advancedAnalytics ? <Brain className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            Advanced AI Analytics {!features.advancedAnalytics && "(Professional+ Required)"}
          </Badge>
          <Badge variant={features.aiAutomation ? "default" : "secondary"} className="flex items-center gap-1">
            {features.aiAutomation ? <Sparkles className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            AI Automation {!features.aiAutomation && "(Enterprise Required)"}
          </Badge>
        </div>
      </div>

      {/* Subscription Upgrade Alert for Trial Users */}
      {!features.aiPredictions && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-2">
              <p><strong>AI Features Available with Subscription:</strong></p>
              <p>
                Unlock powerful AI-driven insights for waste prevention, reorder predictions,
                and cost optimization. Upgrade to Starter ($19/month) to enable AI features.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* AI Capabilities Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className={!features.aiPredictions ? "opacity-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waste Prevention</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">AI Alerts</div>
            <p className="text-xs text-muted-foreground">
              Predict which items will expire unused
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
            <CardTitle className="text-sm font-medium">Smart Reordering</CardTitle>
            <Package className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Predictions</div>
            <p className="text-xs text-muted-foreground">
              Optimal reorder timing and quantities
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
            <CardTitle className="text-sm font-medium">Cost Optimization</CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Savings</div>
            <p className="text-xs text-muted-foreground">
              Threshold optimization and bulk ordering
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
            <CardTitle className="text-sm font-medium">Auto-Ordering</CardTitle>
            <Clock className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">Automation</div>
            <p className="text-xs text-muted-foreground">
              Automated reordering with approval workflows
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
            How Supplr AI Works
          </CardTitle>
          <CardDescription>
            Our machine learning algorithms analyze your inventory patterns to provide intelligent recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <h4 className="font-semibold">Data Analysis</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                AI continuously analyzes your usage patterns, expiration dates, and ordering history
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <h4 className="font-semibold">Smart Predictions</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Machine learning models predict optimal reorder points, waste risks, and cost optimization opportunities
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <h4 className="font-semibold">Actionable Insights</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive prioritized recommendations with confidence scores and direct supplier integration
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
              <h3 className="text-xl font-semibold">Unlock AI-Powered Inventory Intelligence</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Transform your inventory management with machine learning predictions,
                waste prevention alerts, and intelligent reorder recommendations.
                Start saving money and reducing waste today.
              </p>
              <div className="flex justify-center gap-4">
                <div className="text-left space-y-1">
                  <p className="text-sm font-medium">✓ Waste Risk Predictions</p>
                  <p className="text-sm font-medium">✓ Smart Reorder Alerts</p>
                  <p className="text-sm font-medium">✓ Cost Optimization</p>
                </div>
                <div className="text-left space-y-1">
                  <p className="text-sm font-medium">✓ Supplier Integration</p>
                  <p className="text-sm font-medium">✓ Usage Pattern Analysis</p>
                  <p className="text-sm font-medium">✓ Confidence Scoring</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}