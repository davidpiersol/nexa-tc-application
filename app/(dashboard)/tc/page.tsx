import { FileSignature, FolderOpen, ListTodo, Timer } from "lucide-react";
import { TcPipelineKanban } from "@/components/dashboard/tc-pipeline-kanban";
import { StatCountUp } from "@/components/motion/stat-count-up";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import {
  TC_STATS_PLACEHOLDER,
  tcPipelinePlaceholder,
} from "@/lib/data/screen-placeholders";

/**
 * Figma: **TC Dashboard/Default** → `/tc`
 * TODO: wire KPI + pipeline to `/api/transactions` + dashboard aggregates.
 */
export default function TcDashboardPage() {
  const stats = TC_STATS_PLACEHOLDER;
  const pipeline = tcPipelinePlaceholder();

  /* TODO: GET /api/dashboard/tc/deadlines */
  const deadlines = [
    { id: "dl1", label: "HOA docs due", date: "Apr 18", tone: "gold" as const },
    { id: "dl2", label: "Loan contingency end", date: "Apr 22", tone: "navy" as const },
    { id: "dl3", label: "Walk-through", date: "Apr 25", tone: "brown" as const },
  ];

  /* TODO: GET /api/dashboard/tc/tasks */
  const tasks = [
    { id: "t1", label: "Request payoff statement", priority: "gold" as const },
    { id: "t2", label: "Verify wire instructions", priority: "navy" as const },
    { id: "t3", label: "Schedule final walk-through", priority: "brown" as const },
  ];

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <section aria-labelledby="tc-stats-heading">
        <h2 id="tc-stats-heading" className="sr-only">
          Transaction KPIs
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            value={<StatCountUp value={stats.activeTransactions} />}
            label="Active transactions"
            icon={<FolderOpen aria-hidden />}
          />
          <StatsCard
            value={<StatCountUp value={stats.dueThisWeek} />}
            label="Due this week"
            icon={<Timer aria-hidden />}
          />
          <StatsCard
            value={<StatCountUp value={stats.pendingReviews} />}
            label="Pending reviews"
            icon={<ListTodo aria-hidden />}
          />
          <StatsCard
            value={<StatCountUp value={stats.signaturesNeeded} />}
            label="Signatures needed"
            icon={<FileSignature aria-hidden />}
          />
        </div>
      </section>

      <section aria-labelledby="pipeline-heading" className="min-w-0">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="pipeline-heading" className="font-display text-heading-md text-brand-navy">
              Pipeline
            </h2>
            <p className="mt-1 font-sans text-sm text-neutral-600">
              {/* TODO: filtered view state */}
              Drag cards between stages · placeholder data
            </p>
          </div>
        </div>
        <TcPipelineKanban initialColumns={pipeline} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          <h2 className="font-display text-heading-md text-brand-navy">Deadlines</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {deadlines.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-brand-md border border-neutral-300 bg-white px-4 py-3 shadow-brand-sm"
              >
                <span className="flex items-center gap-3 font-sans text-ui-body text-neutral-900">
                  <span
                    className={
                      d.tone === "gold"
                        ? "size-2 rounded-full bg-brand-gold"
                        : d.tone === "navy"
                          ? "size-2 rounded-full bg-brand-navy"
                          : "size-2 rounded-full bg-brand-brown"
                    }
                    aria-hidden
                  />
                  {d.label}
                </span>
                <span className="font-sans text-sm text-neutral-600">{d.date}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-2">
          <h2 className="font-display text-heading-md text-brand-navy">Tasks</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-brand-md border border-neutral-300 bg-white px-4 py-3 shadow-brand-sm"
              >
                <span className="font-sans text-ui-body text-neutral-900">{t.label}</span>
                <Badge
                  variant={
                    t.priority === "gold"
                      ? "gold"
                      : t.priority === "navy"
                        ? "navy"
                        : "neutral"
                  }
                >
                  {t.priority === "gold"
                    ? "High"
                    : t.priority === "navy"
                      ? "Medium"
                      : "Low"}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
