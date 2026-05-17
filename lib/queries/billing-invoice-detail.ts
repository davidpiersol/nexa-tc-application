import { notFound } from "next/navigation";
import {
  formatCurrencyFromCents,
  formatInvoiceStatus,
  formatPaymentTerms,
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

export type BillingInvoiceDetail = {
  id: string;
  invoiceNumber: string | null;
  brokerContactId: string | null;
  brokerName: string | null;
  brokerEmail: string | null;
  status: string;
  statusLabel: string;
  receivableStatus: string;
  receivableStatusLabel: string;
  issueDate: string;
  dueDate: string | null;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  balanceCents: number;
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
  const brokerContactId = (data.broker_contact_id as string | null) ?? null;
  const { data: brokerContact } = brokerContactId
    ? await supabase
        .from("contacts")
        .select("email")
        .eq("id", brokerContactId)
        .maybeSingle()
    : { data: null };

  return {
    id: data.id as string,
    invoiceNumber: (data.invoice_number as string | null) ?? null,
    brokerContactId,
    brokerName: (data.broker_name as string | null) ?? null,
    brokerEmail: (brokerContact?.email as string | null) ?? null,
    status: data.status as string,
    statusLabel: formatInvoiceStatus(data.status as string),
    receivableStatus: data.receivable_status as string,
    receivableStatusLabel: formatReceivableStatus(data.receivable_status as string),
    issueDate: data.issue_date as string,
    dueDate: (data.due_date as string | null) ?? null,
    subtotalCents: Number(data.subtotal_cents ?? 0),
    taxCents: Number(data.tax_cents ?? 0),
    totalCents: Number(data.total_cents ?? 0),
    balanceCents,
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
