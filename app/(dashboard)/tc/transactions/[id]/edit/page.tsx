import { notFound } from "next/navigation";
import { TransactionEditorForm } from "@/components/tc/transaction-editor-form";
import { getTransactionDetail } from "@/lib/queries/transaction-detail";

type Props = { params: { id: string } };

export default async function TransactionEditPage({ params }: Props) {
  const transaction = await getTransactionDetail(params.id);
  if (!transaction) notFound();

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
          Transaction · {transaction.mls_number ? `MLS #${transaction.mls_number}` : transaction.id}
        </p>
        <h2 className="mt-2 font-display text-heading-lg text-brand-navy">Edit transaction details</h2>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          Update core details and intake fields for this transaction.
        </p>
      </header>

      <TransactionEditorForm
        mode="edit"
        initial={{
          id: transaction.id,
          status: transaction.status as
            | "draft"
            | "active"
            | "under_contract"
            | "pending_close"
            | "closed"
            | "cancelled",
          property_address: transaction.property_address,
          mls_number: transaction.mls_number,
          close_date: transaction.close_date,
          notes: transaction.notes,
          intake_data: transaction.intake_data ?? {},
        }}
      />
    </div>
  );
}
