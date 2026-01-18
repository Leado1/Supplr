"use client";

import { cn } from "@/lib/utils";

interface WorkingChaoticSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  className?: string;
}

export function WorkingChaoticSpinner({
  size = "md",
  color = "black",
  className
}: WorkingChaoticSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };

  const sizeValues = {
    sm: 16,
    md: 25,
    lg: 32,
    xl: 48
  };

  const spinnerSize = sizeValues[size];

  return (
    <div className={cn("relative inline-block", sizeClasses[size], className)}>
      {/* Inline CSS version of chaotic orbit */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: `${spinnerSize}px`,
          width: `${spinnerSize}px`,
          animation: "chaoticRotate 2.5s infinite linear"
        }}
      >
        <div
          style={{
            content: '""',
            position: "absolute",
            height: `${spinnerSize * 0.6}px`,
            width: `${spinnerSize * 0.6}px`,
            borderRadius: "50%",
            backgroundColor: color,
            animation: "chaoticOrbit1 1.5s linear infinite"
          }}
        />
        <div
          style={{
            content: '""',
            position: "absolute",
            height: `${spinnerSize * 0.6}px`,
            width: `${spinnerSize * 0.6}px`,
            borderRadius: "50%",
            backgroundColor: color,
            animation: "chaoticOrbit2 1.5s linear infinite",
            animationDelay: "-0.75s"
          }}
        />
      </div>

      {/* Inline keyframes */}
      <style jsx>{`
        @keyframes chaoticRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes chaoticOrbit1 {
          0% { transform: translate(${spinnerSize * 0.5}px) scale(0.737); opacity: 0.65; }
          5% { transform: translate(${spinnerSize * 0.4}px) scale(0.684); opacity: 0.58; }
          10% { transform: translate(${spinnerSize * 0.3}px) scale(0.632); opacity: 0.51; }
          15% { transform: translate(${spinnerSize * 0.2}px) scale(0.579); opacity: 0.44; }
          20% { transform: translate(${spinnerSize * 0.1}px) scale(0.526); opacity: 0.37; }
          25% { transform: translate(0px) scale(0.474); opacity: 0.3; }
          30% { transform: translate(${spinnerSize * -0.1}px) scale(0.526); opacity: 0.37; }
          35% { transform: translate(${spinnerSize * -0.2}px) scale(0.579); opacity: 0.44; }
          40% { transform: translate(${spinnerSize * -0.3}px) scale(0.632); opacity: 0.51; }
          45% { transform: translate(${spinnerSize * -0.4}px) scale(0.684); opacity: 0.58; }
          50% { transform: translate(${spinnerSize * -0.5}px) scale(0.737); opacity: 0.65; }
          55% { transform: translate(${spinnerSize * -0.4}px) scale(0.789); opacity: 0.72; }
          60% { transform: translate(${spinnerSize * -0.3}px) scale(0.842); opacity: 0.79; }
          65% { transform: translate(${spinnerSize * -0.2}px) scale(0.895); opacity: 0.86; }
          70% { transform: translate(${spinnerSize * -0.1}px) scale(0.947); opacity: 0.93; }
          75% { transform: translate(0px) scale(1); opacity: 1; }
          80% { transform: translate(${spinnerSize * 0.1}px) scale(0.947); opacity: 0.93; }
          85% { transform: translate(${spinnerSize * 0.2}px) scale(0.895); opacity: 0.86; }
          90% { transform: translate(${spinnerSize * 0.3}px) scale(0.842); opacity: 0.79; }
          95% { transform: translate(${spinnerSize * 0.4}px) scale(0.789); opacity: 0.72; }
          100% { transform: translate(${spinnerSize * 0.5}px) scale(0.737); opacity: 0.65; }
        }

        @keyframes chaoticOrbit2 {
          0% { transform: translate(${spinnerSize * -0.5}px) scale(0.737); opacity: 0.65; }
          5% { transform: translate(${spinnerSize * -0.4}px) scale(0.684); opacity: 0.58; }
          10% { transform: translate(${spinnerSize * -0.3}px) scale(0.632); opacity: 0.51; }
          15% { transform: translate(${spinnerSize * -0.2}px) scale(0.579); opacity: 0.44; }
          20% { transform: translate(${spinnerSize * -0.1}px) scale(0.526); opacity: 0.37; }
          25% { transform: translate(0px) scale(0.474); opacity: 0.3; }
          30% { transform: translate(${spinnerSize * 0.1}px) scale(0.526); opacity: 0.37; }
          35% { transform: translate(${spinnerSize * 0.2}px) scale(0.579); opacity: 0.44; }
          40% { transform: translate(${spinnerSize * 0.3}px) scale(0.632); opacity: 0.51; }
          45% { transform: translate(${spinnerSize * 0.4}px) scale(0.684); opacity: 0.58; }
          50% { transform: translate(${spinnerSize * 0.5}px) scale(0.737); opacity: 0.65; }
          55% { transform: translate(${spinnerSize * 0.4}px) scale(0.789); opacity: 0.72; }
          60% { transform: translate(${spinnerSize * 0.3}px) scale(0.842); opacity: 0.79; }
          65% { transform: translate(${spinnerSize * 0.2}px) scale(0.895); opacity: 0.86; }
          70% { transform: translate(${spinnerSize * 0.1}px) scale(0.947); opacity: 0.93; }
          75% { transform: translate(0px) scale(1); opacity: 1; }
          80% { transform: translate(${spinnerSize * -0.1}px) scale(0.947); opacity: 0.93; }
          85% { transform: translate(${spinnerSize * -0.2}px) scale(0.895); opacity: 0.86; }
          90% { transform: translate(${spinnerSize * -0.3}px) scale(0.842); opacity: 0.79; }
          95% { transform: translate(${spinnerSize * -0.4}px) scale(0.789); opacity: 0.72; }
          100% { transform: translate(${spinnerSize * -0.5}px) scale(0.737); opacity: 0.65; }
        }
      `}</style>
    </div>
  );
}