import { FileSignature, FolderOpen, ListTodo, Timer } from "lucide-react";
import { TcPipelineKanban } from "@/components/dashboard/tc-pipeline-kanban";
import { StatCountUp } from "@/components/motion/stat-count-up";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import {
  TC_STATS_FROM_MAKE,
  tcDeadlinesFromMake,
  tcPipelineFromMake,
  tcTasksFromMake,
} from "@/lib/data/figma-make";

/**
 * Figma: **TC Dashboard/Default** → `/tc`
 * KPI + pipeline aligned with Figma Make snapshot (`lib/data/figma-make.ts`).
 * TODO: wire to `/api/transactions` + dashboard aggregates.
 */
export default function TcDashboardPage() {
  const stats = TC_STATS_FROM_MAKE;
  const pipeline = tcPipelineFromMake;

  /* TODO: GET /api/dashboard/tc/deadlines */
  const deadlines = tcDeadlinesFromMake;

  /* TODO: GET /api/dashboard/tc/tasks */
  const tasks = tcTasksFromMake;

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
              Drag cards between stages · data from Figma Make snapshot
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
                className="flex flex-col gap-1 rounded-brand-md border border-neutral-300 bg-white px-4 py-3 shadow-brand-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex items-start gap-3 font-sans text-ui-body text-neutral-900">
                  <span
                    className={
                      d.priority === "high"
                        ? "mt-1.5 size-2 shrink-0 rounded-full bg-brand-gold"
                        : d.priority === "medium"
                          ? "mt-1.5 size-2 shrink-0 rounded-full bg-brand-navy"
                          : "mt-1.5 size-2 shrink-0 rounded-full bg-brand-brown"
                    }
                    aria-hidden
                  />
                  <span>
                    <span className="block font-semibold">{d.address}</span>
                    <span className="text-sm text-neutral-600">
                      {d.type}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 pl-8 font-sans text-sm text-neutral-600 sm:pl-0">
                  {d.date}
                </span>
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
                className="flex items-center justify-between gap-3 rounded-brand-md border border-neutral-300 bg-white px-4 py-3 shadow-brand-sm"
              >
                <span
                  className={
                    t.completed
                      ? "font-sans text-ui-body text-neutral-500 line-through"
                      : "font-sans text-ui-body text-neutral-900"
                  }
                >
                  {t.name}
                </span>
                <Badge
                  variant={
                    t.priority === "high"
                      ? "gold"
                      : t.priority === "medium"
                        ? "navy"
                        : "neutral"
                  }
                >
                  {t.priority === "high"
                    ? "High"
                    : t.priority === "medium"
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
