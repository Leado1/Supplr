import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BookOpen, FileText, Video, Download, Users, HelpCircle, Shield, Calculator } from "lucide-react";

export default function ResourcesPage() {

  const resources = [
    {
      category: "Getting Started",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      items: [
        { title: "Quick Start Guide", type: "PDF", description: "Get up and running with Supplr in 5 minutes" },
        { title: "Setup Walkthrough", type: "Video", description: "Step-by-step video tutorial for new users" },
        { title: "Best Practices Checklist", type: "PDF", description: "Essential setup steps for optimal results" },
        { title: "Common Mistakes to Avoid", type: "Guide", description: "Learn from other practices' experiences" }
      ]
    },
    {
      category: "Templates & Tools",
      icon: Calculator,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      items: [
        { title: "ROI Calculator", type: "Tool", description: "Calculate potential savings for your practice" },
        { title: "Inventory Audit Template", type: "Excel", description: "Comprehensive spreadsheet for current inventory assessment" },
        { title: "Reorder Point Calculator", type: "Tool", description: "Determine optimal reorder thresholds" },
        { title: "Waste Tracking Sheet", type: "PDF", description: "Track and analyze inventory waste patterns" }
      ]
    },
    {
      category: "Compliance & Legal",
      icon: Shield,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      items: [
        { title: "FDA Compliance Guide", type: "PDF", description: "Navigate federal regulations for medical devices" },
        { title: "HIPAA Requirements", type: "Guide", description: "Understand data protection for medical practices" },
        { title: "Lot Tracking Standards", type: "PDF", description: "Industry standards for medical product tracking" },
        { title: "Audit Preparation Checklist", type: "PDF", description: "Prepare for regulatory inspections" }
      ]
    },
    {
      category: "Training Materials",
      icon: Video,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      items: [
        { title: "Staff Training Videos", type: "Video Series", description: "Train your team on inventory best practices" },
        { title: "Temperature Monitoring Guide", type: "Video", description: "Proper storage and monitoring procedures" },
        { title: "Emergency Procedures", type: "PDF", description: "What to do when inventory systems fail" },
        { title: "Webinar Series", type: "Video", description: "Monthly expert sessions on inventory management" }
      ]
    }
  ];

  const supportOptions = [
    {
      title: "Documentation",
      description: "Comprehensive guides and API references",
      icon: FileText,
      link: "/docs"
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video walkthroughs",
      icon: Video,
      link: "/tutorials"
    },
    {
      title: "Community Forum",
      description: "Connect with other medical professionals",
      icon: Users,
      link: "/community"
    },
    {
      title: "Help Center",
      description: "FAQs and troubleshooting guides",
      icon: HelpCircle,
      link: "/help"
    }
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <img src="/images/supplr123.png" alt="Supplr" className="h-8 w-auto" />
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Use Cases
              </Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link href="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Support
              </Link>
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 lg:py-24">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Resources &
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent"> Support</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground leading-relaxed">
              Everything you need to master medical inventory management and maximize your practice's efficiency.
            </p>
          </div>
        </section>

        {/* Resource Categories */}
        <section className="pb-20">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="space-y-16">
              {resources.map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <div key={index}>
                    <div className="flex items-center space-x-4 mb-8">
                      <div className={`w-12 h-12 ${category.bgColor} rounded-xl flex items-center justify-center`}>
                        <IconComponent className={`h-6 w-6 ${category.color}`} />
                      </div>
                      <h2 className="text-3xl font-bold">{category.category}</h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                      {category.items.map((item, itemIndex) => (
                        <Card key={itemIndex} className="group hover:shadow-lg transition-all duration-300">
                          <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{item.title}</CardTitle>
                              <Badge variant="outline">{item.type}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-muted-foreground">{item.description}</p>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                <Download className="w-4 h-4 mr-2" />
                                {item.type === 'Video' || item.type === 'Video Series' || item.type === 'Tool' ? 'Access' : 'Download'}
                              </Button>
                              {item.type === 'PDF' && (
                                <span className="text-xs text-muted-foreground">PDF • Free</span>
                              )}
                              {item.type === 'Video' && (
                                <span className="text-xs text-muted-foreground">Video • 5-10 min</span>
                              )}
                              {item.type === 'Tool' && (
                                <span className="text-xs text-muted-foreground">Interactive Tool</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Support Options */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Need More Help?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our support team and community are here to help you succeed.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {supportOptions.map((option, index) => {
                const IconComponent = option.icon;
                return (
                  <Card key={index} className="text-center p-6 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{option.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{option.description}</p>
                      <Button variant="outline" size="sm" className="w-full">
                        Explore
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Popular Downloads */}
        <section className="py-20">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Most Popular Downloads
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The resources our users find most valuable.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { title: "Complete Medical Inventory Management Guide", downloads: "12.5k", type: "PDF Guide" },
                { title: "ROI Calculator Spreadsheet", downloads: "8.2k", type: "Excel Tool" },
                { title: "FDA Compliance Checklist", downloads: "6.7k", type: "PDF Checklist" },
                { title: "Temperature Monitoring Best Practices", downloads: "5.1k", type: "Video Series" },
                { title: "HIPAA Compliance for Medical Practices", downloads: "4.8k", type: "PDF Guide" }
              ].map((item, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <Badge variant="secondary" className="text-xs">{item.type}</Badge>
                          <span className="text-xs text-muted-foreground">{item.downloads} downloads</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Get Free
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary/5">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Start your free trial today and get access to all resources, plus our complete inventory management platform.
            </p>

            <div className="flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link href="/sign-up">
                <Button size="lg" className="px-10 py-6 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl hover:shadow-2xl transition-all duration-300">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="px-10 py-6 text-lg border-2 hover:bg-muted/50 transition-all duration-300">
                  View Pricing
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              14-day free trial • Access to all resources • No credit card required
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2026 Supplr. Built for medical practices that care about efficiency.</p>
        </div>
      </footer>
    </div>
  );
}