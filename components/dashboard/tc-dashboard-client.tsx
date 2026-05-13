"use client";

import Link from "next/link";
import { FileSignature, FolderOpen, ListTodo, Timer } from "lucide-react";
import { TcPipelineKanban } from "@/components/dashboard/tc-pipeline-kanban";
import type {
  PipelineCard,
  PipelineColumnId,
} from "@/components/dashboard/tc-pipeline-kanban";
import { StatCountUp } from "@/components/motion/stat-count-up";
import { BillingRemindersModal } from "@/components/tc/billing-reminders-modal";
import { StatsCard } from "@/components/ui/stats-card";
import { updateTransactionPipelineStage } from "@/app/actions/tc-pipeline";
import { TcTasksInteractive } from "@/components/tc/tc-tasks-interactive";
import type {
  BillingReminderItem,
  TcDeadlineRow,
  TcStats,
  TcTaskRow,
} from "@/lib/queries/tc-dashboard";
import { tcTransactionListHref } from "@/lib/tc-transaction-list-filter";

export function TcDashboardClient(props: {
  stats: TcStats;
  pipeline: Record<PipelineColumnId, PipelineCard[]>;
  deadlines: TcDeadlineRow[];
  tasks: TcTaskRow[];
  billingReminders: BillingReminderItem[];
}) {
  const { stats, pipeline: initialPipeline, deadlines, tasks, billingReminders } = props;

  async function onPipelineDrop(cardId: string, targetColumn: PipelineColumnId) {
    const res = await updateTransactionPipelineStage(cardId, targetColumn);
    if (!res.ok) {
      throw new Error(res.error ?? "pipeline_update_failed");
    }
  }

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <BillingRemindersModal reminders={billingReminders} />

      <section aria-labelledby="tc-stats-heading">
        <h2 id="tc-stats-heading" className="sr-only">
          Transaction KPIs
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            href={tcTransactionListHref("active")}
            value={<StatCountUp value={stats.activeTransactions} />}
            label="Active transactions"
            icon={<FolderOpen aria-hidden />}
          />
          <StatsCard
            href={tcTransactionListHref("due-week")}
            value={<StatCountUp value={stats.dueThisWeek} />}
            label="Due this week"
            icon={<Timer aria-hidden />}
          />
          <StatsCard
            href={tcTransactionListHref("pending-reviews")}
            value={<StatCountUp value={stats.pendingReviews} />}
            label="Pending reviews"
            icon={<ListTodo aria-hidden />}
          />
          <StatsCard
            href={tcTransactionListHref("signatures")}
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
              Drag cards between stages · synced to Supabase
            </p>
          </div>
        </div>
        <TcPipelineKanban initialColumns={initialPipeline} onPipelineDrop={onPipelineDrop} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          <h2 className="font-display text-heading-md text-brand-navy">Deadlines</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {deadlines.length === 0 ? (
              <li className="font-sans text-sm text-neutral-600">No upcoming deadlines.</li>
            ) : null}
            {deadlines.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/tc/transactions/${d.transactionId}`}
                  className="flex flex-col gap-1 rounded-brand-md border border-neutral-300 bg-white px-4 py-3 shadow-brand-sm transition-colors hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between"
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
                      <span className="text-sm text-neutral-600">{d.type}</span>
                    </span>
                  </span>
                  <span className="shrink-0 pl-8 font-sans text-sm text-neutral-600 sm:pl-0">
                    {d.date}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-2">
          <h2 className="font-display text-heading-md text-brand-navy">Tasks</h2>
          <TcTasksInteractive tasks={tasks} />
        </div>
      </section>
    </div>
  );
}
