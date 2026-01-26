"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface HowItWorksModalProps {
  className?: string;
}

export function HowItWorksModal({ className }: HowItWorksModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 text-muted-foreground hover:text-foreground",
            className
          )}
        >
          <Info className="h-4 w-4 mr-1" />
          How this works
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How AI Insights work</DialogTitle>
          <DialogDescription>
            We keep this simple so you can act quickly.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="text-foreground">
            1. We look at usage, purchases, and upcoming expirations.
          </li>
          <li className="text-foreground">
            2. We predict likely stockouts and waste windows.
          </li>
          <li className="text-foreground">
            3. We suggest next steps you can do immediately.
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export default HowItWorksModal;
