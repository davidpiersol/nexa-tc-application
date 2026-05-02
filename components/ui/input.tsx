"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const inputVariants = cva(
  "flex w-full rounded-brand-md border bg-white px-3 py-2 font-sans text-ui-body text-neutral-900 shadow-brand-sm transition-colors placeholder:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-100",
  {
    variants: {
      state: {
        default: "border-neutral-300",
        error: "border-status-danger focus-visible:ring-status-danger",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /** Inter label above field */
  label?: string;
  /** Helper or validation message below field */
  helperText?: string;
}

/**
 * Text field with Inter label + helper — focus ring uses brand gold; error uses status tokens.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, state, label, helperText, id, ...props }, ref) => {
    const genId = React.useId();
    const inputId = id ?? genId;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <LabelPrimitive.Root
            htmlFor={inputId}
            className="font-sans text-ui-label uppercase tracking-wide text-neutral-900"
          >
            {label}
          </LabelPrimitive.Root>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          className={cn(inputVariants({ state }), className)}
          aria-invalid={state === "error"}
          aria-describedby={helperId}
          {...props}
        />
        {helperText ? (
          <p
            id={helperId}
            className={cn(
              "font-sans text-sm",
              state === "error" ? "text-status-danger" : "text-neutral-600",
            )}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
