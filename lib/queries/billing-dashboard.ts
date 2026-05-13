import {
  formatBillingServiceCode,
  formatCurrencyFromCents,
  formatInvoiceStatus,
  formatReceivableStatus,
  nextInvoiceReminder,
  invoicePeriodKey,
} from "@/lib/billing/invoices";
import { createClient } from "@/lib/supabase/server";

export type BillingServiceTypeOption = {
  id: string;
  code: string;
  name: string;
  defaultAmountCents: number;
};

export type BillingSourceOption = {
  id: string;
  label: string;
};

export type BillingContactOption = {
  id: string;
  name: string;
  label: string;
  email: string | null;
  company: string | null;
  isBroker: boolean;
};

export type BillingInvoiceListItem = {
  id: string;
  invoiceNumber: string | null;
  brokerContactId: string | null;
  brokerName: string | null;
  status: string;
  statusLabel: string;
  receivableStatus: string;
  receivableStatusLabel: string;
  issueDate: string;
  dueDate: string | null;
  paidAt: string | null;
  taxCents: number;
  taxRatePercent: number;
  totalCents: number;
  balanceCents: number;
  receivedCents: number;
  taxOnReceivedCents: number;
  taxLabel: string;
  totalLabel: string;
  balanceLabel: string;
  receivedLabel: string;
  taxOnReceivedLabel: string;
  sourceLabel: string;
  accountingSyncStatus: string;
  paymentTerms: string;
  reminderLabel: string;
  reminderStatus: string;
  nextReminderDate: string | null;
  emailDeliveryStatus: string;
};

export type BillingPeriodSummary = {
  period: string;
  invoiceCount: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  balanceCents: number;
  receivedCents: number;
  taxOnReceivedCents: number;
  subtotalLabel: string;
  taxLabel: string;
  totalLabel: string;
  balanceLabel: string;
  receivedLabel: string;
  taxOnReceivedLabel: string;
};

export type BillingDashboardData = {
  serviceTypes: BillingServiceTypeOption[];
  transactions: BillingSourceOption[];
  mlsJobs: BillingSourceOption[];
  contacts: BillingContactOption[];
  invoices: BillingInvoiceListItem[];
  monthly: BillingPeriodSummary[];
  quarterly: BillingPeriodSummary[];
  yearly: BillingPeriodSummary[];
  taxReports: {
    nmQuarterly: BillingPeriodSummary[];
    federalQuarterly: BillingPeriodSummary[];
    yearEnd: BillingPeriodSummary[];
  };
};

