"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Create a custom router wrapper that tracks navigation
export function NavigationLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
      setProgress(10);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 150);

      // Complete after reasonable time
      setTimeout(() => {
        clearInterval(progressInterval);
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 300);
      }, 800);
    };

    // Listen for navigation events
    const handleNavigation = () => {
      handleStart();
    };

    // Intercept all link clicks in the app
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLAnchorElement;

      if (link && link.href) {
        const url = new URL(link.href);
        const currentUrl = new URL(window.location.href);

        // Only show loading for internal navigation
        if (
          url.origin === currentUrl.origin &&
          url.pathname !== currentUrl.pathname
        ) {
          handleStart();
        }
      }
    };

    // Also handle programmatic navigation
    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;

    window.history.pushState = function (...args) {
      handleStart();
      return originalPush.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      handleStart();
      return originalReplace.apply(this, args);
    };

    // Add event listeners
    document.addEventListener("click", handleLinkClick);
    window.addEventListener("popstate", handleNavigation);

    return () => {
      document.removeEventListener("click", handleLinkClick);
      window.removeEventListener("popstate", handleNavigation);
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
    };
  }, []);

  if (!isLoading) return null;

  return (
    <>
      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Center loading spinner for longer loads */}
      {progress < 50 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
            <div className="flex items-center space-x-3">
              <LoadingSpinner size="md" />
              <span className="text-sm font-medium">Loading...</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
