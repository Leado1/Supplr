"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, FileText, Download, Loader2 } from "lucide-react";

interface ExportDropdownProps {
  onExportPDF: () => Promise<void> | void;
  onExportCSV: () => Promise<void> | void;
  disabled?: boolean;
  variant?: "default" | "outline";
}

export function ExportDropdown({
  onExportPDF,
  onExportCSV,
  disabled = false,
  variant = "outline"
}: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"pdf" | "csv" | null>(null);

  const handleExport = async (type: "pdf" | "csv") => {
    setIsExporting(true);
    setExportType(type);

    try {
      if (type === "pdf") {
        await onExportPDF();
      } else {
        await onExportCSV();
      }
    } catch (error) {
      console.error(`${type.toUpperCase()} export error:`, error);
      alert(`Failed to export ${type.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  if (isExporting) {
    return (
      <Button variant={variant} disabled className="min-w-32">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Exporting {exportType?.toUpperCase()}...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} disabled={disabled} className="min-w-32">
          <Download className="mr-2 h-4 w-4" />
          Export
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleExport("pdf")}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4 text-red-500" />
          <div className="flex flex-col items-start">
            <span className="font-medium">Export as PDF</span>
            <span className="text-xs text-muted-foreground">
              Professional report format
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("csv")}
          className="cursor-pointer"
        >
          <svg
            className="mr-2 h-4 w-4 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <div className="flex flex-col items-start">
            <span className="font-medium">Export as CSV</span>
            <span className="text-xs text-muted-foreground">
              Spreadsheet compatible data
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}