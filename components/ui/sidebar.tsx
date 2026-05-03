import * as React from "react";
import Link from "next/link";
import NexaIcon from "@/components/brand/NexaIcon";
import NexaLogo from "@/components/brand/NexaLogo";
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
  /** Wordmark / lockup — defaults to **NexaLogo** (expanded) or **NexaIcon** when `collapsed` */
  logo?: React.ReactNode;
  /** Narrow icon-only brand rail (uses **NexaIcon** unless `logo` is provided) */
  collapsed?: boolean;
}

/**
 * 256px navy sidebar — gold accents; active row uses navy-mid + gold-light text + gold left border.
 */
function Sidebar({
  className,
  items,
  activeHref,
  collapsed = false,
  logo,
  ...props
}: SidebarProps) {
  const brandMark =
    logo ??
    (collapsed ? (
      <span className="flex justify-center">
        <NexaIcon className="size-8" aria-hidden />
      </span>
    ) : (
      <NexaLogo
        showTagline={false}
        className="max-h-10 w-full max-w-[200px]"
        title="NEXA"
      />
    ));

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-brand-navy bg-brand-navy-deep text-neutral-50",
        collapsed ? "w-[4.5rem]" : "w-64",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "border-b border-brand-navy-mid",
          collapsed ? "px-2 py-4" : "px-4 py-5",
        )}
      >
        {brandMark}
      </div>
      <nav
        className={cn(
          "flex flex-1 flex-col gap-1 p-3",
          collapsed && "items-center px-2",
        )}
        aria-label="Primary"
      >
        {items.map((item) => {
          const active =
            activeHref === item.href ||
            (activeHref?.startsWith(item.href + "/") ?? false);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "rounded-md font-medium transition-colors",
                collapsed
                  ? cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center border-0 text-sm",
                      active
                        ? "bg-brand-navy-mid text-brand-gold-light ring-2 ring-brand-gold-light ring-offset-2 ring-offset-brand-navy-deep"
                        : "text-neutral-100 hover:bg-brand-navy hover:text-brand-gold-light",
                    )
                  : cn(
                      "px-3 py-2 text-sm",
                      active
                        ? "border-l-[3px] border-brand-gold-light bg-brand-navy-mid pl-[9px] text-brand-gold-light"
                        : "border-l-[3px] border-transparent text-neutral-100 hover:bg-brand-navy",
                    ),
              )}
            >
              {collapsed ? item.label.charAt(0) : item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export { Sidebar };
