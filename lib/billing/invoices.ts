export const BILLING_SERVICE_CODES = [
  "full_tc_transaction",
  "mls_only_job",
  "custom",
] as const;

export type BillingServiceCode = (typeof BILLING_SERVICE_CODES)[number];

export const BILLING_INVOICE_STATUSES = [
  "draft",
  "sent",
  "paid",
  "void",
  "cancelled",
] as const;

export type BillingInvoiceStatus = (typeof BILLING_INVOICE_STATUSES)[number];

export const BILLING_RECEIVABLE_STATUSES = [
  "not_sent",
  "sent",
  "partially_paid",
  "paid",
  "overdue",
  "void",
] as const;

export type BillingReceivableStatus = (typeof BILLING_RECEIVABLE_STATUSES)[number];

export type InvoiceLineInput = {
  quantity: number;
  unitAmountCents: number;
};

export function formatBillingServiceCode(code: string | null | undefined): string {
  switch (code) {
    case "full_tc_transaction":
      return "Full TC transaction";
    case "mls_only_job":
      return "MLS-only entry";
    case "custom":
    default:
      return "Custom service";
  }
}

export function formatInvoiceStatus(status: string | null | undefined): string {
  switch (status) {
    case "sent":
      return "Sent";
    case "paid":
      return "Paid";
    case "void":
      return "Void";
    case "cancelled":
      return "Cancelled";
    case "draft":
    default:
      return "Draft";
  }
}

export function formatReceivableStatus(status: string | null | undefined): string {
  switch (status) {
    case "sent":
      return "Sent";
    case "partially_paid":
      return "Partially paid";
    case "paid":
      return "Paid";
    case "overdue":
      return "Overdue";
    case "void":
      return "Void";
    case "not_sent":
    default:
      return "Not sent";
  }
}

export function normalizeBillingServiceCode(value: string | null | undefined): BillingServiceCode {
  return BILLING_SERVICE_CODES.includes(value as BillingServiceCode)
    ? (value as BillingServiceCode)
    : "custom";
}

export function normalizeInvoiceStatus(value: string | null | undefined): BillingInvoiceStatus {
  return BILLING_INVOICE_STATUSES.includes(value as BillingInvoiceStatus)
    ? (value as BillingInvoiceStatus)
    : "draft";
}

export function normalizeReceivableStatus(
  value: string | null | undefined,
): BillingReceivableStatus {
  return BILLING_RECEIVABLE_STATUSES.includes(value as BillingReceivableStatus)
    ? (value as BillingReceivableStatus)
    : "not_sent";
}

export function centsFromCurrencyInput(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : 0;
  }
  const raw = String(value ?? "").replace(/[$,\s]/g, "");
  if (!raw) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : 0;
}

export function formatCurrencyFromCents(cents: number | null | undefined): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format((cents ?? 0) / 100);
}

export function calculateLineTotalCents(quantity: number, unitAmountCents: number): number {
  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  const safeUnit = Number.isFinite(unitAmountCents) && unitAmountCents >= 0 ? unitAmountCents : 0;
  return Math.round(safeQuantity * safeUnit);
}

export function calculateInvoiceTotals(
  lines: InvoiceLineInput[],
  taxCents = 0,
  paidCents = 0,
): {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  balanceCents: number;
} {
  const subtotalCents = lines.reduce(
    (sum, line) => sum + calculateLineTotalCents(line.quantity, line.unitAmountCents),
    0,
  );
  const safeTax = Number.isFinite(taxCents) && taxCents >= 0 ? Math.round(taxCents) : 0;
  const safePaid = Number.isFinite(paidCents) && paidCents >= 0 ? Math.round(paidCents) : 0;
  const totalCents = subtotalCents + safeTax;
  return {
    subtotalCents,
    taxCents: safeTax,
    totalCents,
    balanceCents: Math.max(0, totalCents - safePaid),
  };
}

export function deriveReceivableStatus(input: {
  invoiceStatus: BillingInvoiceStatus;
  currentReceivableStatus?: BillingReceivableStatus;
  balanceCents: number;
  dueDate?: string | null;
  now?: Date;
}): BillingReceivableStatus {
  if (input.invoiceStatus === "void" || input.invoiceStatus === "cancelled") return "void";
  if (input.invoiceStatus === "draft") return "not_sent";
  if (input.invoiceStatus === "paid" || input.balanceCents === 0) return "paid";

  const now = input.now ?? new Date();
  if (input.dueDate) {
    const due = new Date(`${input.dueDate}T23:59:59`);
    if (!Number.isNaN(due.getTime()) && due < now) return "overdue";
  }

  if (input.currentReceivableStatus === "partially_paid") return "partially_paid";
  return "sent";
}

export function invoicePeriodKey(date: string | Date, period: "month" | "quarter" | "year"): string {
  const value = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  const year = value.getFullYear();
  if (period === "year") return String(year);
  if (period === "quarter") return `${year}-Q${Math.floor(value.getMonth() / 3) + 1}`;
  return `${year}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}
