import { createClient } from "@/lib/supabase/server";

export async function getTransactionDetail(transactionId: string) {
  const supabase = await createClient();
  const { data: tx, error } = await supabase
    .from("transactions")
    .select(
      "id, status, close_date, closed_at, archived_at, property_address, mls_number, notes, first_pass_status, intake_data, created_at",
    )
    .eq("id", transactionId)
    .maybeSingle();

  if (error || !tx) return null;

  const { data: parties } = await supabase
    .from("transaction_parties")
    .select("id, user_id, display_name, party_role, contact_email, created_at")
    .eq("transaction_id", transactionId)
    .order("created_at", { ascending: true });

  return {
    ...tx,
    parties: parties ?? [],
  };
}

export async function getTransactionPartyDetail(
  transactionId: string,
  partyId: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transaction_parties")
    .select("id, user_id, transaction_id, display_name, party_role, contact_email, created_at")
    .eq("transaction_id", transactionId)
    .eq("id", partyId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
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

export async function getTransactionDocumentDetail(
  transactionId: string,
  documentId: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, transaction_id, category, status, file_name, mime_type, size_bytes, storage_path, visible_to_client, created_at, updated_at",
    )
    .eq("transaction_id", transactionId)
    .eq("id", documentId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
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
