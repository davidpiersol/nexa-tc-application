import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface DocumentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Category shown as badge + thumbnail icon region */
  category: string;
  /** Primary line — filename */
  fileName: string;
  /** Status badge variant */
  statusVariant?: React.ComponentProps<typeof Badge>["variant"];
  /** Status label text */
  statusLabel: string;
  /** Secondary line — e.g. formatted date */
  dateLabel: string;
  /** Optional thumbnail slot — defaults to navy placeholder block */
  thumbnail?: React.ReactNode;
}

/**
 * 240px document tile — neutral surface, gold hover border-top (design system).
 */
function DocumentCard({
  className,
  category,
  fileName,
  statusVariant = "neutral",
  statusLabel,
  dateLabel,
  thumbnail,
  ...props
}: DocumentCardProps) {
  return (
    <div
      className={cn(
        "group flex w-[240px] flex-col overflow-hidden rounded-brand-lg border border-neutral-300 bg-neutral-50 shadow-brand-md transition-shadow hover:border-t-[3px] hover:border-brand-gold hover:shadow-brand-lg",
        className,
      )}
      {...props}
    >
      <div className="relative flex h-[150px] w-full items-center justify-center bg-brand-navy-deep">
        {thumbnail ?? (
          <span className="font-display text-sm text-brand-gold">◇</span>
        )}
      </div>
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="navy" className="max-w-[70%] truncate normal-case">
            {category}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-8 min-h-0 min-w-0 p-0"
          >
            <MoreHorizontal className="size-4" aria-hidden />
            <span className="sr-only">Actions</span>
          </Button>
        </div>
        <p className="truncate font-sans font-semibold text-neutral-900">{fileName}</p>
        <div className="flex items-center justify-between gap-2">
          <Badge variant={statusVariant}>{statusLabel}</Badge>
          <span className="font-sans text-xs text-neutral-600">{dateLabel}</span>
        </div>
      </div>
    </div>
  );
}

export { DocumentCard };
