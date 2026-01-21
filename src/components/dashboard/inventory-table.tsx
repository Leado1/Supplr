"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AIStatusBadge } from "@/components/ai";
import type { ItemWithStatus } from "@/types/inventory";
import type { ItemWithAIStatus } from "@/lib/inventory-status";
import { getStatusBadgeVariant, getStatusLabel } from "@/lib/inventory-utils";

interface InventoryTableProps {
  items: (ItemWithStatus | ItemWithAIStatus)[];
  selectedIds?: Set<string>;
  onEditItem?: (item: ItemWithStatus | ItemWithAIStatus) => void;
  onDeleteItem?: (item: ItemWithStatus | ItemWithAIStatus) => void;
  onQuantityChange?: (item: ItemWithStatus | ItemWithAIStatus, newQuantity: number) => void;
  onSelectionChange?: (itemId: string, isSelected: boolean) => void;
  onSelectAll?: (isSelected: boolean) => void;
  onAddItem?: () => void;
  showAIFeatures?: boolean;
}

export function InventoryTable({
  items,
  selectedIds = new Set(),
  onEditItem,
  onDeleteItem,
  onQuantityChange,
  onSelectionChange,
  onSelectAll,
  onAddItem,
  showAIFeatures = false,
}: InventoryTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const getDaysUntilExpiration = (expirationDate: Date) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Handle "Select All" checkbox logic
  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const someSelected = items.some((item) => selectedIds.has(item.id));

  const handleSelectAllChange = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked);
    }
  };

  const handleItemSelectionChange = (itemId: string, checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(itemId, checked);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <svg
            className="h-6 w-6 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold">No inventory items found</h3>
        <p className="text-muted-foreground mb-4">
          Get started by adding your first inventory item.
        </p>
        <Button onClick={onAddItem}>Add First Item</Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              {onSelectAll && (
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAllChange}
                  aria-label="Select all items"
                  className={
                    someSelected && !allSelected
                      ? "data-[state=checked]:bg-blue-600"
                      : ""
                  }
                />
              )}
            </TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit Cost</TableHead>
            <TableHead>Total Value</TableHead>
            <TableHead>Expiration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const daysUntilExpiration = getDaysUntilExpiration(
              item.expirationDate
            );
            const totalValue = Number(item.unitCost) * item.quantity;

            return (
              <TableRow
                key={item.id}
                className={selectedIds.has(item.id) ? "bg-blue-50" : ""}
              >
                <TableCell>
                  {onSelectionChange && (
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={(checked) =>
                        handleItemSelectionChange(item.id, checked as boolean)
                      }
                      aria-label={`Select ${item.name}`}
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    {item.reorderThreshold &&
                      item.quantity <= item.reorderThreshold && (
                        <div className="text-xs text-orange-600">
                          Below reorder threshold ({item.reorderThreshold})
                        </div>
                      )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground font-mono text-sm">
                    {item.sku || "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.category.name}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {onQuantityChange && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onQuantityChange(item, Math.max(0, item.quantity - 1))
                        }
                        className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-700"
                        disabled={item.quantity <= 0}
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 12H4"
                          />
                        </svg>
                      </Button>
                    )}
                    <span
                      className={`font-medium min-w-[2rem] text-center ${item.quantity <= item.reorderThreshold ? "text-orange-600" : ""}`}
                    >
                      {item.quantity}
                    </span>
                    {onQuantityChange && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onQuantityChange(item, item.quantity + 1)
                        }
                        className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-700"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(Number(item.unitCost))}</TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(totalValue)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div
                      className={`text-sm ${daysUntilExpiration < 0 ? "text-red-600" : daysUntilExpiration <= 30 ? "text-yellow-600" : ""}`}
                    >
                      {formatDate(item.expirationDate)}
                    </div>
                    {daysUntilExpiration >= 0 ? (
                      <div className="text-xs text-muted-foreground">
                        {daysUntilExpiration} days left
                      </div>
                    ) : (
                      <div className="text-xs text-red-600">
                        {Math.abs(daysUntilExpiration)} days expired
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {showAIFeatures && 'aiStatus' in item && item.aiStatus ? (
                    <div className="flex flex-col gap-1">
                      <AIStatusBadge
                        status={item.aiStatus}
                        confidence={item.aiInsights?.confidence}
                        aiInsights={item.aiInsights}
                        showDetails={true}
                      />
                      {item.status !== item.aiStatus && (
                        <Badge
                          variant={getStatusBadgeVariant(item.status)}
                          className="text-xs opacity-75"
                        >
                          {getStatusLabel(item.status)}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <Badge variant={getStatusBadgeVariant(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {onEditItem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditItem(item)}
                        className="h-8 w-8 p-0"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </Button>
                    )}
                    {onDeleteItem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteItem(item)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
