import {
  formatBillingServiceCode,
  formatCurrencyFromCents,
  formatInvoiceStatus,
  formatReceivableStatus,
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

export type BillingInvoiceListItem = {
  id: string;
  invoiceNumber: string | null;
  brokerName: string | null;
  status: string;
  statusLabel: string;
  receivableStatus: string;
  receivableStatusLabel: string;
  issueDate: string;
  dueDate: string | null;
  totalCents: number;
  balanceCents: number;
  totalLabel: string;
  balanceLabel: string;
  sourceLabel: string;
  accountingSyncStatus: string;
};

export type BillingPeriodSummary = {
  period: string;
  invoiceCount: number;
  totalCents: number;
  balanceCents: number;
  totalLabel: string;
  balanceLabel: string;
};

export type BillingDashboardData = {
  serviceTypes: BillingServiceTypeOption[];
  transactions: BillingSourceOption[];
  mlsJobs: BillingSourceOption[];
  invoices: BillingInvoiceListItem[];
  monthly: BillingPeriodSummary[];
  quarterly: BillingPeriodSummary[];
  yearly: BillingPeriodSummary[];
};

export async function getBillingDashboardData(): Promise<BillingDashboardData> {
  const supabase = await createClient();
  const [serviceTypesRes, transactionsRes, mlsJobsRes, invoicesRes] = await Promise.all([
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
      .from("billing_invoices")
      .select(
        "id, invoice_number, broker_name, status, receivable_status, issue_date, due_date, total_cents, balance_cents, source_transaction_id, source_mls_entry_job_id, accounting_sync_status",
      )
      .order("updated_at", { ascending: false })
      .limit(200),
  ]);

  if (serviceTypesRes.error) console.warn("[billing service types]", serviceTypesRes.error.message);
  if (transactionsRes.error) console.warn("[billing transactions]", transactionsRes.error.message);
  if (mlsJobsRes.error) console.warn("[billing mls jobs]", mlsJobsRes.error.message);
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
    return {
      id: row.id as string,
      invoiceNumber: (row.invoice_number as string | null) ?? null,
      brokerName: (row.broker_name as string | null) ?? null,
      status: row.status as string,
      statusLabel: formatInvoiceStatus(row.status as string),
      receivableStatus: row.receivable_status as string,
      receivableStatusLabel: formatReceivableStatus(row.receivable_status as string),
      issueDate: row.issue_date as string,
      dueDate: (row.due_date as string | null) ?? null,
      totalCents,
      balanceCents,
      totalLabel: formatCurrencyFromCents(totalCents),
      balanceLabel: formatCurrencyFromCents(balanceCents),
      sourceLabel,
      accountingSyncStatus: (row.accounting_sync_status as string | null) ?? "not_configured",
    };
  });

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
    invoices,
    monthly: summarizeByPeriod(invoices, "month"),
    quarterly: summarizeByPeriod(invoices, "quarter"),
    yearly: summarizeByPeriod(invoices, "year"),
  };
}

function summarizeByPeriod(
  invoices: BillingInvoiceListItem[],
  period: "month" | "quarter" | "year",
): BillingPeriodSummary[] {
  const map = new Map<string, { invoiceCount: number; totalCents: number; balanceCents: number }>();
  for (const invoice of invoices) {
    const key = invoicePeriodKey(invoice.issueDate, period);
    const current = map.get(key) ?? { invoiceCount: 0, totalCents: 0, balanceCents: 0 };
    current.invoiceCount += 1;
    current.totalCents += invoice.totalCents;
    current.balanceCents += invoice.balanceCents;
    map.set(key, current);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 6)
    .map(([key, value]) => ({
      period: key,
      ...value,
      totalLabel: formatCurrencyFromCents(value.totalCents),
      balanceLabel: formatCurrencyFromCents(value.balanceCents),
    }));
}
