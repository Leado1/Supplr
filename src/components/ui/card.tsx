import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "bg-card text-card-foreground flex flex-col rounded-lg border border-border",
  {
    variants: {
      variant: {
        default: "shadow-sm",
        glass:
          "bg-card/80 backdrop-blur-md border-border/50 shadow-lg rounded-xl",
        elevated: "shadow-md",
        interactive:
          "shadow-sm hover:shadow-md hover:border-border-strong transition-all cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof cardVariants> {
  /** Enable framer-motion hover animation (lift effect) */
  animate?: boolean;
}

/**
 * Card component with multiple visual variants
 *
 * @example
 * // Standard card
 * <Card variant="default">Content</Card>
 *
 * @example
 * // Marketing glass card
 * <Card variant="glass">Premium content</Card>
 *
 * @example
 * // Interactive card with hover lift
 * <Card variant="interactive" animate>Click me</Card>
 */
function Card({
  className,
  variant = "default",
  animate = false,
  ...props
}: CardProps) {
  // Use motion.div for interactive + animate
  if (animate && variant === "interactive") {
    return (
      <motion.div
        data-slot="card"
        data-variant={variant}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={cn(cardVariants({ variant, className }))}
        {...(props as HTMLMotionProps<"div">)}
      />
    );
  }

  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 p-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-sm font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-6 pt-0", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center p-6 pt-0 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};
