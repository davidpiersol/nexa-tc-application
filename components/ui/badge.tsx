import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        success: "bg-status-success/15 text-status-success",
        warning: "bg-status-warning/15 text-status-warning",
        danger: "bg-status-danger/15 text-status-danger",
        navy: "bg-brand-navy text-brand-gold",
        gold: "bg-brand-gold text-brand-navy",
        neutral: "bg-neutral-100 text-neutral-600",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Pill badge — Success / Warning / Danger / Navy / Gold / Neutral maps.
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
