"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, FileText, ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const billingLinks = [
  { href: "/tc/billing", label: "Billing", icon: CreditCard },
  { href: "/tc/billing/invoices", label: "Invoices", icon: ReceiptText },
  { href: "/tc/reports", label: "Reports", icon: FileText },
] as const;

export function BillingWorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2 rounded-brand-lg border border-neutral-300 bg-white p-2 shadow-brand-sm"
      aria-label="Billing workspace"
    >
      {billingLinks.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/tc/reports"
            ? pathname.startsWith("/tc/reports")
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-brand-md px-3 font-display text-sm font-semibold transition-colors",
              active
                ? "bg-brand-navy text-white"
                : "border border-neutral-300 bg-white text-brand-navy hover:bg-neutral-50",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
