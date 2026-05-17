"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock, Link2, Network, Plug, Upload, UsersRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function CrmWorkspaceNav({ basePath }: { basePath: string }) {
  const pathname = usePathname();
  const items: Item[] = [
    { href: basePath, label: "Upcoming", icon: Clock },
    { href: `${basePath}/tasks`, label: "Tasks", icon: UsersRound },
    { href: `${basePath}/reminders`, label: "Reminders", icon: CalendarDays },
    { href: `${basePath}/touch-history`, label: "Touches", icon: Link2 },
    { href: `${basePath}/notes`, label: "Notes", icon: Network },
    { href: `${basePath}/relationships`, label: "Relationships", icon: UsersRound },
    { href: `${basePath}/segments`, label: "Segments", icon: Network },
    { href: `${basePath}/calendar`, label: "Calendar", icon: CalendarDays },
    { href: `${basePath}/import-export`, label: "Import / Export", icon: Upload },
    { href: `${basePath}/connections`, label: "Connections", icon: Plug },
  ];

  return (
    <nav className="overflow-x-auto border-b border-neutral-300 pb-3" aria-label="CRM sections">
      <div className="flex min-w-max gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === basePath
              ? pathname === basePath
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex min-h-8 items-center justify-center gap-2 rounded-brand-md px-3 font-display text-sm font-semibold transition-colors",
                active
                  ? "bg-brand-navy text-white"
                  : "border border-brand-navy bg-white text-brand-navy hover:bg-neutral-50",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
