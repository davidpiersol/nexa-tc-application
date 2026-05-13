import { formatMlsEntryBillingStatus, formatMlsEntryJobStatus } from "@/lib/mls/mls-entry-job";
import { createClient } from "@/lib/supabase/server";

export type MlsEntryJobListItem = {
  id: string;
  status: string;
  statusLabel: string;
  billingStatus: string;
  billingStatusLabel: string;
  requestingBrokerName: string | null;
  listingBrokerName: string | null;
  listingClientName: string | null;
  sellerNames: string | null;
  propertyAddress: string | null;
  propertyType: string | null;
  listPrice: number | null;
  mlsNumber: string | null;
  updatedAt: string;
};

export async function getMlsEntryJobs(): Promise<MlsEntryJobListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mls_entry_jobs")
    .select(
      "id, status, billing_status, requesting_broker_name, listing_broker_name, listing_client_name, seller_names, property_address, property_type, list_price, mls_number, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    console.warn("[getMlsEntryJobs]", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    status: row.status as string,
    statusLabel: formatMlsEntryJobStatus(row.status as string),
    billingStatus: row.billing_status as string,
    billingStatusLabel: formatMlsEntryBillingStatus(row.billing_status as string),
    requestingBrokerName: (row.requesting_broker_name as string | null) ?? null,
    listingBrokerName: (row.listing_broker_name as string | null) ?? null,
    listingClientName: (row.listing_client_name as string | null) ?? null,
    sellerNames: (row.seller_names as string | null) ?? null,
    propertyAddress: (row.property_address as string | null) ?? null,
    propertyType: (row.property_type as string | null) ?? null,
    listPrice:
      typeof row.list_price === "number"
        ? row.list_price
        : row.list_price
          ? Number(row.list_price)
          : null,
    mlsNumber: (row.mls_number as string | null) ?? null,
    updatedAt: row.updated_at as string,
  }));
}