export async function getBillingDashboardData(): Promise<BillingDashboardData> {
  const supabase = await createClient();
  const [serviceTypesRes, transactionsRes, mlsJobsRes, contactsRes, categoryRes, invoicesRes] = await Promise.all([
    supabase
      .from("billing_service_types")
      .select("id, code, name, default_amount_cents")
      .eq("active", true)
      .order("code", { ascending: true }),
    supabase
      .from("transactions")
      .select("id, property_address, mls_number")
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("mls_entry_jobs")
      .select("id, property_address, requesting_broker_name")
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("contacts")
      .select("id, full_name, email, company, is_broker_client")
      .order("full_name", { ascending: true })
      .limit(300),
    supabase
      .from("contact_category_assignments")
      .select("contact_id, category")
      .in("category", ["broker"]),
    supabase
      .from("billing_invoices")
      .select(
        "id, invoice_number, broker_contact_id, broker_name, status, receivable_status, issue_date, due_date, paid_at, subtotal_cents, tax_cents, tax_rate_percent, total_cents, balance_cents, source_transaction_id, source_mls_entry_job_id, accounting_sync_status, payment_terms, reminder_schedule, next_reminder_due_at, email_delivery_status",
      )
      .order("updated_at", { ascending: false })
      .limit(200),
  ]);

  if (serviceTypesRes.error) console.warn("[billing service types]", serviceTypesRes.error.message);
  if (transactionsRes.error) console.warn("[billing transactions]", transactionsRes.error.message);
  if (mlsJobsRes.error) console.warn("[billing mls jobs]", mlsJobsRes.error.message);
  if (contactsRes.error) console.warn("[billing contacts]", contactsRes.error.message);
  if (categoryRes.error) console.warn("[billing contact categories]", categoryRes.error.message);
  if (invoicesRes.error) console.warn("[billing invoices]", invoicesRes.error.message);

  const transactionsById = new Map(
    (transactionsRes.data ?? []).map((row) => [
      row.id as string,
      [row.property_address, row.mls_number ? `MLS #${row.mls_number}` : null]
        .filter(Boolean)
        .join(" · "),
    ]),
  );
  const mlsJobsById = new Map(
    (mlsJobsRes.data ?? []).map((row) => [
      row.id as string,
      [row.property_address, row.requesting_broker_name ? `Broker: ${row.requesting_broker_name}` : null]
        .filter(Boolean)
        .join(" · "),
    ]),
  );

  const brokerContactIds = new Set(
    (categoryRes.data ?? [])
      .filter((row) => row.category === "broker")
      .map((row) => row.contact_id as string),
  );
  const contacts: BillingContactOption[] = (contactsRes.data ?? [])
    .map((row) => {
      const name = (row.full_name as string | null)?.trim() || "Unnamed contact";
      const company = (row.company as string | null) ?? null;
      const email = (row.email as string | null) ?? null;
      const isBroker = Boolean(row.is_broker_client) || brokerContactIds.has(row.id as string);
      return {
        id: row.id as string,
        name,
        company,
        email,
        isBroker,
        label: [name, company, isBroker ? "broker" : null, email].filter(Boolean).join(" · "),
      };
    })
    .sort((a, b) => Number(b.isBroker) - Number(a.isBroker) || a.name.localeCompare(b.name));

  const invoices: BillingInvoiceListItem[] = (invoicesRes.data ?? []).map((row) => {
    const transactionId = row.source_transaction_id as string | null;
    const mlsJobId = row.source_mls_entry_job_id as string | null;
    const sourceLabel = transactionId
      ? `Transaction: ${transactionsById.get(transactionId) ?? transactionId}`
      : mlsJobId
        ? `MLS entry: ${mlsJobsById.get(mlsJobId) ?? mlsJobId}`
        : "Manual invoice";
    const totalCents = Number(row.total_cents ?? 0);
    const balanceCents = Number(row.balance_cents ?? 0);
    const taxCents = Number(row.tax_cents ?? 0);
    const receivedCents = Math.max(0, totalCents - balanceCents);
    const taxOnReceivedCents =
      totalCents > 0 ? Math.round(taxCents * (receivedCents / totalCents)) : 0;
    const reminder = nextInvoiceReminder({
      issueDate: row.issue_date as string,
      dueDate: (row.due_date as string | null) ?? null,
      balanceCents,
      receivableStatus: row.receivable_status as string,
      reminderDays: Array.isArray(row.reminder_schedule)
        ? (row.reminder_schedule as number[])
        : undefined,
    });
    return {
      id: row.id as string,
      invoiceNumber: (row.invoice_number as string | null) ?? null,
      brokerContactId: (row.broker_contact_id as string | null) ?? null,
      brokerName: (row.broker_name as string | null) ?? null,
      status: row.status as string,
      statusLabel: formatInvoiceStatus(row.status as string),
      receivableStatus: row.receivable_status as string,
      receivableStatusLabel: formatReceivableStatus(row.receivable_status as string),
      issueDate: row.issue_date as string,
      dueDate: (row.due_date as string | null) ?? null,
      paidAt: (row.paid_at as string | null)?.slice(0, 10) ?? null,
      taxCents,
      taxRatePercent: Number(row.tax_rate_percent ?? 0),
      totalCents,
      balanceCents,
      receivedCents,
      taxOnReceivedCents,
      taxLabel: formatCurrencyFromCents(taxCents),
      totalLabel: formatCurrencyFromCents(totalCents),
      balanceLabel: formatCurrencyFromCents(balanceCents),
      receivedLabel: formatCurrencyFromCents(receivedCents),
      taxOnReceivedLabel: formatCurrencyFromCents(taxOnReceivedCents),
      sourceLabel,
      accountingSyncStatus: (row.accounting_sync_status as string | null) ?? "not_configured",
      paymentTerms: (row.payment_terms as string | null) ?? "due_on_receipt",
      reminderLabel: reminder.label,
      reminderStatus: reminder.status,
      nextReminderDate: (row.next_reminder_due_at as string | null) ?? reminder.nextDate,
      emailDeliveryStatus: (row.email_delivery_status as string | null) ?? "not_configured",
    };
  });
  const quarterSummary = summarizeByPeriod(invoices, "quarter");
  const yearSummary = summarizeByPeriod(invoices, "year");

  return {
    serviceTypes: (serviceTypesRes.data ?? []).map((row) => ({
      id: row.id as string,
      code: row.code as string,
      name: (row.name as string | null) ?? formatBillingServiceCode(row.code as string),
      defaultAmountCents: Number(row.default_amount_cents ?? 0),
    })),
    transactions: (transactionsRes.data ?? []).map((row) => ({
      id: row.id as string,
      label:
        [row.property_address, row.mls_number ? `MLS #${row.mls_number}` : null]
          .filter(Boolean)
          .join(" · ") || "Transaction",
    })),
    mlsJobs: (mlsJobsRes.data ?? []).map((row) => ({
      id: row.id as string,
      label:
        [row.property_address, row.requesting_broker_name ? `Broker: ${row.requesting_broker_name}` : null]
          .filter(Boolean)
          .join(" · ") || "MLS entry job",
    })),
    contacts,
    invoices,
    monthly: summarizeByPeriod(invoices, "month"),
    quarterly: quarterSummary,
    yearly: yearSummary,
    taxReports: {
      nmQuarterly: quarterSummary,
      federalQuarterly: quarterSummary,
      yearEnd: yearSummary,
    },
  };
}

