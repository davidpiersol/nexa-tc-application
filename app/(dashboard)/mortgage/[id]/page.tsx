import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/graphics/ProgressRing";

type Props = { params: { id: string } };

/**
 * Figma: **Mortgage Dashboard/Default** → `/mortgage/[id]`
 * TODO: LOS milestones + conditions.
 */
export default function MortgageDashboardPage({ params }: Props) {
  /* TODO: GET /api/mortgage/:id/progress */
  const milestones = [
    { id: "m1", label: "Application", done: true },
    { id: "m2", label: "Processing", done: true },
    { id: "m3", label: "Underwriting", done: false },
    { id: "m4", label: "Clear to close", done: false },
  ];

  const pct = 55;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
      <div className="flex flex-1 flex-col gap-6">
        <header>
          <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
            Loan file · {params.id}
          </p>
          <h2 className="mt-2 font-display text-heading-lg text-brand-navy">
            Loan milestones
          </h2>
        </header>
        <ul className="flex flex-col gap-3">
          {milestones.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-brand-md border border-neutral-300 bg-white px-4 py-3 shadow-brand-sm"
            >
              <span className="font-sans text-ui-body text-neutral-900">{m.label}</span>
              <Badge variant={m.done ? "success" : "neutral"}>
                {m.done ? "Complete" : "Pending"}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
      <aside className="flex w-full shrink-0 flex-col items-center gap-3 rounded-brand-lg border border-neutral-300 bg-white p-6 shadow-brand-sm lg:w-64">
        <p className="font-display text-sm text-brand-navy">File progress</p>
        <ProgressRing value={pct} size={112} strokeWidth={9} />
        <p className="text-center font-sans text-sm text-neutral-600">
          {/* TODO: explain score */}
          {pct}% documentation complete
        </p>
      </aside>
    </div>
  );
}
