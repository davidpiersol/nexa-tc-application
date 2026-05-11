import { createClient } from "@/lib/supabase/server";
import type { TcTransactionListFilter } from "@/lib/tc-transaction-list-filter";
import { matchesArchiveView, type ArchiveView } from "@/lib/transactions/archive";
import { matchesTransactionSearch } from "@/lib/transactions/search";

export type TcTransactionListRow = {
  id: string;
  status: string;
  property_address: string | null;
  mls_number: string | null;
  close_date: string | null;
  notes: string | null;
  archived_at: string | null;
  closed_at: string | null;
  first_pass_status: string | null;
  legal_description: string | null;
  representation_side: string | null;
  seller_broker_name: string | null;
  buyer_broker_name: string | null;
};

/**
 * Tenant-scoped transactions for the TC “All transactions” page (matches `/api/transactions` scope).
 * Optional `filter` narrows the list using the same semantics as the TC dashboard KPIs.
 */
export async function getTcTransactionsList(
  options?: {
    filter?: TcTransactionListFilter;
    query?: string;
    archiveView?: ArchiveView;
  },
): Promise<TcTransactionListRow[]> {
  const filter = options?.filter;
  const query = options?.query;
  const archiveView = options?.archiveView ?? "default";
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
      "id, status, close_date, closed_at, archived_at, property_address, mls_number, notes, first_pass_status, intake_data",
    )
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(500);

  if (txErr || !txRows?.length) return [];

  const ids = txRows.map((t) => t.id);
  const { data: partyRows } = await supabase
    .from("transaction_parties")
    .select("transaction_id, display_name, contact_email, party_role")
    .in("transaction_id", ids);

  const partyTextByTransactionId = new Map<string, string>();
  for (const row of partyRows ?? []) {
    const chunk = [row.display_name ?? "", row.contact_email ?? "", row.party_role ?? ""]
      .join(" ")
      .trim();
    if (!chunk) continue;
    const prev = partyTextByTransactionId.get(row.transaction_id) ?? "";
    partyTextByTransactionId.set(row.transaction_id, `${prev} ${chunk}`.trim());
  }

  const visibleRows = txRows.filter(
    (t) =>
      matchesArchiveView(t.archived_at, archiveView) &&
      matchesTransactionSearch(
        {
          propertyAddress: t.property_address,
          mlsNumber: t.mls_number,
          notes: t.notes,
          intakeData: t.intake_data,
          partyText: partyTextByTransactionId.get(t.id) ?? null,
        },
        query,
      ),
  );

  if (!filter) {
    return visibleRows.map(mapRow);
  }
  if (visibleRows.length === 0) return [];

  switch (filter) {
    case "active":
      return visibleRows.filter((t) => t.status !== "closed").map(mapRow);
    case "due-week": {
      const now = new Date();
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data: taskRows } = await supabase
        .from("tasks")
        .select("transaction_id, due_date, completed_at")
        .in(
          "transaction_id",
          visibleRows.map((t) => t.id),
        )
        .not("due_date", "is", null);

      const dueIds = new Set<string>();
      for (const row of taskRows ?? []) {
        if (row.completed_at) continue;
        const d = new Date(String(row.due_date));
        if (d >= now && d <= weekEnd) dueIds.add(row.transaction_id);
      }
      return visibleRows.filter((t) => dueIds.has(t.id)).map(mapRow);
    }
    case "pending-reviews": {
      const { data: docRows } = await supabase
        .from("documents")
        .select("transaction_id")
        .in(
          "transaction_id",
          visibleRows.map((t) => t.id),
        )
        .eq("status", "under_review");

      const docTx = new Set((docRows ?? []).map((d) => d.transaction_id));
      return visibleRows
        .filter(
          (t) => t.first_pass_status === "in_review" || docTx.has(t.id),
        )
        .map(mapRow);
    }
    case "signatures": {
      const { data: docRows } = await supabase
        .from("documents")
        .select("transaction_id")
        .in(
          "transaction_id",
          visibleRows.map((t) => t.id),
        )
        .eq("status", "requested")
        .in("category", ["contract", "other"]);

      const sigIds = new Set((docRows ?? []).map((d) => d.transaction_id));
      return visibleRows.filter((t) => sigIds.has(t.id)).map(mapRow);
    }
    default:
      return visibleRows.map(mapRow);
  }
}

function mapRow(t: {
  id: string;
  status: string;
  close_date: string | null;
  closed_at: string | null;
  archived_at: string | null;
  property_address: string | null;
  mls_number: string | null;
  notes: string | null;
  first_pass_status: string | null;
  intake_data?: Record<string, unknown> | null;
}): TcTransactionListRow {
  const overview = deriveOverviewFromIntake(t.intake_data);
  return {
    id: t.id,
    status: t.status,
    close_date: t.close_date,
    closed_at: t.closed_at,
    archived_at: t.archived_at,
    property_address: t.property_address,
    mls_number: t.mls_number,
    notes: t.notes,
    first_pass_status: t.first_pass_status,
    legal_description: overview.legalDescription,
    representation_side: overview.representationSide,
    seller_broker_name: overview.sellerBrokerName,
    buyer_broker_name: overview.buyerBrokerName,
  };
}

export function deriveOverviewFromIntake(
  intakeData: Record<string, unknown> | null | undefined,
): {
  legalDescription: string | null;
  representationSide: string | null;
  sellerBrokerName: string | null;
  buyerBrokerName: string | null;
} {
  const intake = intakeData ?? {};
  const asString = (key: string): string | null => {
    const value = intake[key];
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };
  return {
    legalDescription: asString("property_legal_description"),
    representationSide: asString("tc_representation_side"),
    sellerBrokerName:
      asString("seller_broker_1_broker_name") ?? asString("seller_broker_1_brokerage_firm"),
    buyerBrokerName:
      asString("buyer_broker_1_broker_name") ?? asString("buyer_broker_1_brokerage_firm"),
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
      "id, status, close_date, closed_at, archived_at, property_address, mls_number, notes, first_pass_status",
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error || !txRows?.length) return [];
  return txRows.map(mapRow);
}
