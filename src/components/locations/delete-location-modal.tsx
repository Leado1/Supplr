"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

interface Location {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone: string;
  currency: string;
  isActive: boolean;
}

interface DeleteLocationModalProps {
  location: Location;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteLocationModal({
  location,
  isOpen,
  onClose,
  onSuccess,
}: DeleteLocationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const isConfirmationValid = confirmationText === location.name;

  const handleDelete = async () => {
    if (!isConfirmationValid) {
      toast.error("Please type the location name to confirm deletion");
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/locations/${location.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Location deleted successfully");
        onSuccess();
      } else {
        toast.error(data.error || "Failed to delete location");
      }
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationText("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Delete Location</span>
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            location
            <strong> {location.name}</strong> and remove it from your
            organization.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Before deleting this location, make sure:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>All inventory items have been moved to other locations</li>
              <li>No active operations depend on this location</li>
              <li>You have backed up any important location data</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation" className="select-text cursor-text">
              Type{" "}
              <strong className="select-text">{location.name}</strong> to
              confirm deletion:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={location.name}
              disabled={isDeleting}
            />
          </div>

          {location.address && (
            <div className="rounded-lg bg-muted p-3">
              <h4 className="font-medium text-sm mb-1">Location Details:</h4>
              <p className="text-sm text-muted-foreground">
                {location.address}
              </p>
              {location.phone && (
                <p className="text-sm text-muted-foreground">
                  Phone: {location.phone}
                </p>
              )}
              {location.email && (
                <p className="text-sm text-muted-foreground">
                  Email: {location.email}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmationValid || isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
