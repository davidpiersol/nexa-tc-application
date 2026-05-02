import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
}

/**
 * Empty list / folder illustration — geometric navy & gold blocks.
 */
function EmptyState({ className, title, description, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-brand-lg border border-dashed border-neutral-300 bg-neutral-50 px-8 py-12 text-center",
        className,
      )}
      {...props}
    >
      <svg
        width="160"
        height="120"
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-brand-navy"
        aria-hidden
      >
        <rect x="10" y="20" width="100" height="72" rx="8" fill="#EDE9E3" stroke="currentColor" />
        <rect x="50" y="40" width="90" height="60" rx="8" fill="#F7F5F2" stroke="currentColor" />
        <path d="M70 88 L88 70 L108 90" stroke="#C9922A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="125" cy="28" r="16" fill="#1A2E4A" opacity="0.15" />
      </svg>
      <div>
        <p className="font-display text-heading-md text-brand-navy">{title}</p>
        {description ? (
          <p className="mt-2 max-w-sm font-sans text-ui-body text-neutral-600">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export { EmptyState };
