"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { motion } from "framer-motion";
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
  /**
   * Gold check pop + label strikethrough when completing an item.
   * @default false
   */
  animateComplete?: boolean;
}

/**
 * Radix checkbox list — gold focus ring; optional Framer complete animation.
 */
function ChecklistPanel({
  className,
  title,
  items: itemsProp,
  onItemChange,
  animateComplete = false,
  ...props
}: ChecklistPanelProps) {
  const uid = React.useId();
  const [items, setItems] = React.useState(itemsProp);
  React.useEffect(() => {
    setItems(itemsProp);
  }, [itemsProp]);

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
              onCheckedChange={(v) => {
                const next = v === true;
                setItems((prev) =>
                  prev.map((i) => (i.id === item.id ? { ...i, checked: next } : i)),
                );
                onItemChange?.(item.id, next);
              }}
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-neutral-300 bg-white text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 data-[state=checked]:border-brand-gold data-[state=checked]:bg-brand-gold-pale",
              )}
            >
              <CheckboxPrimitive.Indicator className="flex items-center justify-center">
                {animateComplete ? (
                  <motion.span
                    initial={{ scale: 1.35, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="text-brand-gold"
                  >
                    <Check className="size-3.5 stroke-[3]" aria-hidden />
                  </motion.span>
                ) : (
                  <Check className="size-3.5 stroke-[3]" aria-hidden />
                )}
              </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
            <label
              htmlFor={`${uid}-${item.id}`}
              className={cn(
                "font-sans text-ui-body text-neutral-900",
                item.disabled && "text-neutral-600",
              )}
            >
              {animateComplete ? (
                <motion.span
                  animate={{
                    textDecoration: item.checked ? "line-through" : "none",
                    opacity: item.checked ? 0.75 : 1,
                  }}
                  transition={{ duration: 0.25 }}
                  className={cn(item.checked && "text-neutral-600")}
                >
                  {item.label}
                </motion.span>
              ) : (
                item.label
              )}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { ChecklistPanel };
