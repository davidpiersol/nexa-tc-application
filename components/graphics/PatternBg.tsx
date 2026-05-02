import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface PatternBgProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tile opacity 0–1 (guide default ~4%) */
  opacity?: number;
}

/**
 * Subtle diamond tiling — navy / navy-mid at low opacity for sidebar or hero backgrounds.
 */
function PatternBg({ className, opacity = 0.04, ...props }: PatternBgProps) {
  const id = React.useId().replace(/:/g, "");
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} {...props}>
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <pattern id={`nexa-diamond-${id}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M12 2 L22 12 L12 22 L2 12 Z"
              fill="#1A2E4A"
              fillOpacity={opacity}
            />
            <path
              d="M12 6 L18 12 L12 18 L6 12 Z"
              fill="#1E3A5F"
              fillOpacity={opacity * 0.75}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#nexa-diamond-${id})`} />
      </svg>
    </div>
  );
}

export { PatternBg };
