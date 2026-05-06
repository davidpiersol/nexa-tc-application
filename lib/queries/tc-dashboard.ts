import type { PipelineCard, PipelineColumnId } from "@/components/dashboard/tc-pipeline-kanban";
import {
  transactionStatusToColumn,
  type PipelineColumnKey,
} from "@/lib/data/pipeline-map";
import { createClient } from "@/lib/supabase/server";

function initials(name: string | null | undefined): string {
  if (!name?.trim()) return "TC";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function columnKeyToStage(col: PipelineColumnKey): PipelineCard["stage"] {
  return col;
}

export type TcDeadlineRow = {
  id: string;
  /** Opens `/tc/transactions/[transactionId]` */
  transactionId: string;
  address: string;
  type: string;
  date: string;
  priority: "high" | "medium" | "low";
};

export type TcTaskRow = {
  id: string;
  transactionId: string;
  name: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
};

export type TcStats = {
  activeTransactions: number;
  dueThisWeek: number;
  pendingReviews: number;
  signaturesNeeded: number;
};

/** Empty pipeline columns for SSR fallback. */
export function emptyPipelineColumns(): Record<PipelineColumnId, PipelineCard[]> {
  return {
    prelisting: [],
    listing: [],
    contract: [],
    pending: [],
    closed: [],
  };
}

function mapColumnKeyToId(key: PipelineColumnKey): PipelineColumnId {
  return key;
}

/** Loads TC dashboard pipeline cards + KPI stats from RLS-scoped queries. */
export async function getTcDashboardData(): Promise<{
  pipeline: Record<PipelineColumnId, PipelineCard[]>;
  stats: TcStats;
  deadlines: TcDeadlineRow[];
  tasks: TcTaskRow[];
}> {
  const supabase = await createClient();
  const pipeline = emptyPipelineColumns();

  const { data: txRows, error: txErr } = await supabase
    .from("transactions")
    .select(
      "id, status, close_date, property_address, mls_number, created_by, first_pass_status",
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (txErr || !txRows?.length) {
    return {
      pipeline,
      stats: {
        activeTransactions: 0,
        dueThisWeek: 0,
        pendingReviews: 0,
        signaturesNeeded: 0,
      },
      deadlines: [],
      tasks: [],
    };
  }

  const creatorIds = [
    ...new Set(
      txRows.map((t) => t.created_by).filter((id): id is string => Boolean(id)),
    ),
  ];
  let nameById = new Map<string, string | null>();
  if (creatorIds.length > 0) {
    const { data: creatorRows } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", creatorIds);
    nameById = new Map(
      (creatorRows ?? []).map((u) => [u.id, u.full_name as string | null]),
    );
  }

  const ids = txRows.map((t) => t.id);

  const [{ data: items }, { data: tasksRows }, { data: docsAgg }] = await Promise.all([
    supabase
      .from("checklist_items")
      .select("id, transaction_id, completed")
      .in("transaction_id", ids),
    supabase
      .from("tasks")
      .select("id, transaction_id, title, completed_at, due_date, assigned_to")
      .in("transaction_id", ids)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(40),
    supabase
      .from("documents")
      .select("id, transaction_id, status, category")
      .in("transaction_id", ids),
  ]);

  const itemByTx = new Map<string, { total: number; done: number }>();
  for (const row of items ?? []) {
    const cur = itemByTx.get(row.transaction_id) ?? { total: 0, done: 0 };
    cur.total += 1;
    if (row.completed) cur.done += 1;
    itemByTx.set(row.transaction_id, cur);
  }

  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  let dueThisWeek = 0;
  const deadlineCandidates: TcDeadlineRow[] = [];

  for (const row of tasksRows ?? []) {
    if (row.due_date) {
      const d = new Date(row.due_date);
      if (d >= now && d <= weekEnd && !row.completed_at) dueThisWeek += 1;
      const t = txRows.find((x) => x.id === row.transaction_id);
      deadlineCandidates.push({
        id: `task-${row.id}`,
        transactionId: row.transaction_id,
        address: t?.property_address ?? "Transaction",
        type: row.title,
        date: row.due_date,
        priority: "medium",
      });
    }
  }

  let pendingReviews = 0;
  let signaturesNeeded = 0;
  const activeTransactions = txRows.filter((t) => t.status !== "closed").length;

  for (const d of docsAgg ?? []) {
    if (d.status === "under_review") pendingReviews += 1;
    if (
      d.status === "requested" &&
      (d.category === "contract" || d.category === "other")
    ) {
      signaturesNeeded += 1;
    }
  }

  for (const t of txRows) {
    if (t.first_pass_status === "in_review") pendingReviews += 1;
  }

  for (const row of txRows) {
    const colKey = transactionStatusToColumn(String(row.status));
    const colId = mapColumnKeyToId(colKey);
    const counts = itemByTx.get(row.id);
    const pct =
      counts && counts.total > 0
        ? Math.round((counts.done / counts.total) * 100)
        : 20;

    const card: PipelineCard = {
      id: row.id,
      address: row.property_address?.trim() || "Property TBD",
      subtitle: row.mls_number ? `MLS #${row.mls_number}` : undefined,
      closeDateLabel: row.close_date
        ? `Close · ${row.close_date}`
        : "Close · TBD",
      tcInitials: initials(nameById.get(row.created_by ?? "") ?? undefined),
      progressPercent: pct,
      stage: columnKeyToStage(colKey),
    };
    pipeline[colId].push(card);
  }

  const tasks: TcTaskRow[] = (tasksRows ?? []).slice(0, 12).map((row) => ({
    id: row.id,
    transactionId: row.transaction_id,
    name: row.title,
    completed: Boolean(row.completed_at),
    priority: "medium",
  }));

  return {
    pipeline,
    stats: {
      activeTransactions,
      dueThisWeek,
      pendingReviews,
      signaturesNeeded,
    },
    deadlines: deadlineCandidates.slice(0, 12),
    tasks,
  };
}
