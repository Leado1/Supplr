"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function RouteLoadingInner() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsLoading(true);
    setProgress(10);

    // More visible loading with longer duration
    const progressTimer = setTimeout(() => setProgress(40), 150);
    const progressTimer2 = setTimeout(() => setProgress(70), 350);
    const progressTimer3 = setTimeout(() => setProgress(95), 650);

    // Complete loading with minimum visible duration
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 300);
    }, 1000); // Minimum 1 second to make it visible

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
      clearTimeout(completeTimer);
    };
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <>
      {/* Top loading bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-muted/30">
          <div
            className="h-full bg-gradient-to-r from-primary via-blue-500 to-primary transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              boxShadow:
                "0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.3)",
              filter: "brightness(1.2)",
            }}
          />
        </div>
      </div>

      {/* Loading indicator in top-right */}
      {isLoading && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in duration-200">
          <div className="bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border">
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className="text-xs font-medium">Loading</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function RouteLoading() {
  return (
    <Suspense fallback={null}>
      <RouteLoadingInner />
    </Suspense>
  );
}
