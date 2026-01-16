import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MailIcon,
  PhoneIcon,
  ClockIcon,
  MessageSquareIcon,
  BookOpenIcon,
  BugIcon,
  LightbulbIcon,
  HelpCircleIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from "lucide-react";
import { PublicHeader } from "@/components/navigation/public-nav";

interface SupportPageProps {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export const metadata: Metadata = {
  title: "Support - Supplr",
  description: "Get help with Supplr medical inventory management",
};

export default async function SupportPage({ searchParams }: SupportPageProps) {
  const resolvedParams = await searchParams;
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <PublicHeader showThemeToggle={false} />

      <main className="flex-1 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Support Center</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're here to help you get the most out of Supplr. Get quick answers or reach out to our support team.
          </p>
        </div>

        {/* Success/Error Messages */}
        {resolvedParams.success && (
          <Alert className="mb-8 bg-green-50 border-green-200">
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <strong>Message sent successfully!</strong> We've received your support request and will get back to you within 24 hours. You should also receive a confirmation email shortly.
            </AlertDescription>
          </Alert>
        )}

        {resolvedParams.error && (
          <Alert className="mb-8 bg-red-50 border-red-200">
            <AlertCircleIcon className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>Sorry, there was an error sending your message.</strong> Please try again or contact us directly at support@supplr.net.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareIcon className="h-5 w-5" />
                  Send us a message
                </CardTitle>
                <p className="text-gray-600">
                  Can't find what you're looking for? Send us a detailed message and we'll get back to you quickly.
                </p>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" action="/api/support" method="POST">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input
                      id="organization"
                      name="organization"
                      placeholder="Your practice or organization name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Issue Category</Label>
                    <select
                      id="category"
                      name="category"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select category</option>
                      <option value="general">General Question</option>
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing & Subscriptions</option>
                      <option value="feature">Feature Request</option>
                      <option value="bug">Bug Report</option>
                      <option value="training">Training & Onboarding</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      required
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      placeholder="Please provide as much detail as possible about your issue or question..."
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urgency">Priority</Label>
                    <select
                      id="urgency"
                      name="urgency"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low - General question</option>
                      <option value="normal">Normal - Standard issue</option>
                      <option value="high">High - Affecting daily operations</option>
                      <option value="urgent">Urgent - System down or critical</option>
                    </select>
                  </div>

                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MailIcon className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-gray-600">support@supplr.net</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ClockIcon className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Response Time</p>
                    <p className="text-gray-600">Usually within 24 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Help */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <HelpCircleIcon className="h-4 w-4" />
                    Common Questions
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-6">
                    <li>• How do I add new inventory items?</li>
                    <li>• Setting up expiration alerts</li>
                    <li>• Managing user permissions</li>
                    <li>• Subscription billing questions</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <BugIcon className="h-4 w-4" />
                    Technical Issues
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-6">
                    <li>• Login or access problems</li>
                    <li>• Data sync issues</li>
                    <li>• Performance problems</li>
                    <li>• Mobile app support</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <LightbulbIcon className="h-4 w-4" />
                    Feature Requests
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-6">
                    <li>• New integrations</li>
                    <li>• Report customization</li>
                    <li>• Workflow improvements</li>
                    <li>• Mobile features</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">All Systems Operational</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Last updated: {new Date().toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-12 text-center">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="py-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                🚨 Emergency Support
              </h3>
              <p className="text-red-700 mb-4">
                If you're experiencing a critical system failure that's affecting patient care,
                please mark your message as "Urgent" above for immediate attention.
              </p>
              <p className="text-sm text-red-600">
                For life-threatening emergencies, contact your local emergency services directly.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      </main>
    </div>
  );
}