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

  const { data: assignments } = await supabase
    .from("transaction_contact_assignments")
    .select(
      "id, contact_id, assignment_role, assignment_category, notes, created_at, contacts(id, full_name, email, phone, company)",
    )
    .eq("transaction_id", transactionId)
    .order("created_at", { ascending: true });

  return {
    ...tx,
    parties: parties ?? [],
    assignments: (assignments ?? []).map((assignment) => {
      const contact = Array.isArray(assignment.contacts)
        ? assignment.contacts[0]
        : assignment.contacts;
      return {
        id: assignment.id,
        contactId: assignment.contact_id,
        assignmentRole: assignment.assignment_role,
        assignmentCategory: assignment.assignment_category,
        notes: assignment.notes,
        createdAt: assignment.created_at,
        contact: contact
          ? {
              id: contact.id,
              fullName: contact.full_name,
              email: contact.email,
              phone: contact.phone,
              company: contact.company,
            }
          : null,
      };
    }),
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

export type TransactionDocumentSummary = {
  id: string;
  category: string;
  status: string;
  file_name: string | null;
  mime_type: string | null;
  created_at: string;
  updated_at?: string | null;
  visible_to_client?: boolean;
  /** Stored file exists (ZIP packet + signing payloads). */
  can_export: boolean;
};

export async function listDocumentsForTransaction(
  transactionId: string,
): Promise<TransactionDocumentSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, category, status, file_name, mime_type, created_at, updated_at, visible_to_client, storage_path",
    )
    .eq("transaction_id", transactionId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map(({ storage_path, ...pub }) => ({
    ...pub,
    can_export: Boolean(storage_path),
  }));
}

export type TransactionDocumentSelectionRow = {
  id: string;
  template_id: string;
  template_version_id: string | null;
  selection_state: string;
  document_status: string;
  notes: string | null;
  created_at: string;
  template: {
    id: string;
    form_number: string;
    title: string;
    category: string;
    jurisdiction_state: string;
    availability_status: string;
  } | null;
  version: {
    id: string;
    version_label: string;
    storage_path: string;
  } | null;
};

export async function listTransactionDocumentSelections(
  transactionId: string,
): Promise<TransactionDocumentSelectionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transaction_document_selections")
    .select(
      "id, template_id, template_version_id, selection_state, document_status, notes, created_at, global_document_templates(id, form_number, title, category, jurisdiction_state, availability_status), global_document_template_versions(id, version_label, storage_path)",
    )
    .eq("transaction_id", transactionId)
    .order("created_at", { ascending: true });

  if (error) return [];

  return (data ?? []).map((row) => {
    const template = Array.isArray(row.global_document_templates)
      ? row.global_document_templates[0]
      : row.global_document_templates;
    const version = Array.isArray(row.global_document_template_versions)
      ? row.global_document_template_versions[0]
      : row.global_document_template_versions;
    return {
      id: row.id,
      template_id: row.template_id,
      template_version_id: row.template_version_id,
      selection_state: row.selection_state,
      document_status: row.document_status,
      notes: row.notes,
      created_at: row.created_at,
      template: template
        ? {
            id: template.id,
            form_number: template.form_number,
            title: template.title,
            category: template.category,
            jurisdiction_state: template.jurisdiction_state,
            availability_status: template.availability_status,
          }
        : null,
      version: version
        ? {
            id: version.id,
            version_label: version.version_label,
            storage_path: version.storage_path,
          }
        : null,
    };
  });
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
