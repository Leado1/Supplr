"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@prisma/client";
import type { ItemWithStatus } from "@/types/inventory";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  categories: Category[];
  editItem?: ItemWithStatus | null;
  defaultSku?: string;
}

interface FormData {
  name: string;
  sku: string;
  categoryId: string;
  quantity: string;
  unitCost: string;
  expirationDate: string;
  reorderThreshold: string;
}

export function ItemModal({
  isOpen,
  onClose,
  onSave,
  categories,
  editItem,
  defaultSku,
}: ItemModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    sku: "",
    categoryId: "",
    quantity: "",
    unitCost: "",
    expirationDate: "",
    reorderThreshold: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or edit item changes
  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setFormData({
          name: editItem.name,
          sku: editItem.sku || "",
          categoryId: editItem.categoryId,
          quantity: editItem.quantity.toString(),
          unitCost: editItem.unitCost.toString(),
          expirationDate: new Date(editItem.expirationDate)
            .toISOString()
            .split("T")[0],
          reorderThreshold: editItem.reorderThreshold.toString(),
        });
      } else {
        // Set default expiration date to 1 year from today
        const defaultExpiration = new Date();
        defaultExpiration.setFullYear(defaultExpiration.getFullYear() + 1);

        setFormData({
          name: "",
          sku: defaultSku || "",
          categoryId: "",
          quantity: "",
          unitCost: "",
          expirationDate: defaultExpiration.toISOString().split("T")[0],
          reorderThreshold: "5",
        });
      }
      setErrors({});
    }
  }, [isOpen, editItem, defaultSku]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Category is required";
    }

    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      newErrors.quantity = "Valid quantity is required";
    }

    if (!formData.unitCost || parseFloat(formData.unitCost) < 0) {
      newErrors.unitCost = "Valid unit cost is required";
    }

    if (!formData.expirationDate) {
      newErrors.expirationDate = "Expiration date is required";
    } else {
      const expDate = new Date(formData.expirationDate);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      if (expDate <= yesterday) {
        newErrors.expirationDate = "Expiration date cannot be in the past";
      }
    }

    if (!formData.reorderThreshold || parseInt(formData.reorderThreshold) < 0) {
      newErrors.reorderThreshold = "Valid reorder threshold is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim() || null,
        categoryId: formData.categoryId,
        quantity: parseInt(formData.quantity),
        unitCost: parseFloat(formData.unitCost),
        expirationDate: new Date(formData.expirationDate).toISOString(),
        reorderThreshold: parseInt(formData.reorderThreshold),
      };

      const response = await fetch(
        editItem ? `/api/items/${editItem.id}` : "/api/items",
        {
          method: editItem ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        onSave();
      } else {
        const errorData = await response.json();

        // Handle subscription-related errors with better UX
        if (
          errorData.error === "TRIAL_EXPIRED" ||
          errorData.error === "SUBSCRIPTION_LIMIT_EXCEEDED" ||
          errorData.error === "SUBSCRIPTION_INACTIVE"
        ) {
          const userConfirmed = confirm(
            `${errorData.message}\n\nWould you like to view our pricing plans to upgrade?`
          );
          if (userConfirmed) {
            window.open("/pricing", "_blank");
          }
        } else {
          // Handle validation errors
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const validationErrors: Record<string, string> = {};
            errorData.errors.forEach((error: any) => {
              if (error.path && error.path.length > 0) {
                const fieldName = error.path[0];
                validationErrors[fieldName] = error.message;
              }
            });
            setErrors(validationErrors);
          } else {
            alert(errorData.message || "Failed to save item");
          }
        }
      }
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Error saving item");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editItem ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Botox 100 Units"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU (Optional)</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => handleInputChange("sku", e.target.value)}
              placeholder="e.g., BTX-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => handleInputChange("categoryId", value)}
            >
              <SelectTrigger
                className={errors.categoryId ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-red-500">{errors.categoryId}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder="0"
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500">{errors.quantity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitCost">Unit Cost ($) *</Label>
              <Input
                id="unitCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitCost}
                onChange={(e) => handleInputChange("unitCost", e.target.value)}
                placeholder="0.00"
                className={errors.unitCost ? "border-red-500" : ""}
              />
              {errors.unitCost && (
                <p className="text-sm text-red-500">{errors.unitCost}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expirationDate">Expiration Date *</Label>
            <Input
              id="expirationDate"
              type="date"
              value={formData.expirationDate}
              onChange={(e) =>
                handleInputChange("expirationDate", e.target.value)
              }
              className={errors.expirationDate ? "border-red-500" : ""}
            />
            {errors.expirationDate && (
              <p className="text-sm text-red-500">{errors.expirationDate}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reorderThreshold">Reorder Threshold *</Label>
            <Input
              id="reorderThreshold"
              type="number"
              min="0"
              value={formData.reorderThreshold}
              onChange={(e) =>
                handleInputChange("reorderThreshold", e.target.value)
              }
              placeholder="5"
              className={errors.reorderThreshold ? "border-red-500" : ""}
            />
            <p className="text-sm text-muted-foreground">
              Alert when quantity falls below this level
            </p>
            {errors.reorderThreshold && (
              <p className="text-sm text-red-500">{errors.reorderThreshold}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editItem ? "Update Item" : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
