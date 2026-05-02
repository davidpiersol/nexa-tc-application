import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { ProgressRing } from "@/components/graphics/ProgressRing";

export interface FirstPassReviewProps extends React.HTMLAttributes<HTMLDivElement> {
  /** AI confidence 0–100 */
  confidence: number;
  /** Short summary line */
  summary: string;
  /** Optional detailed findings (markdown/plain) */
  findings?: React.ReactNode;
}

/**
 * First Pass AI panel — confidence ring + narrative block using Nexa surfaces.
 */
function FirstPassReview({
  className,
  confidence,
  summary,
  findings,
  ...props
}: FirstPassReviewProps) {
  const pct = Math.min(100, Math.max(0, confidence));
  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-brand-lg border border-neutral-300 bg-neutral-50 p-6 shadow-brand-md md:flex-row",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-2">
        <ProgressRing value={pct} size={120} strokeWidth={10} />
        <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
          Confidence
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-heading-md text-brand-navy">First Pass review</h3>
        <p className="mt-2 font-sans text-ui-body text-neutral-900">{summary}</p>
        {findings ? (
          <div className="mt-4 rounded-brand-md border border-neutral-300 bg-white p-4 font-sans text-prose-body text-neutral-900">
            {findings}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export { FirstPassReview };
