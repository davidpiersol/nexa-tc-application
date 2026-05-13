export const MLS_ENTRY_JOB_STATUSES = [
  "draft",
  "ready_for_entry",
  "submitted",
  "completed",
  "cancelled",
] as const;

export type MlsEntryJobStatus = (typeof MLS_ENTRY_JOB_STATUSES)[number];

export const MLS_ENTRY_BILLING_STATUSES = [
  "not_invoiced",
  "ready_to_invoice",
  "invoiced",
  "paid",
  "waived",
] as const;

export type MlsEntryBillingStatus = (typeof MLS_ENTRY_BILLING_STATUSES)[number];

export type MlsEntryJobInput = {
  requesting_broker_name?: string | null;
  listing_broker_name?: string | null;
  listing_client_name?: string | null;
  seller_names?: string | null;
  property_address?: string | null;
  property_legal_description?: string | null;
  property_type?: string | null;
  parcel_number?: string | null;
  acreage?: string | null;
  list_price?: string | number | null;
  mls_number?: string | null;
  general_notes?: string | null;
  status?: string | null;
  billing_status?: string | null;
};

export function formatMlsEntryJobStatus(status: string | null | undefined): string {
  switch (status) {
    case "ready_for_entry":
      return "Ready for MLS entry";
    case "submitted":
      return "Submitted to MLS";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "draft":
    default:
      return "Draft";
  }
}

export function formatMlsEntryBillingStatus(status: string | null | undefined): string {
  switch (status) {
    case "ready_to_invoice":
      return "Ready to invoice";
    case "invoiced":
      return "Invoiced";
    case "paid":
      return "Paid";
    case "waived":
      return "Waived";
    case "not_invoiced":
    default:
      return "Not invoiced";
  }
}

export function normalizeMlsEntryJobStatus(value: string | null | undefined): MlsEntryJobStatus {
  return MLS_ENTRY_JOB_STATUSES.includes(value as MlsEntryJobStatus)
    ? (value as MlsEntryJobStatus)
    : "draft";
}

export function normalizeMlsEntryBillingStatus(
  value: string | null | undefined,
): MlsEntryBillingStatus {
  return MLS_ENTRY_BILLING_STATUSES.includes(value as MlsEntryBillingStatus)
    ? (value as MlsEntryBillingStatus)
    : "not_invoiced";
}

function text(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeMlsEntryJobInput(input: MlsEntryJobInput) {
  const rawPrice =
    typeof input.list_price === "number"
      ? input.list_price
      : Number(String(input.list_price ?? "").replace(/[$,]/g, "").trim());
  const listPrice = Number.isFinite(rawPrice) && rawPrice >= 0 ? rawPrice : null;

  return {
    requesting_broker_name: text(input.requesting_broker_name),
    listing_broker_name: text(input.listing_broker_name),
    listing_client_name: text(input.listing_client_name),
    seller_names: text(input.seller_names),
    property_address: text(input.property_address),
    property_legal_description: text(input.property_legal_description),
    property_type: text(input.property_type),
    parcel_number: text(input.parcel_number),
    acreage: text(input.acreage),
    list_price: listPrice,
    mls_number: text(input.mls_number),
    general_notes: text(input.general_notes),
    status: normalizeMlsEntryJobStatus(input.status),
    billing_status: normalizeMlsEntryBillingStatus(input.billing_status),
  };
}
