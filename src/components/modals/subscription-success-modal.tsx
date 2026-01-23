"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Sparkles,
  BarChart3,
  MapPin,
  Brain,
  Zap,
  FileText,
  FolderOpen,
  Code,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SubscriptionSuccessModalProps {
  open: boolean;
  onClose: () => void;
  plan: string;
}

interface Feature {
  name: string;
  description: string;
  icon: React.ElementType;
  plans: string[]; // Which plans include this feature
}

const allFeatures: Feature[] = [
  {
    name: "Inventory Tracking",
    description: "Track all your medical supplies with expiration alerts",
    icon: Check,
    plans: ["starter", "professional", "enterprise"],
  },
  {
    name: "Custom Categories",
    description: "Organize inventory with custom categories",
    icon: FolderOpen,
    plans: ["starter", "professional", "enterprise"],
  },
  {
    name: "AI Predictions",
    description: "Smart reorder suggestions and waste prevention",
    icon: Brain,
    plans: ["starter", "professional", "enterprise"],
  },
  {
    name: "Advanced Analytics",
    description: "Deep insights into usage patterns and trends",
    icon: BarChart3,
    plans: ["professional", "enterprise"],
  },
  {
    name: "Custom Reports",
    description: "Generate detailed custom reports",
    icon: FileText,
    plans: ["professional", "enterprise"],
  },
  {
    name: "AI Automation",
    description: "Automatic reorder suggestions with approval workflows",
    icon: Zap,
    plans: ["enterprise"],
  },
  {
    name: "Multi-Location",
    description: "Manage inventory across multiple locations",
    icon: MapPin,
    plans: ["enterprise"],
  },
  {
    name: "API Access",
    description: "Integrate with your existing systems",
    icon: Code,
    plans: ["enterprise"],
  },
];

const planDisplayNames: Record<string, string> = {
  starter: "Starter",
  basic: "Starter",
  professional: "Professional",
  pro: "Professional",
  enterprise: "Enterprise",
};

const planColors: Record<string, string> = {
  starter: "bg-blue-500",
  basic: "bg-blue-500",
  professional: "bg-purple-500",
  pro: "bg-purple-500",
  enterprise: "bg-amber-500",
};

export function SubscriptionSuccessModal({
  open,
  onClose,
  plan,
}: SubscriptionSuccessModalProps) {
  const normalizedPlan = plan.toLowerCase();
  const displayName = planDisplayNames[normalizedPlan] || plan;
  const planColor = planColors[normalizedPlan] || "bg-primary";

  // Get features for this plan
  const unlockedFeatures = allFeatures.filter((feature) =>
    feature.plans.includes(normalizedPlan)
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2"
          >
            <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
              {/* Header with confetti effect */}
              <div className={`relative ${planColor} px-6 py-8 text-white`}>
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 rounded-full p-1 hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Sparkles animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20"
                >
                  <Sparkles className="h-8 w-8" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center text-2xl font-bold"
                >
                  Welcome to {displayName}!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-2 text-center text-white/80"
                >
                  Your subscription is now active
                </motion.p>
              </div>

              {/* Features List */}
              <div className="px-6 py-6">
                <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Features Unlocked
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {unlockedFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={feature.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{feature.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                        <Check className="ml-auto h-4 w-4 shrink-0 text-green-500" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border bg-muted/30 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {displayName} Plan
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {unlockedFeatures.length} features included
                    </span>
                  </div>
                  <Button onClick={onClose}>
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
