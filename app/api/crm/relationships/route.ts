import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { contactsBelongToTenant, requireCrmApiActor } from "@/lib/crm/api";
import { crmRelationshipSchema, nullableText, nullableUuid } from "@/lib/crm/validation";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
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
    .insert({
      tenant_id: guard.actor.tenantId,
      owner_user_id: guard.actor.userId,
      primary_contact_id: body.primaryContactId,
      related_contact_id: relatedContactId,
      relationship_type: body.relationshipType,
      notes: nullableText(body.notes),
      status: body.status,
      created_by: guard.actor.userId,
      updated_by: guard.actor.userId,
    })
    .select("id")
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? "insert_failed" }, { status: 500 });
  return NextResponse.json({ relationship: data });
}
