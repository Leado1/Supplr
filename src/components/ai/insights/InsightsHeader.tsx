"use client";

import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import type { DateRangeOption } from "./types";
import { HowItWorksModal } from "./HowItWorksModal";
import { LocationDropdown } from "@/components/location-dropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InsightsHeaderProps {
  dateRange: DateRangeOption;
  onDateRangeChange: (value: DateRangeOption) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdatedLabel?: string;
}

const dateRangeOptions: Array<{ value: DateRangeOption; label: string }> = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 180 days" },
  { value: "custom", label: "Custom range" },
];

export function InsightsHeader({
  dateRange,
  onDateRangeChange,
  onRefresh,
  isRefreshing,
  lastUpdatedLabel,
}: InsightsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Dashboard / AI Insights</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">AI Insights</h1>
          <HowItWorksModal />
        </div>
        <p className="text-sm text-muted-foreground">
          Clear next steps to reorder on time and avoid waste.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <LocationDropdown variant="compact" showIcon={false} />

        <Select
          value={dateRange}
          onValueChange={(value) => onDateRangeChange(value as DateRangeOption)}
        >
          <SelectTrigger className="h-9 w-full sm:w-[180px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            {dateRangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center justify-between gap-2">
          {lastUpdatedLabel && (
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdatedLabel}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InsightsHeader;
