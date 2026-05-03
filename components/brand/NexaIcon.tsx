import * as React from "react";
import { nexaBrand } from "@/lib/brand/tokens";

export type NexaIconProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

export function NexaIcon({
  title = "NEXA icon",
  className,
  ...props
}: NexaIconProps) {
  const titleId = React.useId();
  const c = nexaBrand.colors;

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-labelledby={titleId}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title id={titleId}>{title}</title>
      <rect width="64" height="64" rx="16" fill={c.navy} />
      <path
        d="M18 46V18h7.5L39 36.25V18h7v28h-7.5L25 27.75V46h-7Z"
        fill={c.offWhite}
      />
      <path
        d="M18 46h28"
        stroke={c.teal}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M44.5 12.5 51 19l-6.5 6.5"
        stroke={c.blue}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
