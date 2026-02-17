"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import dashboardImage from "../../../public/images/dashboard.png";
import sidebarImage from "../../../public/images/sidebar.png";

interface LayeredDashboardProps {
  className?: string;
}

export function LayeredDashboard({ className }: LayeredDashboardProps) {
  return (
    <div className={cn("relative mx-auto w-full", className)}>
      <div className="relative w-full">
        <Image
          src={dashboardImage}
          alt="Supplr dashboard preview"
          className="block h-auto w-full"
          priority
          unoptimized
        />

        <Image
          src={sidebarImage}
          alt="Supplr dashboard sidebar"
          className="absolute left-[-5%] top-[6%] hidden w-[18%] rounded-[26px] shadow-[0_30px_60px_rgba(36,20,74,0.35)] md:block"
          unoptimized
        />

        <Image
          src="/images/inventorydetails.png?v=2"
          alt="Supplr inventory details"
          width={555}
          height={384}
          className="absolute right-[-6%] top-[62%] hidden w-[26%] rounded-[22px] shadow-[0_30px_60px_rgba(36,20,74,0.35)] md:block"
          unoptimized
        />
      </div>
    </div>
  );
}
