import Link from "next/link";
import { TransactionEditorForm } from "@/components/tc/transaction-editor-form";
import { Button } from "@/components/ui/button";

export default function NewTransactionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 border-b border-neutral-300 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-heading-lg text-brand-navy">New transaction</h2>
          <p className="mt-1 font-sans text-ui-body text-neutral-600">
            Add a transaction to your TC workspace.
          </p>
        </div>
        <Button variant="secondary" type="button" asChild>
          <Link href="/tc/transactions">Back to transactions</Link>
        </Button>
      </div>

      <TransactionEditorForm
        mode="create"
        initial={{
          status: "draft",
          property_address: "",
          mls_number: "",
          close_date: "",
          notes: "",
        }}
      />
    </div>
  );
}
