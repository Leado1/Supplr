"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Particles } from "@/components/ui/particles";
import { ROICalculator } from "@/components/roi-calculator";
import { PublicHeader } from "@/components/navigation/public-nav";
import {
  AnimatedHero,
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
  AnimatedCounter,
} from "@/components/marketing";

export function HomepageContent() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <PublicHeader />

      {/* Hero Section */}
      <main className="flex-1">
        <AnimatedHero
          title="Stop Losing Money on"
          highlightedTitle="Expired Medical Supplies"
          description="Stop losing thousands to expired inventory. Track, optimize, and protect your medical supplies with intelligent alerts and insights that keep your practice profitable."
          primaryCta={{ text: "Start Free Trial", href: "/sign-up" }}
          secondaryCta={{ text: "View Pricing", href: "/pricing" }}
          showDashboardPreview
        />

        {/* Impact Metrics */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6">
            <AnimatedSection animation="fade">
              <div className="text-center mb-8">
                <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  Proven Impact
                </p>
              </div>
            </AnimatedSection>

            <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StaggerItem>
                <Card variant="interactive" animate className="h-full">
                  <div className="p-6 text-center">
                    <div className="text-3xl font-semibold">
                      <AnimatedCounter value={85} suffix="%" />
                    </div>
                    <p className="mt-2 text-sm font-medium">
                      Waste reduction
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Fewer expired supplies month over month
                    </p>
                  </div>
                </Card>
              </StaggerItem>
              <StaggerItem>
                <Card variant="interactive" animate className="h-full">
                  <div className="p-6 text-center">
                    <div className="text-3xl font-semibold">
                      <AnimatedCounter value={47} prefix="$" suffix="k" />
                    </div>
                    <p className="mt-2 text-sm font-medium">Annual savings</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Typical practice savings after switching
                    </p>
                  </div>
                </Card>
              </StaggerItem>
              <StaggerItem>
                <Card variant="interactive" animate className="h-full">
                  <div className="p-6 text-center">
                    <div className="text-3xl font-semibold">
                      <AnimatedCounter value={2} suffix="x" />
                    </div>
                    <p className="mt-2 text-sm font-medium">
                      Faster audits
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Prep and export reports in minutes
                    </p>
                  </div>
                </Card>
              </StaggerItem>
              <StaggerItem>
                <Card variant="interactive" animate className="h-full">
                  <div className="p-6 text-center">
                    <div className="text-3xl font-semibold">
                      <AnimatedCounter value={5} />
                      <span className="text-base font-semibold text-muted-foreground ml-1">
                        min
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium">Setup time</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Get your first inventory live quickly
                    </p>
                  </div>
                </Card>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-12 md:py-20 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6 text-center">
            <AnimatedSection>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 md:mb-16">
                How Supplr Works
              </h2>
            </AnimatedSection>

            <StaggerContainer className="grid md:grid-cols-3 gap-8 md:gap-12">
              {/* Step 1 */}
              <StaggerItem className="text-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold mb-6"
                >
                  1
                </motion.div>
                <h3 className="text-xl font-semibold mb-4">
                  Add Your Inventory
                </h3>
                <p className="text-muted-foreground">
                  Quickly add your Botox, fillers, and medical supplies with
                  expiration dates and quantities.
                </p>
              </StaggerItem>

              {/* Step 2 */}
              <StaggerItem className="text-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold mb-6"
                >
                  2
                </motion.div>
                <h3 className="text-xl font-semibold mb-4">Get Smart Alerts</h3>
                <p className="text-muted-foreground">
                  Receive email and SMS notifications when products are expiring
                  soon or running low.
                </p>
              </StaggerItem>

              {/* Step 3 */}
              <StaggerItem className="text-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold mb-6"
                >
                  3
                </motion.div>
                <h3 className="text-xl font-semibold mb-4">Save Money</h3>
                <p className="text-muted-foreground">
                  Use products before they expire and optimize your ordering to
                  reduce waste by 85%.
                </p>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* Scanner Support Section */}
        <section className="relative py-12 md:py-20 overflow-hidden">
          <Particles
            className="absolute inset-0"
            quantity={50}
            ease={80}
            staticity={50}
            color="#6366f1"
            size={0.8}
          />
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center relative z-10">
            <AnimatedSection>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">
                Add Inventory in Seconds with Professional Scanners
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto px-2 sm:px-0">
                Skip the tedious manual entry. Scan barcodes instantly with any
                professional barcode scanner.
              </p>
            </AnimatedSection>

            <StaggerContainer className="grid md:grid-cols-3 gap-8 mb-12">
              {/* Handheld Scanner */}
              <StaggerItem>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl overflow-hidden mb-6">
                    <Image
                      src="/images/barcode-scanner.gif"
                      alt="Handheld Scanner Icon"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">
                    Handheld Scanners
                  </h3>
                  <p className="text-muted-foreground">
                    Compatible with Zebra, Honeywell, and all major handheld
                    barcode scanners.
                  </p>
                </motion.div>
              </StaggerItem>

              {/* Wireless Scanner */}
              <StaggerItem>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl overflow-hidden mb-6">
                    <Image
                      src="/images/barcode.gif"
                      alt="Wireless Scanner Icon"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">
                    Wireless Scanners
                  </h3>
                  <p className="text-muted-foreground">
                    Bluetooth and WiFi-enabled scanners for flexible inventory
                    management.
                  </p>
                </motion.div>
              </StaggerItem>

              {/* Fixed Mount Scanner */}
              <StaggerItem>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl overflow-hidden mb-6">
                    <Image
                      src="/images/barcode-scanner2.gif"
                      alt="Fixed Mount Scanner Icon"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">
                    Fixed Mount Scanners
                  </h3>
                  <p className="text-muted-foreground">
                    Integrated scanners for high-volume inventory processing
                    stations.
                  </p>
                </motion.div>
              </StaggerItem>
            </StaggerContainer>

            {/* Scanner Types Supported */}
            <AnimatedSection animation="scale">
              <Card variant="glass" className="p-8">
                <h3 className="text-2xl font-semibold mb-6">
                  All Scanner Types Supported
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <Badge variant="outline" className="w-full py-2">
                      📊 UPC/EAN
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="w-full py-2">
                      🔢 Code 128
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="w-full py-2">
                      ⚕️ NDC Codes
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="w-full py-2">
                      📦 QR Codes
                    </Badge>
                  </div>
                </div>
                <p className="text-muted-foreground mt-6">
                  Instantly capture lot numbers, expiration dates, and product
                  details from any medical supply barcode.
                </p>
              </Card>
            </AnimatedSection>
          </div>
        </section>

        {/* Key Benefits Section */}
        <section className="py-12 md:py-20 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <AnimatedSection>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 md:mb-16">
                Why Medical Practices Choose Supplr
              </h2>
            </AnimatedSection>

            <StaggerContainer className="grid md:grid-cols-3 gap-8">
              {/* Benefit 1 */}
              <StaggerItem>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl overflow-hidden mb-6">
                    <Image
                      src="/images/abacus.gif"
                      alt="Save Money Icon"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">
                    Save $47k Annually
                  </h3>
                  <p className="text-muted-foreground">
                    Prevent waste from expired Botox, fillers, and medical
                    supplies with smart tracking and alerts.
                  </p>
                </motion.div>
              </StaggerItem>

              {/* Benefit 2 */}
              <StaggerItem>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl overflow-hidden mb-6">
                    <Image
                      src="/images/notification.gif"
                      alt="Notification Icon"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Never Run Out</h3>
                  <p className="text-muted-foreground">
                    Get notified when inventory is low so you can reorder before
                    running out during procedures.
                  </p>
                </motion.div>
              </StaggerItem>

              {/* Benefit 3 */}
              <StaggerItem>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl overflow-hidden mb-6">
                    <Image
                      src="/images/shield.gif"
                      alt="Security Icon"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Stay Compliant</h3>
                  <p className="text-muted-foreground">
                    HIPAA-secure platform with FDA lot tracking and comprehensive
                    audit trails for regulatory compliance.
                  </p>
                </motion.div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* ROI Calculator */}
        <AnimatedSection>
          <ROICalculator />
        </AnimatedSection>

        {/* Social Proof Section */}
        <section className="py-12 md:py-20 bg-gradient-to-b from-background to-primary/5">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <AnimatedSection>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Trusted by Leading Medical Practices
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto px-2 sm:px-0">
                See what medical professionals are saying about Supplr
              </p>
            </AnimatedSection>

            <StaggerContainer className="grid md:grid-cols-2 gap-8">
              {/* Testimonial 1 */}
              <StaggerItem>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card variant="interactive" className="text-left p-6 h-full">
                    <CardContent className="p-0">
                      <div className="flex mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <blockquote className="text-lg mb-4">
                        "Supplr has completely transformed how we manage our
                        Botox and filler inventory. We haven't wasted a single
                        vial in 6 months."
                      </blockquote>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                          S
                        </div>
                        <div>
                          <div className="font-medium">Dr. Sarah Chen</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>

              {/* Testimonial 2 */}
              <StaggerItem>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card variant="interactive" className="text-left p-6 h-full">
                    <CardContent className="p-0">
                      <div className="flex mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <blockquote className="text-lg mb-4">
                        "The visual dashboard makes it so easy to see what's
                        running low or expiring soon. My staff can check
                        inventory in seconds."
                      </blockquote>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                          M
                        </div>
                        <div>
                          <div className="font-medium">Maria Rodriguez</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            </StaggerContainer>

            {/* Trust Badges */}
            <AnimatedSection delay={0.3}>
              <div className="mt-16">
                <p className="text-sm text-muted-foreground mb-6">
                  Trusted & Compliant
                </p>
                <div className="flex flex-wrap justify-center items-center gap-4">
                  <Badge variant="outline" className="px-4 py-2 text-sm">
                    🔒 HIPAA Compliant
                  </Badge>
                  <Badge variant="outline" className="px-4 py-2 text-sm">
                    🛡️ SOC 2 Type II
                  </Badge>
                  <Badge variant="outline" className="px-4 py-2 text-sm">
                    ✅ FDA 21 CFR Part 11
                  </Badge>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-12 md:py-20 bg-primary/5">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <AnimatedSection>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">
                Ready to Stop Losing Money on Expired Supplies?
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto px-2 sm:px-0">
                Join hundreds of medical practices saving thousands annually
                with Supplr's smart inventory management.
              </p>

              <div className="flex flex-col justify-center space-y-3 sm:space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 mb-6 md:mb-8 px-2 sm:px-0">
                <Link href="/sign-up">
                  <Button variant="gradient" size="xl" animate>
                    Start Your Free Trial
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="xl">
                    View Pricing
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-muted-foreground">
                14-day free trial • No credit card required • Setup in under 5
                minutes
              </p>
            </AnimatedSection>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 md:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 md:col-span-2">
              <div className="flex items-center mb-3 md:mb-4">
                <img
                  src="/images/LOGOB.png"
                  alt="Supplr"
                  className="h-7 md:h-8 w-auto dark:hidden"
                />
                <img
                  src="/images/LOGOW.png"
                  alt="Supplr"
                  className="h-7 md:h-8 w-auto hidden dark:block"
                />
              </div>
              <p className="text-sm md:text-base text-muted-foreground max-w-md">
                Smart inventory management for medical practices. Stop losing
                money on expired supplies and never run out during procedures.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-3 md:mb-4">Product</h3>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/use-cases"
                    className="hover:text-foreground transition-colors"
                  >
                    Use Cases
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-foreground transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-3 md:mb-4">Legal</h3>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-6 md:mt-8 pt-6 md:pt-8 text-center text-xs md:text-sm text-muted-foreground">
            <p>
              &copy; 2026 Supplr. Built for medical practices that care about
              efficiency.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
