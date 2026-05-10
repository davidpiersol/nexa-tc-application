"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";

type ActiveView = "detail" | "documents" | "first-pass" | "edit";

export function TransactionWorkspaceNav({
  transactionId,
}: {
  transactionId: string;
}) {
  const pathname = usePathname();

  const active = useMemo<ActiveView>(() => {
    if (pathname.includes("/documents")) return "documents";
    if (pathname.includes("/first-pass")) return "first-pass";
    if (pathname.includes("/edit")) return "edit";
    return "detail";
  }, [pathname]);

  const detailHref = `/tc/transactions/${transactionId}`;

  return (
    <section className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" type="button" asChild>
          <Link href="/tc/transactions">Back to transactions</Link>
        </Button>

        <Button variant={active === "detail" ? "gold" : "secondary"} size="sm" type="button" asChild>
          <Link href={detailHref}>Transaction detail</Link>
        </Button>

        <Button
          variant={active === "documents" ? "gold" : "secondary"}
          size="sm"
          type="button"
          asChild
        >
          <Link href={`${detailHref}/documents`}>Documents</Link>
        </Button>

        <Button
          variant={active === "first-pass" ? "gold" : "secondary"}
          size="sm"
          type="button"
          asChild
        >
          <Link href={`${detailHref}/first-pass`}>First Pass</Link>
        </Button>

        <Button variant={active === "edit" ? "gold" : "secondary"} size="sm" type="button" asChild>
          <Link href={`${detailHref}/edit`}>Edit transaction details</Link>
        </Button>

        <Button variant="secondary" size="sm" type="button" disabled>
          Assign Vendors (coming soon)
        </Button>
      </div>
    </section>
  );
}
