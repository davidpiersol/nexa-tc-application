"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ChoralPointLogo } from "@/components/brand/ChoralPointLogo";
import { dashboardTitleForPath } from "@/lib/dashboard-titles";
import {
  navItemsForPath,
  roleFromPathname,
  routeBase,
} from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils/cn";
import { AccountMenu } from "@/components/dashboard/account-menu";
import { Button } from "@/components/ui/button";

type DashboardShellProps = {
  children: React.ReactNode;
  account?: {
    email?: string | null;
    role?: string | null;
  };
};

export function DashboardShell({ children, account }: DashboardShellProps) {
  const pathname = usePathname();
  const role = roleFromPathname(pathname);
  const items = navItemsForPath(pathname);
  const title = dashboardTitleForPath(pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (pathname.startsWith("/tc/billing/print")) {
    return (
      <main className="min-h-screen bg-white p-4 print:p-0">
        {children}
      </main>
    );
  }

  const homeHref = role ? routeBase(pathname) : "/";
  const tcPrimaryAction = (() => {
    if (!pathname.startsWith("/tc")) return null;
    if (pathname.startsWith("/tc/brokers")) {
      return { href: "/tc/brokers/new", label: "Add broker" };
    }
    if (pathname.startsWith("/tc/contacts")) {
      return { href: "/tc/contacts/new", label: "Add contacts" };
    }
    if (pathname.startsWith("/tc/mls-entry")) {
      return { href: "/tc/mls-entry/new", label: "New MLS entry" };
    }
    if (pathname.startsWith("/tc/billing")) {
      return { href: "/tc/billing#new-invoice", label: "New invoice" };
    }
    return { href: "/tc/transactions/new", label: "Add transaction" };
  })();

  return (
    <div className="choral-app-background relative flex min-h-screen p-3">
      <aside
        className={cn(
          "relative flex shrink-0 flex-col overflow-hidden rounded-l-[24px] border border-brand-navy/10 bg-white/75 text-brand-navy shadow-brand-lg backdrop-blur transition-[width] duration-200 ease-out",
          sidebarCollapsed ? "w-[4.5rem]" : "w-64",
        )}
      >
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
              aria-label="Choral Point workspace home"
            >
              {sidebarCollapsed ? (
                <span className="text-lg font-semibold text-brand-gold-deep">C</span>
              ) : (
                <ChoralPointLogo compact />
              )}
            </Link>
            <button
              type="button"
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-navy/10 bg-white text-brand-gold-deep transition-colors hover:bg-brand-gold-pale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-light",
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
                          ? "bg-brand-gold/15 text-brand-navy ring-2 ring-brand-gold-light ring-offset-2 ring-offset-white"
                          : "text-brand-steel hover:bg-brand-gold-pale hover:text-brand-navy",
                      )
                    : cn(
                        "px-3 py-2 text-sm",
                        active
                          ? "border-l-4 border-brand-gold bg-brand-gold/15 text-brand-navy"
                          : "border-l-4 border-transparent text-brand-steel hover:bg-brand-gold-pale hover:text-brand-navy",
                      ),
                )}
              >
                {sidebarCollapsed ? item.label.charAt(0) : item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      {/* min-h-0 so nested flex children can shrink and establish overflow (avoid clipped / empty main) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-r-[24px] border-y border-r border-brand-navy/10 bg-white/70 shadow-brand-lg backdrop-blur">
        {/* Header above main stacking so account dropdown (absolute) receives clicks over page body */}
        <header className="relative z-30 flex h-16 shrink-0 items-center gap-4 border-b border-brand-navy/10 bg-white/80 px-4 sm:px-6">
          <Link
            href={homeHref}
            className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            aria-label="Choral Point home"
          >
            <ChoralPointLogo compact />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <h1 className="truncate font-display text-xl text-brand-navy">
              {title}
            </h1>
            {role === "tc" && tcPrimaryAction ? (
              <Button variant="gold" size="sm" type="button" asChild>
                <Link href={tcPrimaryAction.href}>{tcPrimaryAction.label}</Link>
              </Button>
            ) : null}
            <AccountMenu email={account?.email} role={account?.role} />
          </div>
        </header>
        <main className="relative z-0 min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
