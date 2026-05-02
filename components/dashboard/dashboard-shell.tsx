"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItemsForPath, roleFromPathname } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils/cn";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = roleFromPathname(pathname);
  const items = navItemsForPath(pathname);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="flex w-64 flex-col border-r border-neutral-300 bg-brand-navy-deep text-neutral-50">
        <div className="border-b border-brand-navy-mid px-4 py-5 font-display text-xl font-semibold text-brand-gold-light">
          Nexa
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
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
                    : "text-neutral-100 hover:bg-brand-navy",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center border-b-2 border-brand-gold bg-white px-6">
          <h1 className="font-display text-xl text-brand-navy">
            {role ? `${role.toUpperCase()} workspace` : "Dashboard"}
          </h1>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
