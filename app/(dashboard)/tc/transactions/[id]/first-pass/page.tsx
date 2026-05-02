import { ChecklistPanel } from "@/components/ui/checklist-panel";
import { FirstPassReview } from "@/components/ui/first-pass-review";
import { firstPassPlaceholder } from "@/lib/data/screen-placeholders";

type Props = { params: { id: string } };

/**
 * Figma: **First Pass Review/Default** → `/tc/transactions/[id]/first-pass`
 * TODO: AI engine output + persisted checklist from API.
 */
export default function FirstPassPage({ params }: Props) {
  const fp = firstPassPlaceholder;

  return (
    <div className="flex flex-col gap-8">
      <p className="font-sans text-sm text-neutral-600">
        {/* TODO: breadcrumb + txn header */}
        Transaction · <span className="font-medium text-brand-navy">{params.id}</span>
      </p>

      <FirstPassReview
        confidence={fp.confidence}
        summary={fp.summary}
        findings={
          <p className="font-prose text-prose-body">
            {/* TODO: markdown from model */}
            Outstanding: HOA resale certificate not yet indexed.
          </p>
        }
      />

      <ChecklistPanel
        title="Verification checklist"
        items={fp.checklist}
        animateComplete
        onItemChange={() => {
          /* TODO: PATCH checklist item */
        }}
      />
    </div>
  );
}
