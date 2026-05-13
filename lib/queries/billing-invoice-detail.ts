import { notFound } from "next/navigation";
import {
  formatCurrencyFromCents,
  formatInvoiceStatus,
  formatReceivableStatus,
  nextInvoiceReminder,
} from "@/lib/billing/invoices";
import { createClient } from "@/lib/supabase/server";

type BillingLineRow = {
  id: string;
  description: string | null;
  quantity: string | number | null;
  unit_amount_cents: number | null;
  line_total_cents: number | null;
};

function formatPaymentTerms(value: unknown): string {
  switch (String(value ?? "")) {
    case "due_on_receipt":
      return "Payable upon receipt";
    case "net_30":
      return "Net 30";
    case "custom":
      return "Custom terms";
    default:
      return "Payable upon receipt";
  }
}

export type BillingInvoiceDetail = {
  id: string;
  invoiceNumber: string | null;
  brokerName: string | null;
  statusLabel: string;
  receivableStatusLabel: string;
  issueDate: string;
  dueDate: string | null;
  subtotalLabel: string;
  taxLabel: string;
  totalLabel: string;
  balanceLabel: string;
  taxRatePercent: number;
  paymentTerms: string;
  reminderLabel: string;
  emailDeliveryStatus: string;
  accountingSyncStatus: string;
  notes: string | null;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: string;
    unitAmountLabel: string;
    lineTotalLabel: string;
  }>;
};

export async function getBillingInvoiceDetail(id: string): Promise<BillingInvoiceDetail> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("billing_invoices")
    .select("*, billing_invoice_line_items(*)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  const balanceCents = Number(data.balance_cents ?? 0);
  const reminder = nextInvoiceReminder({
    issueDate: data.issue_date as string,
    dueDate: (data.due_date as string | null) ?? null,
    balanceCents,
    receivableStatus: data.receivable_status as string,
    reminderDays: Array.isArray(data.reminder_schedule)
      ? (data.reminder_schedule as number[])
      : undefined,
  });
  const lineRows: BillingLineRow[] = Array.isArray(data.billing_invoice_line_items)
    ? (data.billing_invoice_line_items as BillingLineRow[])
    : [];

  return {
    id: data.id as string,
    invoiceNumber: (data.invoice_number as string | null) ?? null,
    brokerName: (data.broker_name as string | null) ?? null,
    statusLabel: formatInvoiceStatus(data.status as string),
    receivableStatusLabel: formatReceivableStatus(data.receivable_status as string),
    issueDate: data.issue_date as string,
    dueDate: (data.due_date as string | null) ?? null,
    subtotalLabel: formatCurrencyFromCents(Number(data.subtotal_cents ?? 0)),
    taxLabel: formatCurrencyFromCents(Number(data.tax_cents ?? 0)),
    totalLabel: formatCurrencyFromCents(Number(data.total_cents ?? 0)),
    balanceLabel: formatCurrencyFromCents(balanceCents),
    taxRatePercent: Number(data.tax_rate_percent ?? 0),
    paymentTerms: formatPaymentTerms(data.payment_terms),
    reminderLabel: reminder.label,
    emailDeliveryStatus: String(data.email_delivery_status ?? "not_configured").replace(/_/g, " "),
    accountingSyncStatus: String(data.accounting_sync_status ?? "not_configured").replace(/_/g, " "),
    notes: (data.notes as string | null) ?? null,
    lineItems: lineRows.map((row) => ({
      id: row.id as string,
      description: String(row.description ?? "Service"),
      quantity: String(row.quantity ?? "1"),
      unitAmountLabel: formatCurrencyFromCents(Number(row.unit_amount_cents ?? 0)),
      lineTotalLabel: formatCurrencyFromCents(Number(row.line_total_cents ?? 0)),
    })),
  };
}
