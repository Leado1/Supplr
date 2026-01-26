"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Search, Settings2 } from "lucide-react";
import type {
  InsightAutomationSettings,
  InsightFilterType,
  InsightFilters,
  InsightSortOption,
} from "./types";

interface InsightsFilterBarProps {
  filters: InsightFilters;
  onFiltersChange: (next: InsightFilters) => void;
  automationSettings: InsightAutomationSettings;
  onAutomationChange: (updates: Partial<InsightAutomationSettings>) => void;
}

const typeChips: Array<{ value: InsightFilterType; label: string }> = [
  { value: "all", label: "All" },
  { value: "restock", label: "Restock" },
  { value: "waste", label: "Prevent waste" },
  { value: "savings", label: "Savings" },
];

const sortOptions: Array<{ value: InsightSortOption; label: string }> = [
  { value: "priority", label: "Priority first" },
  { value: "savings", label: "Savings impact" },
  { value: "deadline", label: "Soonest deadline" },
];

export function InsightsFilterBar({
  filters,
  onFiltersChange,
  automationSettings,
  onAutomationChange,
}: InsightsFilterBarProps) {
  const updateFilters = (partial: Partial<InsightFilters>) =>
    onFiltersChange({ ...filters, ...partial });

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap gap-2">
        {typeChips.map((chip) => (
          <Button
            key={chip.value}
            type="button"
            variant={filters.type === chip.value ? "default" : "outline"}
            size="sm"
            className="h-8"
            onClick={() => updateFilters({ type: chip.value })}
          >
            {chip.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Select
            value={filters.priority}
            onValueChange={(value) =>
              updateFilters({ priority: value as InsightFilters["priority"] })
            }
          >
            <SelectTrigger className="h-9 w-full sm:w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) =>
              updateFilters({ status: value as InsightFilters["status"] })
            }
          >
            <SelectTrigger className="h-9 w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="snoozed">Snoozed</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(event) =>
                updateFilters({ search: event.target.value })
              }
              placeholder="Search item name..."
              className="h-9 pl-8"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={filters.sort}
            onValueChange={(value) =>
              updateFilters({ sort: value as InsightSortOption })
            }
          >
            <SelectTrigger className="h-9 w-full sm:w-[170px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Settings2 className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Automation</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => event.preventDefault()}
              className="flex items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Auto-create draft POs</p>
                <p className="text-xs text-muted-foreground">
                  {automationSettings.autoCreateDrafts ? "On" : "Off"}
                </p>
              </div>
              <Switch
                checked={automationSettings.autoCreateDrafts}
                onCheckedChange={(value) =>
                  onAutomationChange({ autoCreateDrafts: value })
                }
                aria-label="Toggle auto-create draft POs"
              />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => event.preventDefault()}
              className="flex items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Require approval</p>
                <p className="text-xs text-muted-foreground">
                  {automationSettings.requireApproval ? "On" : "Off"}
                </p>
              </div>
              <Switch
                checked={automationSettings.requireApproval}
                onCheckedChange={(value) =>
                  onAutomationChange({ requireApproval: value })
                }
                aria-label="Toggle draft PO approval"
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </div>
  );
}

export default InsightsFilterBar;
