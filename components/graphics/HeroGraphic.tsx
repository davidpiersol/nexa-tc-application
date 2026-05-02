import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface HeroGraphicProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Override width / height */
  width?: number;
  height?: number;
}

/**
 * Abstract geometric hero — overlapping navy planes, gold diamond, brown circle (600×400 viewBox).
 */
function HeroGraphic({
  className,
  width = 600,
  height = 400,
  ...props
}: HeroGraphicProps) {
  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 600 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="max-w-full"
        aria-hidden
      >
        <rect width="600" height="400" fill="#F7F5F2" />
        <rect
          x="40"
          y="60"
          width="220"
          height="280"
          rx="12"
          transform="rotate(-12 150 200)"
          fill="#0D1B2A"
        />
        <rect
          x="180"
          y="80"
          width="260"
          height="200"
          rx="12"
          transform="rotate(8 310 180)"
          fill="#1A2E4A"
        />
        <rect
          x="320"
          y="120"
          width="200"
          height="240"
          rx="12"
          transform="rotate(-6 420 240)"
          fill="#1E3A5F"
        />
        <path d="M460 120 L520 180 L460 240 L400 180 Z" fill="#C9922A" />
        <circle cx="140" cy="300" r="48" fill="#6B4226" opacity="0.9" />
        <circle cx="480" cy="100" r="28" fill="#E8B84B" opacity="0.85" />
      </svg>
    </div>
  );
}

export { HeroGraphic };
