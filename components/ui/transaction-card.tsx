import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/avatar";

const accentVariants = cva("h-1 w-full rounded-none rounded-t-brand-lg", {
  variants: {
    stage: {
      listing: "bg-brand-navy",
      contract: "bg-brand-gold",
      pending: "bg-brand-brown",
      prelisting: "bg-brand-steel",
      closed: "bg-status-success",
    },
  },
  defaultVariants: {
    stage: "listing",
  },
});

export interface TransactionCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof accentVariants> {
  /** Property / transaction title */
  address: string;
  /** Optional second line (e.g. city/state from Figma Make) */
  subtitle?: string;
  /** Close or milestone label */
  closeDateLabel: string;
  /** TC initials for avatar */
  tcInitials: string;
  /** 0–100 progress for gold bar */
  progressPercent: number;
}

/**
 * Kanban transaction tile — 270px, stage accent bar, gold progress.
 */
const TransactionCard = React.forwardRef<HTMLDivElement, TransactionCardProps>(
  (
    {
      className,
      stage,
      address,
      subtitle,
      closeDateLabel,
      tcInitials,
      progressPercent,
      ...props
    },
    ref,
  ) => {
  const pct = Math.min(100, Math.max(0, progressPercent));
  return (
    <div
      ref={ref}
      className={cn(
        "flex w-[270px] shrink-0 flex-col overflow-hidden rounded-brand-lg bg-white shadow-brand-sm",
        className,
      )}
      {...props}
    >
      <div className={cn(accentVariants({ stage }))} />
      <div className="flex flex-col gap-3 p-4">
        <div>
          <p className="font-sans font-bold text-brand-navy">{address}</p>
          {subtitle ? (
            <p className="mt-0.5 font-sans text-sm text-neutral-600">{subtitle}</p>
          ) : null}
          <p className="mt-1 font-sans text-sm text-neutral-600">{closeDateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Avatar size="sm" initials={tcInitials} />
          <span className="font-sans text-xs text-neutral-600">TC</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-brand-gold transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
  },
);
TransactionCard.displayName = "TransactionCard";

export { TransactionCard, accentVariants };
