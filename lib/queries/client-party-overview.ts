import { createClient } from "@/lib/supabase/server";

/** Minimal transaction fields safe for buyer/seller/title/mortgage headers (RLS-enforced). */
export type ClientPartyTransactionOverview = {
  property_address: string | null;
  status: string;
  close_date: string | null;
};

export async function getClientPartyTransactionOverview(
  transactionId: string,
): Promise<ClientPartyTransactionOverview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("property_address, status, close_date")
    .eq("id", transactionId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    property_address: data.property_address as string | null,
    status: String(data.status),
    close_date: data.close_date as string | null,
  };
}
