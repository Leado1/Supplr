"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradePopupProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  description: string;
}

export function UpgradePopup({ isOpen, onClose, feature, description }: UpgradePopupProps) {
  // Close popup on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent background scroll
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-lg"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>

            {/* Content */}
            <div className="space-y-4">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h2 className="text-lg font-semibold">{feature} is a Premium Feature</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {description}
                </p>
              </div>

              {/* Features highlight */}
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Available in Professional & Enterprise
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Intelligent inventory management</li>
                  <li>• Automated reorder recommendations</li>
                  <li>• Advanced analytics and insights</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-2">
                <Link href="/billing" onClick={onClose}>
                  <Button className="w-full">
                    Upgrade to Professional
                  </Button>
                </Link>
                <Button variant="outline" onClick={onClose} className="w-full">
                  Not Now
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}