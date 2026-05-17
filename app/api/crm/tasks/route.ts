import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { crmTaskSchema, nullableDateTime, nullableText, nullableUuid } from "@/lib/crm/validation";
import { contactBelongsToTenant, requireCrmApiActor } from "@/lib/crm/api";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const guard = await requireCrmApiActor(request);
  if (guard.response) return guard.response;

  const parsed = crmTaskSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });
  const body = parsed.data;
  const contactId = nullableUuid(body.contactId);
  if (!(await contactBelongsToTenant(guard.actor.tenantId, contactId))) {
    return NextResponse.json({ error: "contact_not_found" }, { status: 404 });
  }

  const completedAt = body.status === "completed" ? new Date().toISOString() : null;
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("crm_tasks")
    .insert({
      tenant_id: guard.actor.tenantId,
      owner_user_id: guard.actor.userId,
      contact_id: contactId,
      transaction_id: nullableUuid(body.transactionId),
      kind: body.kind,
      title: body.title.trim(),
      description: nullableText(body.description),
      due_at: nullableDateTime(body.dueAt),
      priority: body.priority,
      status: body.status,
      segment: nullableText(body.segment),
      completed_at: completedAt,
      created_by: guard.actor.userId,
      updated_by: guard.actor.userId,
    })
    .select("id")
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? "insert_failed" }, { status: 500 });
  return NextResponse.json({ task: data });
}
