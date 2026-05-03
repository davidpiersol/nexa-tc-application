import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface TopBarProps extends React.HTMLAttributes<HTMLElement> {
  /** Page title — Playfair 20px navy */
  title: string;
  /** Optional mark before the title (e.g. **NexaLogo**) */
  leading?: React.ReactNode;
  /** Right-aligned actions (buttons, menus) */
  actions?: React.ReactNode;
}

/**
 * 64px top bar — white surface, gold bottom rule.
 */
function TopBar({ className, title, actions, leading, ...props }: TopBarProps) {
  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center justify-between border-b-2 border-brand-gold bg-white px-6",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {leading}
        <h1 className="min-w-0 truncate font-display text-xl text-brand-navy">{title}</h1>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export { TopBar };
