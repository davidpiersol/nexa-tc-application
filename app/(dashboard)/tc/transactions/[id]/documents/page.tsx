import { TransactionDocumentsClient } from "@/components/tc/transaction-documents-client";
import {
  listDocumentsForTransaction,
  listTransactionDocumentSelections,
} from "@/lib/queries/transaction-detail";
import { resolveSigningPreferenceForTransaction } from "@/lib/signing/broker-signing-preference";
import { createClient } from "@/lib/supabase/server";

type Props = { params: { id: string } };

/**
 * Figma: **Document Manager/Default** → `/tc/transactions/[id]/documents`
 */
export default async function TransactionDocumentsPage({ params }: Props) {
  const supabase = await createClient();
  const [rows, selections, txnRes] = await Promise.all([
    listDocumentsForTransaction(params.id),
    listTransactionDocumentSelections(params.id),
    supabase.from("transactions").select("tenant_id").eq("id", params.id).maybeSingle(),
  ]);

  let signingPreference: { slug: string; label: string } | null = null;
  if (txnRes.data?.tenant_id) {
    const { workflow } = await resolveSigningPreferenceForTransaction({
      admin: supabase,
      tenantId: txnRes.data.tenant_id as string,
      transactionId: params.id,
    });
    signingPreference = { slug: workflow.slug, label: workflow.label };
  }

  const docs = rows.map((d) => ({
    id: d.id,
    category: d.category,
    status: d.status,
    file_name: d.file_name,
    created_at: d.created_at,
    can_export: d.can_export,
  }));

  return (
    <TransactionDocumentsClient
      transactionId={params.id}
      initialDocs={docs}
      initialSelections={selections}
      signingPreference={signingPreference}
    />
  );
}
