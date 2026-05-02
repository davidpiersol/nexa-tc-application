"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PatternBg } from "@/components/graphics/PatternBg";
import { dashboardTitleForPath } from "@/lib/dashboard-titles";
import { navItemsForPath, roleFromPathname } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils/cn";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = roleFromPathname(pathname);
  const items = navItemsForPath(pathname);
  const title = dashboardTitleForPath(pathname);

  return (
    <div className="relative flex min-h-screen bg-neutral-50">
      <aside className="relative flex w-64 shrink-0 flex-col overflow-hidden border-r border-brand-navy bg-brand-navy-deep text-neutral-50">
        <PatternBg opacity={0.05} />
        <div className="relative z-[1] border-b border-brand-navy-mid px-4 py-5 font-display text-xl font-semibold text-brand-gold-light">
          Nexa
        </div>
        <nav className="relative z-[1] flex flex-1 flex-col gap-1 p-3" aria-label="Workspace">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-l-4 border-brand-gold-light bg-brand-navy-mid text-brand-gold-light"
                    : "border-l-4 border-transparent text-neutral-100 hover:bg-brand-navy hover:text-brand-gold-light",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-[1] flex h-16 shrink-0 items-center border-b-2 border-brand-gold bg-white px-4 sm:px-6">
          <h1 className="font-display text-xl text-brand-navy">{title}</h1>
          {role ? (
            <span className="ml-auto hidden font-sans text-xs uppercase tracking-wide text-neutral-600 sm:inline">
              {/* TODO: role badge from session */}
              Role · {role}
            </span>
          ) : null}
        </header>
        <main className="relative z-[1] flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
