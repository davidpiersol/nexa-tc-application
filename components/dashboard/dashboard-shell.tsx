"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NexaIcon from "@/components/brand/NexaIcon";
import NexaLogo from "@/components/brand/NexaLogo";
import { PatternBg } from "@/components/graphics/PatternBg";
import { dashboardTitleForPath } from "@/lib/dashboard-titles";
import {
  navItemsForPath,
  roleFromPathname,
  routeBase,
} from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils/cn";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = roleFromPathname(pathname);
  const items = navItemsForPath(pathname);
  const title = dashboardTitleForPath(pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const homeHref = role ? routeBase(pathname) : "/";

  return (
    <div className="relative flex min-h-screen bg-neutral-50">
      <aside
        className={cn(
          "relative flex shrink-0 flex-col overflow-hidden border-r border-brand-navy bg-brand-navy-deep text-neutral-50 transition-[width] duration-200 ease-out",
          sidebarCollapsed ? "w-[4.5rem]" : "w-64",
        )}
      >
        <PatternBg opacity={0.05} />
        <div
          className={cn(
            "relative z-[1] border-b border-brand-navy-mid",
            sidebarCollapsed ? "px-2 py-4" : "px-4 py-5",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2",
              sidebarCollapsed ? "flex-col" : "justify-between",
            )}
          >
            <Link
              href={homeHref}
              className={cn(
                "min-w-0 shrink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy-deep",
                sidebarCollapsed && "flex justify-center",
              )}
              aria-label="NEXA workspace home"
            >
              {sidebarCollapsed ? (
                <NexaIcon className="size-8" aria-hidden />
              ) : (
                <NexaLogo
                  showTagline={false}
                  className="max-h-10 w-full max-w-[200px]"
                  title="NEXA"
                />
              )}
            </Link>
            <button
              type="button"
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-brand-navy-mid bg-brand-navy/60 text-brand-gold-light transition-colors hover:bg-brand-navy-mid hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-light",
                sidebarCollapsed && "mt-2",
              )}
              onClick={() => setSidebarCollapsed((c) => !c)}
              aria-expanded={!sidebarCollapsed}
              aria-label={
                sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
            >
              {sidebarCollapsed ? (
                <ChevronRight className="size-5" aria-hidden />
              ) : (
                <ChevronLeft className="size-5" aria-hidden />
              )}
            </button>
          </div>
        </div>
        <nav
          className={cn(
            "relative z-[1] flex flex-1 flex-col gap-1 p-3",
            sidebarCollapsed && "items-center px-2",
          )}
          aria-label="Workspace"
        >
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "rounded-md font-medium transition-colors",
                  sidebarCollapsed
                    ? cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center border-0 text-sm",
                        active
                          ? "bg-brand-navy-mid text-brand-gold-light ring-2 ring-brand-gold-light ring-offset-2 ring-offset-brand-navy-deep"
                          : "text-neutral-100 hover:bg-brand-navy hover:text-brand-gold-light",
                      )
                    : cn(
                        "px-3 py-2 text-sm",
                        active
                          ? "border-l-4 border-brand-gold-light bg-brand-navy-mid text-brand-gold-light"
                          : "border-l-4 border-transparent text-neutral-100 hover:bg-brand-navy hover:text-brand-gold-light",
                      ),
                )}
              >
                {sidebarCollapsed ? item.label.charAt(0) : item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-[1] flex h-16 shrink-0 items-center gap-4 border-b-2 border-brand-gold bg-white px-4 sm:px-6">
          <Link
            href={homeHref}
            className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            aria-label="NEXA home"
          >
            <NexaLogo
              showTagline={false}
              className="h-9 max-w-[132px]"
              title="NEXA"
            />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <h1 className="truncate font-display text-xl text-brand-navy">
              {title}
            </h1>
            {role ? (
              <span className="ml-auto hidden items-center gap-2 font-sans text-xs uppercase tracking-wide text-neutral-600 sm:inline-flex">
                <NexaIcon className="size-5 opacity-70" aria-hidden />
                {/* TODO: role badge from session */}
                Role · {role}
              </span>
            ) : null}
          </div>
        </header>
        <main className="relative z-[1] flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
