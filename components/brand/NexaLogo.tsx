"use client";

import * as React from "react";
import { nexaBrand } from "@/lib/brand/tokens";
import { cn } from "@/lib/utils/cn";

export type NexaLogoProps = Omit<React.SVGProps<SVGSVGElement>, "children"> & {
  /** Additional Tailwind / classes; logo scales with container width. */
  className?: string;
  /** Primary wordmark (default **NEXA**). */
  wordmark?: string;
  /** Show tagline row (default **true**). */
  showTagline?: boolean;
  /** Tagline copy (default from brand tokens). */
  tagline?: string;
  /** Accessible name for the lockup. */
  title?: string;
};

/**
 * Inline SVG lockup: circular nexus mark + **NEXA** wordmark + optional tagline.
 * No external images — scales cleanly via `viewBox` (wrap with a sized container).
 */
function NexaLogo({
  className,
  wordmark = nexaBrand.name,
  showTagline = true,
  tagline = nexaBrand.tagline,
  title = "NEXA",
  ...props
}: NexaLogoProps) {
  const titleId = React.useId();
  const clipId = `nexa-logo-clip-${React.useId().replace(/:/g, "")}`;
  const c = nexaBrand.colors;
  const font = nexaBrand.font.primary;

  const viewBox = showTagline ? "0 0 300 80" : "0 0 210 64";

  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-labelledby={titleId}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMinYMid meet"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      className={cn("block h-auto w-full max-w-full", className)}
      {...props}
    >
      <title id={titleId}>{title}</title>

      <defs>
        <clipPath id={clipId}>
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>

      {/* Circular nexus mark */}
      <g transform="translate(0 0)">
        <circle cx="32" cy="32" r="30" fill={c.navy} />
        <g clipPath={`url(#${clipId})`}>
          <path
            d="M18 44V20h6.5L34 36.5V20h6.5v24h-6.5L24.5 27.5V44H18Z"
            fill={c.offWhite}
          />
          <path
            d="M18 44h28"
            stroke={c.teal}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M42.5 14.5 50 22l-7.5 7.5"
            stroke={c.blue}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </g>

      <text
        x="76"
        y="42"
        fill={c.navy}
        fontFamily={font}
        fontSize="30"
        fontWeight="700"
        letterSpacing="-0.02em"
      >
        {wordmark}
      </text>

      {showTagline ? (
        <text
          x="76"
          y="66"
          fill={c.slate}
          fontFamily={font}
          fontSize="11"
          fontWeight="600"
          letterSpacing="0.06em"
        >
          {tagline}
        </text>
      ) : null}
    </svg>
  );
}

export default NexaLogo;
