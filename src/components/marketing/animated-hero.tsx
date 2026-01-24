"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Particles } from "@/components/ui/particles";
import { LayeredDashboard } from "./layered-dashboard";
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
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-12 pb-8 md:pt-20 md:pb-12">
      {/* Particles Background */}
      <Particles
        className="absolute inset-0"
        quantity={50}
        ease={80}
        staticity={50}
        color="#6366f1"
        size={0.8}
      />

      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_center,rgba(99,102,241,0.1),transparent_50%)]" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center text-center">
        {/* Text Content */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
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
            className="mb-6 md:mb-8 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
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
            className="mb-8 md:mb-12 text-lg sm:text-xl md:text-2xl text-muted-foreground leading-relaxed mx-auto max-w-3xl px-2 sm:px-0"
          >
            {description}
          </motion.p>

          {/* Animated CTA Buttons */}
          <motion.div
            variants={staggerItem}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-12 md:mb-16 px-2 sm:px-0 justify-center"
          >
            <Link href={primaryCta.href}>
              <Button
                variant="gradient"
                size="xl"
                animate
                className="w-full sm:w-auto text-lg px-8 py-4"
              >
                {primaryCta.text}
              </Button>
            </Link>
            {secondaryCta && (
              <Link href={secondaryCta.href}>
                <Button
                  variant="outline"
                  size="xl"
                  className="w-full sm:w-auto text-lg px-8 py-4"
                >
                  {secondaryCta.text}
                </Button>
              </Link>
            )}
          </motion.div>
        </motion.div>

        {/* Dashboard Preview - Positioned below content */}
        {showDashboardPreview && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.0, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-6xl mx-auto"
          >
            {/* Dashboard Component */}
            <div className="relative">
              <LayeredDashboard className="w-full h-auto" />

              {/* Subtle glow effect around dashboard */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 blur-xl opacity-50 rounded-[48px]" />
            </div>
          </motion.div>
        )}
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
