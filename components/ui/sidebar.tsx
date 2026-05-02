import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface SidebarNavItem {
  href: string;
  label: string;
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  /** Navigation entries */
  items: SidebarNavItem[];
  /** Current path for active styling */
  activeHref?: string;
  /** Wordmark — Playfair gold on navy-deep */
  logo?: React.ReactNode;
}

/**
 * 256px navy sidebar — gold accents; active row uses navy-mid + gold-light text + gold left border.
 */
function Sidebar({
  className,
  items,
  activeHref,
  logo = <span className="font-display text-xl font-semibold text-brand-gold-light">Nexa</span>,
  ...props
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex w-64 flex-col border-r border-brand-navy bg-brand-navy-deep text-neutral-50",
        className,
      )}
      {...props}
    >
      <div className="border-b border-brand-navy-mid px-4 py-5">{logo}</div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Primary">
        {items.map((item) => {
          const active =
            activeHref === item.href ||
            (activeHref?.startsWith(item.href + "/") ?? false);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-l-[3px] border-brand-gold-light bg-brand-navy-mid pl-[9px] text-brand-gold-light"
                  : "border-l-[3px] border-transparent text-neutral-100 hover:bg-brand-navy",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export { Sidebar };
