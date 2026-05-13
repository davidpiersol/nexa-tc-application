import { createClient } from "@/lib/supabase/server";

export type BrokerDocumentRow = {
  id: string;
  status: string;
  category: string;
  file_name: string | null;
  created_at: string;
};

export async function listBrokerVisibleDocuments(
  transactionId: string,
): Promise<BrokerDocumentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, status, category, file_name, created_at")
    .eq("transaction_id", transactionId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return [];
  return (data ?? []) as BrokerDocumentRow[];
}
