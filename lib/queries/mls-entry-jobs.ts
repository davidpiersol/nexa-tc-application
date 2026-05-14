import { notFound } from "next/navigation";
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

export type MlsEntryJobDetail = MlsEntryJobListItem & {
  propertyLegalDescription: string | null;
  parcelNumber: string | null;
  acreage: string | null;
  generalNotes: string | null;
  createdAt: string;
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

export async function getMlsEntryJobDetail(id: string): Promise<MlsEntryJobDetail> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mls_entry_jobs")
    .select(
      "id, status, billing_status, requesting_broker_name, listing_broker_name, listing_client_name, seller_names, property_address, property_legal_description, property_type, parcel_number, acreage, list_price, mls_number, general_notes, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  return {
    id: data.id as string,
    status: data.status as string,
    statusLabel: formatMlsEntryJobStatus(data.status as string),
    billingStatus: data.billing_status as string,
    billingStatusLabel: formatMlsEntryBillingStatus(data.billing_status as string),
    requestingBrokerName: (data.requesting_broker_name as string | null) ?? null,
    listingBrokerName: (data.listing_broker_name as string | null) ?? null,
    listingClientName: (data.listing_client_name as string | null) ?? null,
    sellerNames: (data.seller_names as string | null) ?? null,
    propertyAddress: (data.property_address as string | null) ?? null,
    propertyLegalDescription: (data.property_legal_description as string | null) ?? null,
    propertyType: (data.property_type as string | null) ?? null,
    parcelNumber: (data.parcel_number as string | null) ?? null,
    acreage: (data.acreage as string | null) ?? null,
    listPrice:
      typeof data.list_price === "number"
        ? data.list_price
        : data.list_price
          ? Number(data.list_price)
          : null,
    mlsNumber: (data.mls_number as string | null) ?? null,
    generalNotes: (data.general_notes as string | null) ?? null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}
