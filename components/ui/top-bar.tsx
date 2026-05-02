import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface TopBarProps extends React.HTMLAttributes<HTMLElement> {
  /** Page title — Playfair 20px navy */
  title: string;
  /** Right-aligned actions (buttons, menus) */
  actions?: React.ReactNode;
}

/**
 * 64px top bar — white surface, gold bottom rule.
 */
function TopBar({ className, title, actions, ...props }: TopBarProps) {
  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center justify-between border-b-2 border-brand-gold bg-white px-6",
        className,
      )}
      {...props}
    >
      <h1 className="font-display text-xl text-brand-navy">{title}</h1>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export { TopBar };
