"use client";

import * as React from "react";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  value: File[];
  onValueChange: (files: File[]) => void;
  accept?: string | string[];
  maxFiles?: number;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  description?: string;
  helperText?: string;
  buttonLabel?: string;
  loadingTitle?: string;
  loadingDescription?: string;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function FileUpload({
  value,
  onValueChange,
  accept,
  maxFiles = 1,
  disabled = false,
  loading = false,
  title = "Drag and drop your file here",
  description = "or click to browse",
  helperText,
  buttonLabel = "Browse files",
  loadingTitle = "Processing your file...",
  loadingDescription = "This may take a moment for large files",
  className,
  ...props
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const isDisabled = disabled || loading;
  const inputAccept = Array.isArray(accept) ? accept.join(",") : accept;

  const handleFiles = React.useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      const limited = maxFiles ? files.slice(0, maxFiles) : files;
      onValueChange(limited);
    },
    [maxFiles, onValueChange]
  );

  const handleDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isDisabled) return;
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isDisabled) return;
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleBrowse = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    if (isDisabled) return;
    inputRef.current?.click();
  };

  const handleRemove = (event: React.MouseEvent, index: number) => {
    event.stopPropagation();
    const nextFiles = value.filter((_, fileIndex) => fileIndex !== index);
    onValueChange(nextFiles);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleBrowse();
    }
  };

  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div
        className={cn(
          "relative rounded-lg border border-dashed p-6 transition-colors",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isDisabled && "pointer-events-none opacity-60"
        )}
        onClick={() => handleBrowse()}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-disabled={isDisabled}
      >
        <input
          ref={inputRef}
          type="file"
          accept={inputAccept}
          className="hidden"
          disabled={isDisabled}
          onChange={handleInputChange}
        />

        <div className="flex flex-col items-center gap-3 text-center">
          {loading ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div>
                <p className="font-medium">{loadingTitle}</p>
                <p className="text-sm text-muted-foreground">
                  {loadingDescription}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <UploadCloud className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBrowse}
                disabled={isDisabled}
              >
                {buttonLabel}
              </Button>
              {helperText ? (
                <p className="text-xs text-muted-foreground">{helperText}</p>
              ) : null}
            </>
          )}
        </div>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(event) => handleRemove(event, index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
