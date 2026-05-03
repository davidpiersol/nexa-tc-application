import * as React from "react";
import { nexaBrand } from "@/lib/brand/tokens";
import { NexaIcon } from "@/components/brand/NexaIcon";

export type NexaLogoProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
  showDescriptor?: boolean;
};

export function NexaLogo({
  title = "NEXA",
  showDescriptor = true,
  className,
  ...props
}: NexaLogoProps) {
  const titleId = React.useId();
  const c = nexaBrand.colors;
  const font = nexaBrand.font.primary;

  return (
    <svg
      viewBox={showDescriptor ? "0 0 280 72" : "0 0 220 64"}
      role="img"
      aria-labelledby={titleId}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title id={titleId}>{title}</title>
      <NexaIcon
        x="0"
        y="4"
        width="56"
        height="56"
        title={`${title} mark`}
        aria-hidden="true"
      />
      <text
        x="72"
        y="39"
        fill={c.navy}
        fontFamily={font}
        fontSize="32"
        fontWeight="700"
        letterSpacing="-0.5"
      >
        NEXA
      </text>
      <text
        x="168"
        y="39"
        fill={c.blue}
        fontFamily={font}
        fontSize="22"
        fontWeight="700"
        letterSpacing="2"
      >
        TC
      </text>
      {showDescriptor ? (
        <text
          x="74"
          y="58"
          fill={c.slate}
          fontFamily={font}
          fontSize="10"
          fontWeight="600"
          letterSpacing="0.12em"
        >
          {nexaBrand.tagline}
        </text>
      ) : null}
    </svg>
  );
}
