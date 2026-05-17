import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { contactsBelongToTenant, requireCrmApiActor } from "@/lib/crm/api";
import { crmRelationshipSchema, nullableText, nullableUuid } from "@/lib/crm/validation";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type Ctx = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const guard = await requireCrmApiActor(request);
  if (guard.response) return guard.response;

  const parsed = crmRelationshipSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });
  const body = parsed.data;
  const relatedContactId = nullableUuid(body.relatedContactId);
  if (!(await contactsBelongToTenant(guard.actor.tenantId, [body.primaryContactId, relatedContactId]))) {
    return NextResponse.json({ error: "contact_not_found" }, { status: 404 });
  }

  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("crm_relationships")
    .update({
      primary_contact_id: body.primaryContactId,
      related_contact_id: relatedContactId,
      relationship_type: body.relationshipType,
      notes: nullableText(body.notes),
      status: body.status,
      updated_by: guard.actor.userId,
    })
    .eq("id", params.id)
    .eq("tenant_id", guard.actor.tenantId)
    .eq("owner_user_id", guard.actor.userId)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ relationship: data });
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const guard = await requireCrmApiActor(request);
  if (guard.response) return guard.response;

  const admin = createServiceRoleClient();
  const { error, count } = await admin
    .from("crm_relationships")
    .delete({ count: "exact" })
    .eq("id", params.id)
    .eq("tenant_id", guard.actor.tenantId)
    .eq("owner_user_id", guard.actor.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
