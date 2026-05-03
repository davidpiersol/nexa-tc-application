import { createClient } from "@/lib/supabase/server";

export async function getTransactionDetail(transactionId: string) {
  const supabase = await createClient();
  const { data: tx, error } = await supabase
    .from("transactions")
    .select(
      "id, status, close_date, property_address, mls_number, notes, first_pass_status, created_at",
    )
    .eq("id", transactionId)
    .maybeSingle();

  if (error || !tx) return null;

  const { data: parties } = await supabase
    .from("transaction_parties")
    .select("display_name, party_role, contact_email")
    .eq("transaction_id", transactionId)
    .order("created_at", { ascending: true });

  return {
    ...tx,
    parties: parties ?? [],
  };
}

export async function listDocumentsForTransaction(transactionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, category, status, file_name, mime_type, created_at, updated_at, visible_to_client",
    )
    .eq("transaction_id", transactionId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function listChecklistItemsForTransaction(transactionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checklist_items")
    .select("id, title, completed, due_date, sort_order")
    .eq("transaction_id", transactionId)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data ?? [];
}
