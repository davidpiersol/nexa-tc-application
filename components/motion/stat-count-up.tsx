"use client";

import { animate } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface StatCountUpProps {
  /** Target integer to count toward */
  value: number;
  className?: string;
  /** Optional prefix e.g. $ */
  prefix?: string;
  /** Optional suffix */
  suffix?: string;
  /** Duration in seconds */
  duration?: number;
}

/**
 * Count-up on first mount — use for stats row KPIs.
 */
export function StatCountUp({
  value,
  className,
  prefix = "",
  suffix = "",
  duration = 1.1,
}: StatCountUpProps) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    const c = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => c.stop();
  }, [value, duration]);
  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {n}
      {suffix}
    </span>
  );
}
