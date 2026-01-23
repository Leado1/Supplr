"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Particles } from "@/components/ui/particles";
import {
  staggerContainer,
  slideUp,
  fadeIn,
  staggerItem,
} from "@/lib/motion";

interface AnimatedHeroProps {
  title: string;
  highlightedTitle: string;
  description: string;
  primaryCta: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  subtitle?: string;
  showDashboardPreview?: boolean;
}

export function AnimatedHero({
  title,
  highlightedTitle,
  description,
  primaryCta,
  secondaryCta,
  subtitle,
  showDashboardPreview = false,
}: AnimatedHeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-16 md:pt-20">
      {/* Particles Background */}
      <Particles
        className="absolute inset-0"
        quantity={50}
        ease={80}
        staticity={50}
        color="#6366f1"
        size={0.8}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className={`grid gap-12 items-center ${showDashboardPreview ? 'lg:grid-cols-2' : 'max-w-5xl mx-auto text-center'}`}>
          {/* Left side - Text Content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className={showDashboardPreview ? '' : 'text-center'}
          >
            {/* Animated Badge */}
            {subtitle && (
              <motion.div
                variants={staggerItem}
                className="mb-6"
              >
                <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary border-trace">
                  {subtitle}
                </span>
              </motion.div>
            )}

            {/* Animated Headline */}
            <motion.h1
              variants={staggerItem}
              className="mb-8 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
            >
              <AnimatedWords text={title} />
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                <AnimatedWords text={highlightedTitle} delay={0.3} />
              </span>
            </motion.h1>

            {/* Animated Description */}
            <motion.p
              variants={staggerItem}
              className={`mb-10 text-lg md:text-xl text-muted-foreground leading-relaxed ${showDashboardPreview ? 'max-w-lg' : 'mx-auto max-w-2xl'}`}
            >
              {description}
            </motion.p>

            {/* Animated CTA Buttons */}
            <motion.div
              variants={staggerItem}
              className={`flex flex-col sm:flex-row gap-4 mb-8 ${showDashboardPreview ? '' : 'justify-center'}`}
            >
              <Link href={primaryCta.href}>
                <Button
                  variant="gradient"
                  size="xl"
                  animate
                  className="w-full sm:w-auto"
                >
                  {primaryCta.text}
                </Button>
              </Link>
              {secondaryCta && (
                <Link href={secondaryCta.href}>
                  <Button
                    variant="outline"
                    size="xl"
                    className="w-full sm:w-auto"
                  >
                    {secondaryCta.text}
                  </Button>
                </Link>
              )}
            </motion.div>
          </motion.div>

          {/* Right side - Dashboard Preview */}
          {showDashboardPreview && (
            <motion.div
              initial={{ opacity: 0, x: 100, rotateY: -15 }}
              animate={{ opacity: 1, x: 0, rotateY: -5 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative hidden lg:block"
            >
              {/* Dashboard Image Container with 3D transform */}
              <div className="relative" style={{ perspective: '1500px' }}>
                <motion.div
                  animate={{
                    rotateY: [-5, -3, -5],
                    rotateX: [2, 0, 2],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Main Dashboard Image */}
                  <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/50 bg-background">
                    <Image
                      src="/images/dashboard.png"
                      alt="Supplr Dashboard Preview"
                      width={800}
                      height={500}
                      className="w-full h-auto"
                      priority
                    />
                    {/* Gradient Overlay - Right fade */}
                    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent" />
                    {/* Gradient Overlay - Bottom fade */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
                  </div>

                  {/* Floating Card - Stats */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="absolute -bottom-6 -left-6 bg-background border border-border rounded-lg p-4 shadow-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Savings</p>
                        <p className="text-lg font-bold text-green-500">$47,000</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Floating Card - Alert */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="absolute -top-4 -right-4 bg-background border border-border rounded-lg p-3 shadow-xl"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium">3 items expiring</p>
                        <p className="text-[10px] text-muted-foreground">Action needed</p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

// Animated words component for stagger effect
function AnimatedWords({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(" ");

  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: delay + i * 0.05,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </>
  );
}
