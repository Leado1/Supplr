"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@prisma/client";
import type { InventoryStatus } from "@/types/inventory";

interface FiltersProps {
  categories: Category[];
  onSearchChange: (search: string) => void;
  onStatusFilter: (status: InventoryStatus | "all") => void;
  onCategoryFilter: (categoryId: string | "all") => void;
  onAddItem?: () => void;
  searchValue?: string;
  statusFilter?: InventoryStatus | "all";
  categoryFilter?: string | "all";
}

export function Filters({
  categories,
  onSearchChange,
  onStatusFilter,
  onCategoryFilter,
  onAddItem,
  searchValue = "",
  statusFilter = "all",
  categoryFilter = "all",
}: FiltersProps) {
  const statusOptions = [
    { value: "all", label: "All Items" },
    { value: "ok", label: "In Stock" },
    { value: "low_stock", label: "Low Stock" },
    { value: "expiring_soon", label: "Expiring Soon" },
    { value: "expired", label: "Expired" },
  ];

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex flex-1 flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
        {/* Search */}
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              placeholder="Search items, SKUs, or categories..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="min-w-[160px]">
          <Select
            value={statusFilter}
            onValueChange={(value) => onStatusFilter(value as InventoryStatus | "all")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="min-w-[160px]">
          <Select
            value={categoryFilter}
            onValueChange={(value) => onCategoryFilter(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Add Item Button */}
      {onAddItem && (
        <div className="flex space-x-2">
          <Button onClick={onAddItem} className="whitespace-nowrap">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </Button>
        </div>
      )}
    </div>
  );
}