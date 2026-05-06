import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface StatsCardProps {
  className?: string;
  /** Large numeric / headline stat */
  value: React.ReactNode;
  /** Uppercase Inter label */
  label: string;
  /** Optional decorative icon (e.g. Lucide), gold, top-right */
  icon?: React.ReactNode;
  /** When set, the whole card is a link (e.g. filtered transaction list). */
  href?: string;
}

/**
 * KPI tile — gold top border, Playfair stat, uppercase neutral label.
 */
function StatsCard({
  className,
  value,
  label,
  icon,
  href,
}: StatsCardProps) {
  const shell = (
    <>
      <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-brand-lg bg-brand-gold" />
      {icon ? (
        <div className="absolute right-3 top-5 text-brand-gold [&_svg]:size-7">{icon}</div>
      ) : null}
      <div className="px-4 pb-4 pt-4">
        <p className="font-display text-[36px] leading-none text-brand-navy">{value}</p>
        <p className="mt-2 font-sans text-ui-label uppercase tracking-wide text-neutral-600">
          {label}
        </p>
      </div>
    </>
  );

  const boxClass = cn(
    "relative block rounded-brand-lg border border-neutral-300 bg-white pt-3 shadow-brand-sm transition-shadow",
    /* Grid safety: <Link> must span the full cell (anchors default narrower than divs in some layouts). */
    href && "w-full min-w-0 no-underline",
    href &&
      "cursor-pointer hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={boxClass}>
        {shell}
      </Link>
    );
  }

  return (
    <div className={boxClass}>
      {shell}
    </div>
  );
}

export { StatsCard };
