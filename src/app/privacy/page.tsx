import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  Shield,
  Lock,
  Eye,
  FileText,
  Users,
  Globe,
  Calendar,
} from "lucide-react";
import { PublicHeader } from "@/components/navigation/public-nav";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <PublicHeader showThemeToggle={false} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 lg:py-24">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <div className="flex items-center justify-center mb-6">
              <Shield className="h-12 w-12 text-primary mr-4" />
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Privacy Policy
              </h1>
            </div>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground leading-relaxed">
              Your privacy and data security are our top priorities. Learn how
              we protect your medical practice's information.
            </p>
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Last updated: January 8, 2026</span>
            </div>
          </div>
        </section>

        {/* Quick Overview */}
        <section className="pb-16">
          <div className="container mx-auto max-w-4xl px-4">
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-center">
                  Privacy at a Glance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <Lock className="w-8 h-8 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">HIPAA Compliant</h3>
                    <p className="text-sm text-muted-foreground">
                      Enterprise-grade security with Business Associate
                      Agreement available
                    </p>
                  </div>
                  <div>
                    <Eye className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">No Data Selling</h3>
                    <p className="text-sm text-muted-foreground">
                      We never sell, rent, or share your practice data with
                      third parties
                    </p>
                  </div>
                  <div>
                    <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">
                      Your Data, Your Control
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Export or delete your data anytime with one-click controls
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main Privacy Policy Content */}
        <section className="pb-20">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="prose prose-lg max-w-none">
              {/* Information We Collect */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6 flex items-center">
                  <FileText className="w-8 h-8 text-primary mr-3" />
                  Information We Collect
                </h2>

                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      When you create a Supplr account, we collect:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Practice name and business information</li>
                      <li>Your name, email address, and phone number</li>
                      <li>
                        Billing information (securely processed by Stripe)
                      </li>
                      <li>
                        Practice type and location (for service optimization)
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-xl">Inventory Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      To provide inventory management services, we store:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Product names, SKUs, and category information</li>
                      <li>
                        Expiration dates, quantities, and reorder thresholds
                      </li>
                      <li>Vendor information and purchase history</li>
                      <li>Temperature monitoring data (if applicable)</li>
                      <li>
                        <strong>Note:</strong> We do not collect patient
                        information or medical records
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Usage Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      To improve our service, we automatically collect:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>
                        Log data (IP addresses, browser type, pages visited)
                      </li>
                      <li>Feature usage patterns and preferences</li>
                      <li>Device information and operating system</li>
                      <li>Performance and error reporting data</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* How We Use Your Information */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6 flex items-center">
                  <Lock className="w-8 h-8 text-primary mr-3" />
                  How We Use Your Information
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Service Delivery
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                        <li>Provide inventory tracking and alerts</li>
                        <li>Generate reports and analytics</li>
                        <li>Enable temperature monitoring</li>
                        <li>Process payments and billing</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Communication</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                        <li>Send expiration and low-stock alerts</li>
                        <li>Provide customer support</li>
                        <li>Share product updates and features</li>
                        <li>Send billing and account notifications</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Improvement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                        <li>Analyze usage patterns</li>
                        <li>Develop new features</li>
                        <li>Improve system performance</li>
                        <li>Enhance security measures</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Legal Compliance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                        <li>Comply with FDA regulations</li>
                        <li>Maintain HIPAA compliance</li>
                        <li>Respond to legal requests</li>
                        <li>Protect against fraud</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* HIPAA Compliance */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6 flex items-center">
                  <Shield className="w-8 h-8 text-primary mr-3" />
                  HIPAA Compliance
                </h2>

                <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                  <CardHeader>
                    <CardTitle className="text-xl text-green-800 dark:text-green-200">
                      Business Associate Agreement (BAA)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-green-700 dark:text-green-300">
                    <p>
                      Supplr is HIPAA compliant and can serve as your Business
                      Associate. We provide:
                    </p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>
                        <strong>Data Encryption:</strong> All data encrypted in
                        transit and at rest using AES-256
                      </li>
                      <li>
                        <strong>Access Controls:</strong> Role-based permissions
                        and multi-factor authentication
                      </li>
                      <li>
                        <strong>Audit Logs:</strong> Complete tracking of all
                        data access and modifications
                      </li>
                      <li>
                        <strong>BAA Available:</strong> Formal Business
                        Associate Agreements for covered entities
                      </li>
                      <li>
                        <strong>Staff Training:</strong> All employees trained
                        on HIPAA requirements
                      </li>
                    </ul>
                    <div className="bg-green-100 dark:bg-green-800/30 border border-green-300 dark:border-green-700 rounded-lg p-4 mt-4">
                      <p className="text-sm font-semibold">Important Note:</p>
                      <p className="text-sm">
                        While Supplr handles practice inventory data, we do not
                        store Protected Health Information (PHI) such as patient
                        records or medical history. Our focus is strictly on
                        inventory management.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Data Sharing and Third Parties */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6 flex items-center">
                  <Users className="w-8 h-8 text-primary mr-3" />
                  Data Sharing and Third Parties
                </h2>

                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      We DO NOT share your data with:
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Marketing companies or advertisers</li>
                      <li>Data brokers or analytics firms</li>
                      <li>Competitors or other medical software companies</li>
                      <li>Social media platforms</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Limited sharing occurs only with:
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-green-600">
                          Service Providers
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Trusted vendors who help operate our service under
                          strict contractual obligations:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 ml-4">
                          <li>AWS (secure cloud hosting)</li>
                          <li>Stripe (payment processing)</li>
                          <li>Clerk (authentication services)</li>
                          <li>SendGrid (transactional emails)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-600">
                          Legal Requirements
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Only when required by law, court order, or regulatory
                          investigation
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-600">
                          Business Transfers
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          In the unlikely event of acquisition or merger (with
                          30-day advance notice)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Data Security */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6 flex items-center">
                  <Lock className="w-8 h-8 text-primary mr-3" />
                  Data Security Measures
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Technical Safeguards
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                        <li>AES-256 encryption for all data</li>
                        <li>TLS 1.3 for data transmission</li>
                        <li>Multi-factor authentication</li>
                        <li>Regular security audits</li>
                        <li>Automated backup systems</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Physical Safeguards
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                        <li>SOC 2 Type II certified data centers</li>
                        <li>24/7 physical security monitoring</li>
                        <li>Biometric access controls</li>
                        <li>Redundant power and cooling</li>
                        <li>Fire suppression systems</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Administrative Safeguards
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                        <li>Background checks for all staff</li>
                        <li>Regular security training</li>
                        <li>Incident response procedures</li>
                        <li>Access logging and monitoring</li>
                        <li>Data retention policies</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Compliance Certifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                        <li>SOC 2 Type II compliant</li>
                        <li>HIPAA Business Associate</li>
                        <li>FDA 21 CFR Part 11 ready</li>
                        <li>ISO 27001 practices</li>
                        <li>Annual penetration testing</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Your Rights and Controls */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6 flex items-center">
                  <Eye className="w-8 h-8 text-primary mr-3" />
                  Your Rights and Controls
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Data Access Rights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                        <li>View all your stored data</li>
                        <li>Download your data in CSV format</li>
                        <li>Review access logs</li>
                        <li>Update incorrect information</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Data Deletion Rights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                        <li>Delete individual records</li>
                        <li>Delete entire account</li>
                        <li>Request permanent data purge</li>
                        <li>30-day retention for account recovery</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Communication Controls
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                        <li>Customize alert preferences</li>
                        <li>Opt out of marketing emails</li>
                        <li>Choose notification methods</li>
                        <li>Set quiet hours for alerts</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Account Controls
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                        <li>Manage user permissions</li>
                        <li>Enable/disable integrations</li>
                        <li>Export data before leaving</li>
                        <li>Request data portability</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Data Retention */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6">
                  Data Retention Policy
                </h2>

                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">
                          Active Accounts
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Data retained as long as your account is active and
                          for legitimate business purposes
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-600 mb-2">
                          Cancelled Accounts
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Data retained for 30 days to allow account
                          reactivation, then permanently deleted unless legally
                          required to retain
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-600 mb-2">
                          Legal Requirements
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Some data may be retained longer to comply with
                          regulatory requirements (e.g., tax records for 7
                          years)
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-600 mb-2">
                          Backup Systems
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Backup copies automatically purged within 90 days of
                          data deletion
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* International Transfers */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6 flex items-center">
                  <Globe className="w-8 h-8 text-primary mr-3" />
                  International Data Transfers
                </h2>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground mb-4">
                      Supplr is based in the United States. If you are located
                      outside the US, your information will be transferred to
                      and processed in the United States where our servers are
                      located.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">
                          Data Protection Measures
                        </h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>
                            Standard Contractual Clauses (SCCs) for EU data
                            transfers
                          </li>
                          <li>
                            Adequate protection measures as required by GDPR
                          </li>
                          <li>Regular assessment of data protection laws</li>
                          <li>Encryption during all international transfers</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Changes to Privacy Policy */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6">
                  Changes to This Privacy Policy
                </h2>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground mb-4">
                      We may update this Privacy Policy from time to time to
                      reflect changes in our practices or for legal and
                      regulatory reasons.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-blue-600 mb-2">
                          Notification Process
                        </h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Email notification for significant changes</li>
                          <li>In-app notifications for policy updates</li>
                          <li>30-day notice period for major changes</li>
                          <li>Updated "Last Modified" date at top of policy</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">
                          Your Options
                        </h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Review changes before they take effect</li>
                          <li>Contact us with questions or concerns</li>
                          <li>
                            Cancel your account if you disagree with changes
                          </li>
                          <li>Request data export before cancellation</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6">Contact Information</h2>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground mb-6">
                      If you have questions about this Privacy Policy or how we
                      handle your data, please contact us:
                    </p>

                    <div className="text-center">
                      <Link href="/support">
                        <Button
                          size="lg"
                          className="px-8 py-4 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        >
                          Contact Us
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>
            &copy; 2026 Supplr. Built for medical practices that care about
            efficiency.
          </p>
        </div>
      </footer>
    </div>
  );
}
