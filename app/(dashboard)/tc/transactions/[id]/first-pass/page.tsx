import { Suspense } from "react";
import { FirstPassReview } from "@/components/ui/first-pass-review";
import { FirstPassChecklistClient } from "@/components/tc/first-pass-checklist-client";
import { getFirstPassBundle } from "@/lib/queries/first-pass";
import { listChecklistItemsForTransaction } from "@/lib/queries/transaction-detail";

type Props = { params: { id: string } };

function FirstPassSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-brand-lg border border-neutral-200 bg-neutral-50 p-6">
      <div className="h-32 rounded bg-neutral-200" />
      <div className="h-24 rounded bg-neutral-200" />
    </div>
  );
}

async function FirstPassBody({ transactionId }: { transactionId: string }) {
  const bundle = await getFirstPassBundle(transactionId);
  const checklistRows = await listChecklistItemsForTransaction(transactionId);

  const items = checklistRows.map((row) => ({
    id: row.id,
    label: row.title,
    checked: row.completed,
  }));

  return (
    <>
      <FirstPassReview
        confidence={bundle?.confidence ?? 0}
        summary={bundle?.summary ?? "Loading first pass…"}
        findings={
          <p className="font-prose text-prose-body">
            {bundle?.firstPassStatus
              ? `Review status: ${bundle.firstPassStatus}.`
              : "Awaiting AI First Pass workflow output."}
          </p>
        }
      />

      <FirstPassChecklistClient items={items} />
    </>
  );
}

/**
 * Figma: **First Pass Review/Default** → `/tc/transactions/[id]/first-pass`
 */
export default function FirstPassPage({ params }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <p className="font-sans text-sm text-neutral-600">
        Transaction · <span className="font-medium text-brand-navy">{params.id}</span>
      </p>

      <Suspense fallback={<FirstPassSkeleton />}>
        <FirstPassBody transactionId={params.id} />
      </Suspense>
    </div>
  );
}
