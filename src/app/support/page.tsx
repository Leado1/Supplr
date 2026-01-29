import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react";
import { PublicHeader } from "@/components/navigation/public-nav";

interface SupportPageProps {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export const metadata: Metadata = {
  title: "Support - Supplr",
  description: "Get help with Supplr medical inventory management",
};

const benefitItems = [
  {
    title: "Reduce stockouts",
    description:
      "Keep critical supplies available with proactive alerts and forecasts.",
  },
  {
    title: "Protect margins",
    description:
      "Spot expiration risk early and rebalance inventory across locations.",
  },
  {
    title: "Move faster",
    description:
      "Give teams one place to track purchasing, vendors, and usage trends.",
  },
  {
    title: "Align everyone",
    description:
      "Share the same source of truth for inventory and compliance decisions.",
  },
];

const logoRow = ["Northwind", "Brightline", "Lumen", "Summit"];

export default async function SupportPage({ searchParams }: SupportPageProps) {
  const resolvedParams = await searchParams;
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader showThemeToggle={true} />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          {/* Success/Error Messages */}
          {resolvedParams.success && (
            <Alert className="mb-8 bg-green-50 border-green-200">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <strong>Message sent successfully!</strong> We have received your
                support request and will get back to you within 24 hours.
              </AlertDescription>
            </Alert>
          )}

          {resolvedParams.error && (
            <Alert className="mb-8 bg-red-50 border-red-200">
              <AlertCircleIcon className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <strong>Sorry, there was an error sending your message.</strong>
                Please try again or contact us directly at support@supplr.net.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            {/* Left content */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <img
                  src="/images/logo.png"
                  alt="Supplr"
                  className="h-10 w-auto"
                />
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                  Connect with the Supplr team
                </h1>
                <p className="text-lg text-slate-600">
                  Tell us about your inventory goals. We will guide you to the
                  right setup for smarter purchasing, tracking, and insights.
                </p>
              </div>

              <ul className="space-y-4">
                {benefitItems.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="text-sm text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">
                  Trusted by modern healthcare teams
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  {logoRow.map((logo) => (
                    <span
                      key={logo}
                      className="rounded-full border border-slate-200 bg-white px-4 py-1.5"
                    >
                      {logo}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Right form */}
            <div className="rounded-[32px] bg-gradient-to-br from-[#F3D6C6] via-[#D7C6F6] to-[#4B3CF7] p-[2px] shadow-[0_35px_80px_rgba(76,58,120,0.25)]">
              <Card className="rounded-[30px] border-none">
                <CardContent className="p-8">
                  <form className="space-y-6" action="/api/support" method="POST">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full name *</Label>
                        <Input
                          id="name"
                          name="name"
                          required
                          placeholder="Your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Company email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="you@company.com"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="organization">Organization</Label>
                        <Input
                          id="organization"
                          name="organization"
                          placeholder="Practice or clinic"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="urgency">Priority</Label>
                        <select
                          id="urgency"
                          name="urgency"
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="normal">Normal</option>
                          <option value="low">Low</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Topic *</Label>
                      <select
                        id="category"
                        name="category"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        required
                      >
                        <option value="">Select a topic</option>
                        <option value="general">General question</option>
                        <option value="technical">Technical issue</option>
                        <option value="billing">Billing & subscriptions</option>
                        <option value="feature">Feature request</option>
                        <option value="bug">Bug report</option>
                        <option value="training">Training & onboarding</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        required
                        placeholder="Short summary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">How can we help? *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        placeholder="Share the details so we can help fast."
                        className="resize-none"
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Submit
                    </Button>

                    <p className="text-xs text-muted-foreground">
                      By clicking Submit, you agree to receive updates about
                      Supplr services. You can opt out at any time.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
