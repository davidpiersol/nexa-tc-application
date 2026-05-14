import { notFound, redirect } from "next/navigation";
import { loadActorContext, type ActorContext } from "@/lib/auth/actor-context";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { bucketCrmActions, type CrmActionBuckets, type CrmTaskKind } from "@/lib/crm/workflows";

export type CrmWorkspace = "tc" | "agent";

export type CrmContactOption = {
  id: string;
  label: string;
  fullName: string;
  email: string | null;
  company: string | null;
  isBroker: boolean;
};

export type CrmTaskRow = {
  id: string;
  kind: CrmTaskKind;
  title: string;
  description: string | null;
  dueAt: string | null;
  priority: "low" | "medium" | "high";
  status: "open" | "completed" | "archived";
  segment: string | null;
  contactId: string | null;
  contactName: string | null;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CrmTouchpointRow = {
  id: string;
  contactId: string | null;
  contactName: string | null;
  transactionId: string | null;
  touchType: string;
  direction: string | null;
  body: string | null;
  outcome: string | null;
  nextAction: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmRelationshipRow = {
  id: string;
  primaryContactId: string | null;
  primaryContactName: string | null;
  relatedContactId: string | null;
  relatedContactName: string | null;
  relationshipType: string;
  notes: string | null;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type CrmDashboardData = {
  actor: ActorContext;
  workspace: CrmWorkspace;
  basePath: string;
  tasks: CrmTaskRow[];
  buckets: CrmActionBuckets<CrmTaskRow>;
  recentTouches: CrmTouchpointRow[];
  contacts: CrmContactOption[];
};

export async function requireCrmActor(workspace: CrmWorkspace): Promise<ActorContext> {
  const actor = await loadActorContext();
  if (!actor) redirect("/login");
  if (workspace === "tc" && !["tc", "admin", "tenant_admin", "superadmin", "global_admin"].includes(actor.role)) {
    redirect("/forbidden");
  }
  if (workspace === "agent" && !["broker", "agent"].includes(actor.role)) {
    redirect("/forbidden");
  }
  return actor;
}

export function crmBasePath(workspace: CrmWorkspace): string {
  return workspace === "tc" ? "/tc/crm" : "/agent/crm";
}

function mapContact(row: any, brokerIds: Set<string>): CrmContactOption {
  const fullName = row.full_name ?? [row.first_name, row.last_name].filter(Boolean).join(" ") ?? "Unnamed contact";
  const labelParts = [fullName, row.email, row.company].filter(Boolean);
  return {
    id: row.id,
    fullName,
    email: row.email ?? null,
    company: row.company ?? null,
    isBroker: brokerIds.has(row.id),
    label: labelParts.join(" · "),
  };
}

async function contactNameMap(tenantId: string, contactIds: string[]): Promise<Map<string, string>> {
  if (contactIds.length === 0) return new Map();
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("contacts")
    .select("id, full_name, first_name, last_name")
    .eq("tenant_id", tenantId)
    .in("id", Array.from(new Set(contactIds)));
  return new Map(
    (data ?? []).map((row: any) => [
      row.id,
      row.full_name ?? [row.first_name, row.last_name].filter(Boolean).join(" ") ?? "Contact",
    ]),
  );
}

export async function listCrmContactOptions(actor: ActorContext): Promise<CrmContactOption[]> {
  const admin = createServiceRoleClient();
  const [{ data: contacts }, { data: brokers }] = await Promise.all([
    admin
      .from("contacts")
      .select("id, first_name, last_name, full_name, email, company")
      .eq("tenant_id", actor.tenantId)
      .order("full_name", { ascending: true })
      .limit(500),
    admin
      .from("contact_category_assignments")
      .select("contact_id")
      .eq("tenant_id", actor.tenantId)
      .eq("category", "broker"),
  ]);
  const brokerIds = new Set((brokers ?? []).map((row: any) => row.contact_id));
  return (contacts ?? []).map((row: any) => mapContact(row, brokerIds));
}

export async function listCrmTasks(actor: ActorContext, kind?: CrmTaskKind): Promise<CrmTaskRow[]> {
  const admin = createServiceRoleClient();
  let query = admin
    .from("crm_tasks")
    .select("id, kind, title, description, due_at, priority, status, segment, contact_id, transaction_id, created_at, updated_at")
    .eq("tenant_id", actor.tenantId)
    .eq("owner_user_id", actor.userId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false });
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const contactIds = (data ?? []).map((row: any) => row.contact_id).filter(Boolean);
  const names = await contactNameMap(actor.tenantId, contactIds);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    dueAt: row.due_at,
    priority: row.priority,
    status: row.status,
    segment: row.segment,
    contactId: row.contact_id,
    contactName: row.contact_id ? names.get(row.contact_id) ?? null : null,
    transactionId: row.transaction_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getCrmTask(actor: ActorContext, id: string): Promise<CrmTaskRow> {
  const rows = await listCrmTasks(actor);
  const row = rows.find((item) => item.id === id);
  if (!row) notFound();
  return row;
}

export async function listCrmTouchpoints(actor: ActorContext, touchType?: string): Promise<CrmTouchpointRow[]> {
  const admin = createServiceRoleClient();
  let query = admin
    .from("crm_touchpoints")
    .select("id, contact_id, transaction_id, touch_type, direction, body, outcome, next_action, occurred_at, created_at, updated_at")
    .eq("tenant_id", actor.tenantId)
    .eq("owner_user_id", actor.userId)
    .order("occurred_at", { ascending: false });
  if (touchType) query = query.eq("touch_type", touchType);
  const { data, error } = await query.limit(500);
  if (error) throw new Error(error.message);
  const contactIds = (data ?? []).map((row: any) => row.contact_id).filter(Boolean);
  const names = await contactNameMap(actor.tenantId, contactIds);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    contactId: row.contact_id,
    contactName: row.contact_id ? names.get(row.contact_id) ?? null : null,
    transactionId: row.transaction_id,
    touchType: row.touch_type,
    direction: row.direction,
    body: row.body,
    outcome: row.outcome,
    nextAction: row.next_action,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getCrmTouchpoint(actor: ActorContext, id: string): Promise<CrmTouchpointRow> {
  const rows = await listCrmTouchpoints(actor);
  const row = rows.find((item) => item.id === id);
  if (!row) notFound();
  return row;
}

export async function listCrmRelationships(actor: ActorContext): Promise<CrmRelationshipRow[]> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("crm_relationships")
    .select("id, primary_contact_id, related_contact_id, relationship_type, notes, status, created_at, updated_at")
    .eq("tenant_id", actor.tenantId)
    .eq("owner_user_id", actor.userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const contactIds = (data ?? [])
    .flatMap((row: any) => [row.primary_contact_id, row.related_contact_id])
    .filter(Boolean);
  const names = await contactNameMap(actor.tenantId, contactIds);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    primaryContactId: row.primary_contact_id,
    primaryContactName: row.primary_contact_id ? names.get(row.primary_contact_id) ?? null : null,
    relatedContactId: row.related_contact_id,
    relatedContactName: row.related_contact_id ? names.get(row.related_contact_id) ?? null : null,
    relationshipType: row.relationship_type,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getCrmRelationship(actor: ActorContext, id: string): Promise<CrmRelationshipRow> {
  const rows = await listCrmRelationships(actor);
  const row = rows.find((item) => item.id === id);
  if (!row) notFound();
  return row;
}

export async function loadCrmDashboard(workspace: CrmWorkspace): Promise<CrmDashboardData> {
  const actor = await requireCrmActor(workspace);
  const [tasks, recentTouches, contacts] = await Promise.all([
    listCrmTasks(actor),
    listCrmTouchpoints(actor),
    listCrmContactOptions(actor),
  ]);
  return {
    actor,
    workspace,
    basePath: crmBasePath(workspace),
    tasks,
    buckets: bucketCrmActions(tasks),
    recentTouches: recentTouches.slice(0, 8),
    contacts,
  };
}
