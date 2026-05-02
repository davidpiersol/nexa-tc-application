"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ChecklistItem {
  id: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
}

export interface ChecklistPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Section title */
  title: string;
  items: ChecklistItem[];
  /** Fires when any item toggles */
  onItemChange?: (id: string, checked: boolean) => void;
}

/**
 * Radix checkbox list — gold focus ring; parchment-style panel optional via className.
 */
function ChecklistPanel({
  className,
  title,
  items,
  onItemChange,
  ...props
}: ChecklistPanelProps) {
  const uid = React.useId();
  return (
    <div
      className={cn(
        "rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm",
        className,
      )}
      {...props}
    >
      <h3 className="font-display text-heading-md text-brand-navy">{title}</h3>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <CheckboxPrimitive.Root
              id={`${uid}-${item.id}`}
              checked={item.checked}
              disabled={item.disabled}
              onCheckedChange={(v) =>
                onItemChange?.(item.id, v === true)
              }
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-neutral-300 bg-white text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 data-[state=checked]:border-brand-gold data-[state=checked]:bg-brand-gold-pale",
              )}
            >
              <CheckboxPrimitive.Indicator>
                <Check className="size-3.5 stroke-[3]" aria-hidden />
              </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
            <label
              htmlFor={`${uid}-${item.id}`}
              className={cn(
                "font-sans text-ui-body text-neutral-900",
                item.disabled && "text-neutral-600",
              )}
            >
              {item.label}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { ChecklistPanel };
