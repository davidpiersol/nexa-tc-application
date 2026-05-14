import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { contactBelongsToTenant, requireCrmApiActor } from "@/lib/crm/api";
import { crmTaskSchema, nullableDateTime, nullableText, nullableUuid } from "@/lib/crm/validation";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type Ctx = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const guard = await requireCrmApiActor(request);
  if (guard.response) return guard.response;

  const parsed = crmTaskSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });
  const body = parsed.data;
  const contactId = nullableUuid(body.contactId);
  if (!(await contactBelongsToTenant(guard.actor.tenantId, contactId))) {
    return NextResponse.json({ error: "contact_not_found" }, { status: 404 });
  }

  const admin = createServiceRoleClient();
  const completedAt = body.status === "completed" ? new Date().toISOString() : null;
  const { data, error } = await admin
    .from("crm_tasks")
    .update({
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
      updated_by: guard.actor.userId,
    })
    .eq("id", params.id)
    .eq("tenant_id", guard.actor.tenantId)
    .eq("owner_user_id", guard.actor.userId)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ task: data });
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const guard = await requireCrmApiActor(request);
  if (guard.response) return guard.response;

  const admin = createServiceRoleClient();
  const { error, count } = await admin
    .from("crm_tasks")
    .delete({ count: "exact" })
    .eq("id", params.id)
    .eq("tenant_id", guard.actor.tenantId)
    .eq("owner_user_id", guard.actor.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