function summarizeByPeriod(
  invoices: BillingInvoiceListItem[],
  period: "month" | "quarter" | "year",
): BillingPeriodSummary[] {
  const map = new Map<
    string,
    {
      invoiceCount: number;
      subtotalCents: number;
      taxCents: number;
      totalCents: number;
      balanceCents: number;
      receivedCents: number;
      taxOnReceivedCents: number;
    }
  >();
  for (const invoice of invoices) {
    const key = invoicePeriodKey(invoice.issueDate, period);
    const current = map.get(key) ?? {
      invoiceCount: 0,
      subtotalCents: 0,
      taxCents: 0,
      totalCents: 0,
      balanceCents: 0,
      receivedCents: 0,
      taxOnReceivedCents: 0,
    };
    current.invoiceCount += 1;
    current.subtotalCents += invoice.totalCents - invoice.taxCents;
    current.taxCents += invoice.taxCents;
    current.totalCents += invoice.totalCents;
    current.balanceCents += invoice.balanceCents;
    current.receivedCents += invoice.receivedCents;
    current.taxOnReceivedCents += invoice.taxOnReceivedCents;
    map.set(key, current);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 6)
    .map(([key, value]) => ({
      period: key,
      ...value,
      subtotalLabel: formatCurrencyFromCents(value.subtotalCents),
      taxLabel: formatCurrencyFromCents(value.taxCents),
      totalLabel: formatCurrencyFromCents(value.totalCents),
      balanceLabel: formatCurrencyFromCents(value.balanceCents),
      receivedLabel: formatCurrencyFromCents(value.receivedCents),
      taxOnReceivedLabel: formatCurrencyFromCents(value.taxOnReceivedCents),
    }));
}
