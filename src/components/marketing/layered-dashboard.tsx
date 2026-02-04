"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LayeredDashboardProps {
  className?: string;
}

export function LayeredDashboard({ className }: LayeredDashboardProps) {
  return (
    <div className={cn("relative mx-auto w-full aspect-[1803/894]", className)}>
      <div className="relative h-full w-full">
        <div className="rounded-[42px] bg-gradient-to-br from-[#F3D6C6] via-[#D7C6F6] to-[#4B3CF7] p-[2px] shadow-[0_35px_90px_-60px_rgba(76,58,120,0.55)]">
          <div className="overflow-hidden rounded-[40px] bg-white">
            <Image
              src="/images/dashboard.png?v=5"
              alt="Supplr dashboard preview"
              width={1803}
              height={894}
              className="h-full w-full object-contain rounded-[40px]"
              priority
              unoptimized
            />
          </div>
        </div>

        <Image
          src="/images/sidebar.png"
          alt="Supplr dashboard sidebar"
          width={420}
          height={780}
          className="absolute left-[-5%] top-[6%] hidden w-[18%] rounded-[26px] shadow-[0_30px_60px_rgba(36,20,74,0.35)] md:block"
          unoptimized
        />

        <Image
          src="/images/inventorydetails.png"
          alt="Supplr inventory details"
          width={420}
          height={420}
          className="absolute right-[-6%] top-[62%] hidden w-[26%] rounded-[22px] shadow-[0_30px_60px_rgba(36,20,74,0.35)] md:block"
          unoptimized
        />
      </div>
    </div>
  );
}
