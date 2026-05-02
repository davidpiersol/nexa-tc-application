import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const dotVariants = cva(
  "flex size-10 shrink-0 items-center justify-center rounded-full border-2 font-sans text-sm font-semibold",
  {
    variants: {
      state: {
        complete: "border-brand-gold bg-brand-gold text-brand-navy",
        active: "border-brand-navy bg-brand-navy text-neutral-50",
        future: "border-neutral-300 bg-white text-neutral-600",
      },
    },
    defaultVariants: {
      state: "future",
    },
  },
);

export interface TimelineStep {
  id: string;
  label: string;
  state: "complete" | "active" | "future";
}

export interface TimelineBarProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: TimelineStep[];
}

/**
 * Horizontal milestone rail — gold fill for completed, navy for active, neutral future.
 */
function TimelineBar({ className, steps, ...props }: TimelineBarProps) {
  return (
    <div className={cn("w-full overflow-x-auto py-2", className)} {...props}>
      <div className="flex min-w-max items-center gap-2 px-1">
        {steps.map((step, i) => (
          <React.Fragment key={step.id}>
            {i > 0 ? (
              <div
                className={cn(
                  "h-0.5 w-12 shrink-0 rounded-full",
                  steps[i - 1]?.state === "complete"
                    ? "bg-brand-gold"
                    : "bg-neutral-300",
                )}
                aria-hidden
              />
            ) : null}
            <div className="flex flex-col items-center gap-2">
              <div className={dotVariants({ state: step.state })}>{i + 1}</div>
              <span className="max-w-[7rem] text-center font-sans text-sm text-neutral-900">
                {step.label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export { TimelineBar, dotVariants };
