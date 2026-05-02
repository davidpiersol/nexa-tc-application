"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface ProgressRingProps extends React.SVGProps<SVGSVGElement> {
  /** 0–100 */
  value: number;
  /** Outer diameter in px */
  size?: number;
  strokeWidth?: number;
}

/**
 * Circular progress — gold arc on navy-dark track (AI confidence / scores).
 */
function ProgressRing({
  value,
  size = 96,
  strokeWidth = 8,
  className,
  ...props
}: ProgressRingProps) {
  const pct = Math.min(100, Math.max(0, value));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("-rotate-90", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress ${pct} percent`}
      {...props}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-brand-navy-deep"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-brand-gold transition-[stroke-dashoffset] duration-500 ease-out"
      />
    </svg>
  );
}

export { ProgressRing };
