import { TransactionDocumentsClient } from "@/components/tc/transaction-documents-client";
import {
  listDocumentsForTransaction,
  listTransactionDocumentSelections,
} from "@/lib/queries/transaction-detail";

type Props = { params: { id: string } };

/**
 * Figma: **Document Manager/Default** → `/tc/transactions/[id]/documents`
 */
export default async function TransactionDocumentsPage({ params }: Props) {
  const [rows, selections] = await Promise.all([
    listDocumentsForTransaction(params.id),
    listTransactionDocumentSelections(params.id),
  ]);
  const docs = rows.map((d) => ({
    id: d.id,
    category: d.category,
    status: d.status,
    file_name: d.file_name,
    created_at: d.created_at,
  }));

  return (
    <TransactionDocumentsClient
      transactionId={params.id}
      initialDocs={docs}
      initialSelections={selections}
    />
  );
}
