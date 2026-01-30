"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function RefreshButton() {
  return (
    <Button onClick={() => window.location.reload()} variant="default">
      <RefreshCw className="w-4 h-4 mr-2" />
      Check Again
    </Button>
  );
}