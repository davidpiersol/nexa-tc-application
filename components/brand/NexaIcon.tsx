"use client";

import * as React from "react";
import { nexaBrand } from "@/lib/brand/tokens";
import { cn } from "@/lib/utils/cn";

export type NexaIconProps = Omit<React.SVGProps<SVGSVGElement>, "children"> & {
  /** Accessible short name (default **NEXA**). */
  title?: string;
};

/**
 * Inline SVG app icon: circular nexus mark with center **N** and four outer connection nodes.
 * Navy field and blue accents only — scales cleanly at 24–128px via `viewBox` (set size with `className`, e.g. `size-6`, `size-8`).
 */
function NexaIcon({
  className,
  title = "NEXA",
  ...props
}: NexaIconProps) {
  const titleId = React.useId();
  const c = nexaBrand.colors;

  /* Logo N-glyph, scaled to sit inside the inner hub (readable at small px sizes). */
  const nTransform = "translate(32 32) scale(0.52) translate(-29.25 -32)";

  return (
    <svg
      viewBox="0 0 64 64"
      width="1em"
      height="1em"
      role="img"
      aria-labelledby={titleId}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="geometricPrecision"
      className={cn("inline-block shrink-0 align-middle", className)}
      {...props}
    >
      <title id={titleId}>{title}</title>

      {/* Outer field */}
      <circle cx="32" cy="32" r="30" fill={c.navy} />

      {/* Spokes: center hub to nodes */}
      <g
        fill="none"
        stroke={c.blue}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="32" y1="32" x2="32" y2="9.25" />
        <line x1="32" y1="32" x2="54.75" y2="32" />
        <line x1="32" y1="32" x2="32" y2="54.75" />
        <line x1="32" y1="32" x2="9.25" y2="32" />
      </g>

      {/* Four outer connection nodes */}
      <circle cx="32" cy="6" r="3.25" fill={c.blue} />
      <circle cx="58" cy="32" r="3.25" fill={c.blue} />
      <circle cx="32" cy="58" r="3.25" fill={c.blue} />
      <circle cx="6" cy="32" r="3.25" fill={c.blue} />

      {/* Center N (above spokes for a clean lockup) */}
      <g transform={nTransform}>
        <path
          d="M18 44V20h6.5L34 36.5V20h6.5v24h-6.5L24.5 27.5V44H18Z"
          fill={c.blue}
        />
      </g>
    </svg>
  );
}

export default NexaIcon;
