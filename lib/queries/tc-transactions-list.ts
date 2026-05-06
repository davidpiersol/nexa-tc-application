import { createClient } from "@/lib/supabase/server";
import type { TcTransactionListFilter } from "@/lib/tc-transaction-list-filter";

export type TcTransactionListRow = {
  id: string;
  status: string;
  property_address: string | null;
  mls_number: string | null;
  close_date: string | null;
  first_pass_status: string | null;
};

/**
 * Tenant-scoped transactions for the TC “All transactions” page (matches `/api/transactions` scope).
 * Optional `filter` narrows the list using the same semantics as the TC dashboard KPIs.
 */
export async function getTcTransactionsList(
  filter?: TcTransactionListFilter,
): Promise<TcTransactionListRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: tenantRow } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!tenantRow?.tenant_id) return [];

  const tenantId = tenantRow.tenant_id;

  const { data: txRows, error: txErr } = await supabase
    .from("transactions")
    .select(
      "id, status, close_date, property_address, mls_number, first_pass_status",
    )
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(500);

  if (txErr || !txRows?.length) return [];

  const ids = txRows.map((t) => t.id);

  if (!filter) {
    return txRows.map(mapRow);
  }

  switch (filter) {
    case "active":
      return txRows.filter((t) => t.status !== "closed").map(mapRow);
    case "due-week": {
      const now = new Date();
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data: taskRows } = await supabase
        .from("tasks")
        .select("transaction_id, due_date, completed_at")
        .in("transaction_id", ids)
        .not("due_date", "is", null);

      const dueIds = new Set<string>();
      for (const row of taskRows ?? []) {
        if (row.completed_at) continue;
        const d = new Date(String(row.due_date));
        if (d >= now && d <= weekEnd) dueIds.add(row.transaction_id);
      }
      return txRows.filter((t) => dueIds.has(t.id)).map(mapRow);
    }
    case "pending-reviews": {
      const { data: docRows } = await supabase
        .from("documents")
        .select("transaction_id")
        .in("transaction_id", ids)
        .eq("status", "under_review");

      const docTx = new Set((docRows ?? []).map((d) => d.transaction_id));
      return txRows
        .filter(
          (t) => t.first_pass_status === "in_review" || docTx.has(t.id),
        )
        .map(mapRow);
    }
    case "signatures": {
      const { data: docRows } = await supabase
        .from("documents")
        .select("transaction_id")
        .in("transaction_id", ids)
        .eq("status", "requested")
        .in("category", ["contract", "other"]);

      const sigIds = new Set((docRows ?? []).map((d) => d.transaction_id));
      return txRows.filter((t) => sigIds.has(t.id)).map(mapRow);
    }
    default:
      return txRows.map(mapRow);
  }
}

function mapRow(t: {
  id: string;
  status: string;
  close_date: string | null;
  property_address: string | null;
  mls_number: string | null;
  first_pass_status: string | null;
}): TcTransactionListRow {
  return {
    id: t.id,
    status: t.status,
    close_date: t.close_date,
    property_address: t.property_address,
    mls_number: t.mls_number,
    first_pass_status: t.first_pass_status,
  };
}

/** Displays status enum as title-ish phase label. */
export function formatTransactionStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

/** Close date or neutral placeholder for dashboard tables. */
export function formatTransactionNextLabel(closeDate: string | null): string {
  if (!closeDate?.trim()) return "TBD";
  const d = new Date(
    closeDate.includes("T") ? closeDate : `${closeDate}T12:00:00`,
  );
  if (Number.isNaN(d.getTime())) return closeDate;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Transactions visible to the current user as an agent party (RLS-scoped).
 */
export async function getAgentTransactionsList(): Promise<TcTransactionListRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: txRows, error } = await supabase
    .from("transactions")
    .select(
      "id, status, close_date, property_address, mls_number, first_pass_status",
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error || !txRows?.length) return [];
  return txRows.map(mapRow);
}
