"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface ProgressTimelineStep {
  label: string;
  completed: boolean;
  active?: boolean;
}

export interface ProgressTimelineProps {
  steps: ProgressTimelineStep[];
  className?: string;
}

/**
 * Figma Make `ProgressTimeline` — horizontal on `md+`, vertical on small screens (no `window` access).
 */
export function ProgressTimeline({ steps, className }: ProgressTimelineProps) {
  return (
    <>
      <div className={cn("md:hidden", className)}>
        <VerticalTimeline steps={steps} />
      </div>
      <div className={cn("hidden md:block", className)}>
        <HorizontalTimeline steps={steps} />
      </div>
    </>
  );
}

function VerticalTimeline({ steps }: { steps: ProgressTimelineStep[] }) {
  return (
    <div className="flex flex-col gap-6">
      {steps.map((step, index) => (
        <div key={step.label} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Dot step={step} />
            {index < steps.length - 1 ? (
              <div className="my-1 h-6 w-0.5 bg-neutral-300" aria-hidden />
            ) : null}
          </div>
          <div className="flex-1">
            <p
              className={cn(
                "text-base font-semibold",
                step.active
                  ? "text-brand-navy"
                  : step.completed
                    ? "text-neutral-900"
                    : "text-neutral-600",
              )}
            >
              {step.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HorizontalTimeline({ steps }: { steps: ProgressTimelineStep[] }) {
  return (
    <div className="flex items-center justify-between gap-2">
      {steps.map((step, index) => (
        <React.Fragment key={step.label}>
          <div className="flex min-w-0 flex-col items-center gap-3">
            <Dot step={step} />
            <p
              className={cn(
                "max-w-[120px] text-center text-sm font-semibold",
                step.active
                  ? "text-brand-navy"
                  : step.completed
                    ? "text-neutral-900"
                    : "text-neutral-600",
              )}
            >
              {step.label}
            </p>
          </div>
          {index < steps.length - 1 ? (
            <div className="mx-1 h-0.5 min-w-[1rem] flex-1 bg-neutral-300" aria-hidden />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function Dot({ step }: { step: ProgressTimelineStep }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        step.completed
          ? "size-4 bg-brand-gold"
          : step.active
            ? "size-4 bg-brand-navy"
            : "size-3 border-2 border-neutral-300 bg-transparent",
      )}
    >
      {step.completed ? (
        <svg className="size-2.5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : null}
    </div>
  );
}
