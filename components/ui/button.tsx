"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 font-display font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "rounded-brand-md bg-brand-navy text-neutral-50 hover:bg-brand-navy-mid [&:not(:disabled)]:hover:border-b-2 [&:not(:disabled)]:hover:border-brand-gold",
        gold:
          "rounded-brand-md bg-brand-gold text-brand-navy hover:bg-brand-gold-light [&:not(:disabled)]:hover:border-b-2 [&:not(:disabled)]:hover:border-brand-navy",
        secondary:
          "rounded-brand-md border border-brand-navy bg-white text-brand-navy hover:bg-neutral-50 [&:not(:disabled)]:hover:border-b-2 [&:not(:disabled)]:hover:border-brand-gold",
        ghost:
          "rounded-brand-md bg-transparent text-brand-navy underline-offset-4 hover:underline hover:decoration-brand-gold hover:decoration-2",
        danger:
          "rounded-brand-md bg-status-danger text-neutral-50 hover:brightness-110",
      },
      size: {
        lg: "min-h-12 min-w-[8rem] px-6 text-lg",
        md: "min-h-10 px-4 text-base",
        sm: "min-h-8 px-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Render as child element (e.g. `next/link`) while keeping button styles.
   */
  asChild?: boolean;
  /**
   * Shows spinner and disables interaction while an async action runs.
   */
  loading?: boolean;
}

/**
 * Nexa primary control — Playfair label, 8px radius, gold hover accent per design system.
 * Maps to Figma `Button` variants (Primary / Gold / Secondary / Ghost / Danger × sizes).
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            <span className="sr-only">Loading</span>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
