import { ChecklistPanel } from "@/components/ui/checklist-panel";

type Props = { params: { id: string } };

/**
 * Figma: **Title Dashboard/Default** → `/title/[id]`
 * TODO: title search + curative tasks.
 */
export default function TitleDashboardPage({ params }: Props) {
  /* TODO: GET /api/title/:id/checklist */
  const items = [
    { id: "t1", label: "Preliminary report issued", checked: true },
    { id: "t2", label: "Payoff ordered", checked: true },
    { id: "t3", label: "Survey receipt", checked: false },
    { id: "t4", label: "Wire instructions verified", checked: false },
  ];

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <header>
        <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
          Title file · {params.id}
        </p>
        <h2 className="mt-2 font-display text-heading-lg text-brand-navy">
          Closing preparation
        </h2>
        <p className="mt-2 font-prose text-prose-body text-neutral-900">
          {/* TODO: property legal description */}
          Track curative items through funding.
        </p>
      </header>

      <ChecklistPanel title="Title checklist" items={items} />
    </div>
  );
}
