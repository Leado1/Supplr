"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuantityUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  selectedCount: number;
  currentQuantity?: number;
  isLoading?: boolean;
}

export function QuantityUpdateModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  currentQuantity,
  isLoading = false,
}: QuantityUpdateModalProps) {
  const [quantity, setQuantity] = useState(currentQuantity?.toString() || "");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numQuantity = parseInt(quantity);

    if (isNaN(numQuantity) || numQuantity < 0) {
      setError("Please enter a valid quantity (0 or greater)");
      return;
    }

    setError("");
    onConfirm(numQuantity);
  };

  const handleClose = () => {
    setQuantity("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Quantity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Enter new quantity for {selectedCount} selected item{selectedCount !== 1 ? 's' : ''}:
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError("");
              }}
              placeholder="Enter quantity..."
              disabled={isLoading}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !quantity.trim()}>
              {isLoading ? "Updating..." : "Update Quantity"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}