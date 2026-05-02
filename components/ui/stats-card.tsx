import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Large numeric / headline stat */
  value: React.ReactNode;
  /** Uppercase Inter label */
  label: string;
  /** Optional decorative icon (e.g. Lucide), gold, top-right */
  icon?: React.ReactNode;
}

/**
 * KPI tile — gold top border, Playfair stat, uppercase neutral label.
 */
function StatsCard({
  className,
  value,
  label,
  icon,
  ...props
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-brand-lg border border-neutral-300 bg-white shadow-brand-sm pt-3",
        className,
      )}
      {...props}
    >
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
    </div>
  );
}

export { StatsCard };
