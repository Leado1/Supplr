"use client";

import { cn } from "@/lib/utils";

interface ChaoticSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  className?: string;
}

export function ChaoticSpinner({
  size = "md",
  color = "hsl(var(--foreground))",
  className
}: ChaoticSpinnerProps) {
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
    <div className={cn("relative", sizeClasses[size], className)}>
      <div
        className="chaotic-orbit"
        style={{
          "--uib-size": sizeValues[size],
          "--uib-speed": "1.5s",
          "--uib-color": color,
          width: "100%",
          height: "100%"
        } as React.CSSProperties}
      />
    </div>
  );
}