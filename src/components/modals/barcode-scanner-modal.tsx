"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Scan,
  CheckCircle,
  XCircle,
  Plus,
  Package,
  Loader2,
  AlertTriangle,
  Zap,
  Minus,
  ShoppingCart,
} from "lucide-react";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemScanned?: (item: any, mode: "add" | "remove") => void;
  onNewItemRequested?: (barcode: string) => void;
  mode?: "add" | "remove";
}

interface ScannedItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  category: {
    name: string;
  };
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onItemScanned,
  onNewItemRequested,
  mode = "add",
}: BarcodeScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [foundItem, setFoundItem] = useState<ScannedItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanBuffer, setScanBuffer] = useState("");
  const [lastScanTime, setLastScanTime] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsScanning(true);
      setScannedCode("");
      setFoundItem(null);
      setError(null);
      setSuccessMessage(null);
      setScanBuffer("");

      // Focus the hidden input to capture scanner data
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !isScanning) return;

      const currentTime = Date.now();

      // Detect if this is likely a barcode scanner (rapid key presses)
      const timeSinceLastScan = currentTime - lastScanTime;
      const isRapidInput = timeSinceLastScan < 50; // Scanner inputs are very fast

      if (e.key === "Enter") {
        e.preventDefault();
        if (scanBuffer.length > 0) {
          handleBarcodeScanned(scanBuffer);
          setScanBuffer("");
        }
        return;
      }

      // Accumulate characters for potential barcode
      if (e.key.length === 1) {
        e.preventDefault();
        setLastScanTime(currentTime);

        // Clear buffer if too much time passed (indicates manual typing)
        if (!isRapidInput && timeSinceLastScan > 100) {
          setScanBuffer(e.key);
        } else {
          setScanBuffer((prev) => prev + e.key);
        }

        // Clear buffer timeout
        if (bufferTimeoutRef.current) {
          clearTimeout(bufferTimeoutRef.current);
        }

        // Set timeout to process buffer if no more input
        bufferTimeoutRef.current = setTimeout(() => {
          if (scanBuffer + e.key) {
            handleBarcodeScanned(scanBuffer + e.key);
            setScanBuffer("");
          }
        }, 100);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        if (bufferTimeoutRef.current) {
          clearTimeout(bufferTimeoutRef.current);
        }
      };
    }
  }, [isOpen, isScanning, scanBuffer, lastScanTime]);

  const handleBarcodeScanned = async (barcode: string) => {
    if (!barcode || barcode.length < 4) return; // Ignore short inputs

    setScannedCode(barcode);
    setError(null);
    setIsLookingUp(true);
    setFoundItem(null);

    try {
      // Look up item by barcode/SKU
      const response = await fetch(
        `/api/items/lookup?barcode=${encodeURIComponent(barcode)}`
      );

      if (response.ok) {
        const item = await response.json();
        setFoundItem(item);
        setSuccessMessage(`Found: ${item.name}`);

        // Notify parent component with the current mode
        if (onItemScanned) {
          onItemScanned(item, mode);
        }

        // Auto-close after successful scan
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else if (response.status === 404) {
        setError(
          `Product with barcode "${barcode}" not found in your inventory.`
        );
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to lookup barcode");
      }
    } catch (error) {
      console.error("Barcode lookup error:", error);
      setError("Failed to lookup barcode. Please try again.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleManualEntry = () => {
    const barcode = scannedCode.trim();
    if (barcode) {
      handleBarcodeScanned(barcode);
    }
  };

  const handleAddNewProduct = () => {
    if (scannedCode && onNewItemRequested) {
      onNewItemRequested(scannedCode);
      handleClose();
    }
  };

  const handleClose = () => {
    setIsScanning(false);
    setScannedCode("");
    setFoundItem(null);
    setError(null);
    setSuccessMessage(null);
    setScanBuffer("");
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {mode === "add" ? (
              <Plus className="h-5 w-5 text-green-600" />
            ) : (
              <Minus className="h-5 w-5 text-red-600" />
            )}
            <span>
              {mode === "add" ? "Add Inventory" : "Remove Inventory"} - Barcode
              Scanner
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scanner Status */}
          <div className="text-center space-y-4">
            {isScanning && !isLookingUp && !foundItem && !error && (
              <div className="space-y-3">
                <div className="relative">
                  <div className="mx-auto w-16 h-16 border-4 border-primary border-dashed rounded-lg flex items-center justify-center animate-pulse">
                    <Scan className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-green-600">Scanner Ready</p>
                  <p className="text-sm text-muted-foreground">
                    {mode === "add"
                      ? "Scan a barcode to add inventory"
                      : "Scan a barcode to remove inventory"}
                  </p>
                </div>
              </div>
            )}

            {isLookingUp && (
              <div className="space-y-3">
                <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                <div>
                  <p className="font-medium">Looking up barcode...</p>
                  <p className="text-sm text-muted-foreground">{scannedCode}</p>
                </div>
              </div>
            )}

            {foundItem && (
              <div className="space-y-3">
                {mode === "add" ? (
                  <Plus className="h-12 w-12 mx-auto text-green-600" />
                ) : (
                  <Minus className="h-12 w-12 mx-auto text-red-600" />
                )}
                <div className="space-y-2">
                  <p
                    className={`font-medium ${mode === "add" ? "text-green-600" : "text-red-600"}`}
                  >
                    {mode === "add"
                      ? "Item Found - Ready to Add!"
                      : "Item Found - Ready to Remove!"}
                  </p>
                  <div
                    className={`${mode === "add" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border rounded-lg p-3 space-y-2`}
                  >
                    <h3 className="font-semibold">{foundItem.name}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span>SKU: {foundItem.sku}</span>
                      <Badge variant="secondary">
                        {foundItem.category.name}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Current quantity: {foundItem.quantity}
                    </div>
                    {mode === "remove" && foundItem.quantity === 0 && (
                      <div className="text-sm text-red-600 font-medium">
                        ⚠️ Warning: Item is already at 0 quantity
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="space-y-3">
                <XCircle className="h-12 w-12 mx-auto text-red-600" />
                <div className="space-y-2">
                  <p className="font-medium text-red-600">Not Found</p>
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}

            {successMessage && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Manual Entry */}
          <div className="space-y-3">
            <Label htmlFor="barcode-input">Manual Barcode Entry</Label>
            <div className="flex space-x-2">
              <Input
                id="barcode-input"
                ref={inputRef}
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                placeholder="Enter or scan barcode..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleManualEntry();
                  }
                }}
              />
              <Button
                onClick={handleManualEntry}
                disabled={!scannedCode.trim() || isLookingUp}
                size="sm"
              >
                <Zap className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {error && scannedCode && mode === "add" && (
              <Button
                onClick={handleAddNewProduct}
                className="flex-1"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Product
              </Button>
            )}
            <Button
              onClick={handleClose}
              variant={foundItem ? "default" : "outline"}
              className="flex-1"
            >
              {foundItem ? "Done" : "Cancel"}
            </Button>
          </div>

          {/* Scanner Tips */}
          <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
            <p className="font-medium flex items-center">
              <Package className="h-3 w-3 mr-1" />
              Scanner Tips:
            </p>
            <ul className="space-y-1 ml-4">
              <li>• Connect any USB barcode scanner</li>
              <li>• Point scanner at barcode and trigger scan</li>
              <li>• Most scanners work automatically without setup</li>
              <li>• Manual entry also works for troubleshooting</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
