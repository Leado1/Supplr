import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { RefreshButton } from "./refresh-button";
import {
  Wrench,
  Clock,
  Mail,
  Twitter,
  RefreshCw,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Maintenance - Supplr",
  description: "Supplr is currently undergoing scheduled maintenance. We'll be back soon.",
};

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <img
              src="/images/LOGOB.png"
              alt="Supplr"
              className="h-8 w-auto sm:h-9 dark:hidden"
            />
            <img
              src="/images/LOGOW.png"
              alt="Supplr"
              className="h-8 w-auto hidden sm:h-9 dark:block"
            />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <Wrench className="w-12 h-12 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-orange-600 animate-spin" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Under Maintenance
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto">
              We're currently performing scheduled maintenance to improve your experience.
              We'll be back online shortly.
            </p>
          </div>

          {/* Status Card */}
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold">Estimated Duration</p>
                    <p className="text-sm text-muted-foreground">2-4 hours</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Status</p>
                    <p className="text-sm text-muted-foreground">System updates in progress</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What we're improving */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">What we're working on</h2>
            <div className="grid gap-3 text-left max-w-lg mx-auto">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Performance improvements</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Security updates</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">New inventory features</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <RefreshButton />
              <Link href="/support">
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </Link>
            </div>

            {/* Auto-refresh notice */}
            <p className="text-xs text-muted-foreground">
              This page will automatically refresh every 5 minutes
            </p>
          </div>

          {/* Contact Info */}
          <div className="border-t border-border pt-8">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Need immediate assistance?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
                <a
                  href="mailto:support@supplr.net"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  support@supplr.net
                </a>
                <span className="hidden sm:inline text-muted-foreground">•</span>
                <a
                  href="#"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Twitter className="w-4 h-4" />
                  @SupplrUpdates
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Auto-refresh script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            setTimeout(() => {
              window.location.reload();
            }, 300000); // 5 minutes
          `,
        }}
      />
    </div>
  );
}