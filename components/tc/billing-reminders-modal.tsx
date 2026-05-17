"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { BillingReminderItem } from "@/lib/queries/tc-dashboard";

export function BillingRemindersModal({ reminders }: { reminders: BillingReminderItem[] }) {
  const [open, setOpen] = useState(false);
  const pastDueCount = reminders.filter((item) => item.reminderStatus === "past_due").length;

  if (reminders.length === 0) return null;

  return (
    <div className="rounded-brand-lg border border-brand-gold/40 bg-brand-gold/10 p-4 font-sans text-sm text-brand-navy">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-heading-sm">Invoice follow-ups</p>
          <p className="text-neutral-700">
            {pastDueCount} past due · {reminders.length} open reminder(s)
          </p>
        </div>
        <Button type="button" variant="gold" onClick={() => setOpen(true)}>
          Review invoices
        </Button>
      </div>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Invoice reminders"
        description="Past-due and scheduled invoice follow-ups for open balances."
        className="max-w-2xl"
      >
        <ul className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
          {reminders.map((item) => (
            <li key={item.id} className="rounded-brand-md border border-neutral-200 p-3">
              <Link
                href={`/tc/billing/${item.id}`}
                className="font-semibold text-brand-navy underline-offset-4 hover:underline"
              >
                {item.invoiceNumber ?? "Draft invoice"} · {item.balanceLabel}
              </Link>
              <p className="mt-1 text-sm text-neutral-700">
                {item.brokerName ?? "Broker TBD"} · Due {item.dueDate ?? item.issueDate}
              </p>
              <p className="mt-1 text-xs text-neutral-600">{item.reminderLabel}</p>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
