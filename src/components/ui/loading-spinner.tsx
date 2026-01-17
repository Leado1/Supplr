"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  color = "hsl(var(--foreground))",
  className
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };

  const sizeValues = {
    sm: "16px",
    md: "25px",
    lg: "32px",
    xl: "48px"
  };

  return (
    <div
      className={cn("chaotic-orbit", sizeClasses[size], className)}
      style={{
        "--uib-size": sizeValues[size],
        "--uib-speed": "1.5s",
        "--uib-color": color
      } as React.CSSProperties}
    />
  );
}

// Centered loading component for full page/section loading
export function LoadingScreen({
  message = "Loading...",
  size = "lg",
  className
}: {
  message?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[200px] space-y-4", className)}>
      <LoadingSpinner size={size} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// Inline loading for buttons and smaller components
export function InlineLoading({
  size = "sm",
  className
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <LoadingSpinner
      size={size}
      className={cn("inline-block", className)}
    />
  );
}