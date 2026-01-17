"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Info,
} from "lucide-react";
import Link from "next/link";

interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  categories: string[];
}

export default function ImportPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = [".csv", ".xlsx", ".xls"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!validTypes.includes(fileExtension)) {
      alert("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      return;
    }

    setIsUploading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/inventory/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult(result);
      } else {
        alert(`Import failed: ${result.message || "Please try again."}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,sku,category,quantity,unitCost,expirationDate,reorderThreshold
Sample Product A,SKU001,Medical Supplies,10,25.99,2024-12-31,5
Sample Product B,SKU002,Office Supplies,20,15.50,2025-06-15,10`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "supplr-inventory-template.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/inventory">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Import Inventory
          </h1>
          <p className="text-muted-foreground">
            Upload a CSV or Excel file to bulk import your inventory data
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload File</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
                  <div>
                    <p className="font-medium">Processing your file...</p>
                    <p className="text-sm text-muted-foreground">
                      This may take a moment for large files
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      Drag and drop your file here, or{" "}
                      <button
                        type="button"
                        className="text-primary underline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Supports CSV, XLSX, and XLS files
                    </p>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Select File
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Template Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Download Template</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Use our CSV template to ensure your data imports correctly. The
              template includes all required columns and sample data.
            </p>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Required Columns:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="w-3 h-3 p-0 rounded-full bg-red-100"
                  />
                  <span>name</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="w-3 h-3 p-0 rounded-full bg-red-100"
                  />
                  <span>category</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="w-3 h-3 p-0 rounded-full bg-red-100"
                  />
                  <span>quantity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="w-3 h-3 p-0 rounded-full bg-red-100"
                  />
                  <span>unitCost</span>
                </div>
              </div>

              <h4 className="font-medium text-sm mt-4">Optional Columns:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="w-3 h-3 p-0 rounded-full bg-gray-100"
                  />
                  <span>sku</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="w-3 h-3 p-0 rounded-full bg-gray-100"
                  />
                  <span>expirationDate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="w-3 h-3 p-0 rounded-full bg-gray-100"
                  />
                  <span>reorderThreshold</span>
                </div>
              </div>
            </div>

            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Import Result */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>Import Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.importedCount}
                </div>
                <div className="text-sm text-muted-foreground">Imported</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {importResult.skippedCount}
                </div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.errorCount}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>

            {importResult.importedCount > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Successfully imported {importResult.importedCount} items to
                  your inventory.
                  {importResult.categories.length > 0 && (
                    <span>
                      {" "}
                      New categories created:{" "}
                      {importResult.categories.join(", ")}.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Errors */}
            {importResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Import Errors
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {importResult.errors.slice(0, 10).map((error, index) => (
                    <Alert key={index} className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-700 text-sm">
                        <strong>Row {error.row}:</strong> {error.field} -{" "}
                        {error.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                  {importResult.errors.length > 10 && (
                    <p className="text-sm text-muted-foreground">
                      ... and {importResult.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Link href="/inventory">
                <Button className="flex-1">View Inventory</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setImportResult(null)}
                className="flex-1"
              >
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Import Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Data Format</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Dates should be in YYYY-MM-DD format</li>
                <li>• Numbers should not contain currency symbols</li>
                <li>• Categories will be created if they don't exist</li>
                <li>• SKU must be unique if provided</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Best Practices</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Test with a small file first</li>
                <li>• Backup your data before importing</li>
                <li>• Review errors and fix in original file</li>
                <li>• Use consistent category names</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
