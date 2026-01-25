"use client";

import * as React from "react";
import Image from "next/image";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface LayeredDashboardProps {
  className?: string;
}

export function LayeredDashboard({ className }: LayeredDashboardProps) {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const springX = useSpring(pointerX, {
    stiffness: 140,
    damping: 18,
    mass: 0.4,
  });
  const springY = useSpring(pointerY, {
    stiffness: 140,
    damping: 18,
    mass: 0.4,
  });

  const rotateX = useTransform(springY, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-16, 16]);
  const glowX = useTransform(springX, [-0.5, 0.5], ["25%", "75%"]);
  const glowY = useTransform(springY, [-0.5, 0.5], ["20%", "80%"]);
  const highlight = useMotionTemplate`radial-gradient(800px circle at ${glowX} ${glowY}, rgba(148,163,184,0.25), transparent 70%)`;

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    pointerX.set(x);
    pointerY.set(y);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div
      className={cn(
        "relative mx-auto w-full aspect-[1803/894]",
        className,
      )}
      style={{ perspective: "2400px" }}
    >
      <motion.div
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative h-full w-full"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        <motion.div
          className="relative h-full w-full"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Dashboard Image */}
          <div className="relative h-full w-full">
            <Image
              src="/images/dashboard.png?v=4"
              alt="Supplr dashboard preview"
              width={1803}
              height={894}
              className="h-full w-full object-contain rounded-[40px] shadow-[0_50px_120px_-80px_rgba(15,23,42,0.55)]"
              style={{
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)'
              }}
              priority
              unoptimized
            />
          </div>

          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 z-40 rounded-[40px] opacity-60 pointer-events-none"
            style={{ background: highlight }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
