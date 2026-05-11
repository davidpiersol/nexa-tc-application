import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { loadActorContext } from "@/lib/auth/actor-context";
import { canWriteContacts } from "@/lib/contacts/permissions";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { normalizeAssignmentCategory, isTransactionContactRole } from "@/lib/transactions/contact-assignment";

type Ctx = { params: { id: string } };

const assignmentSchema = z.object({
  contactId: z.string().uuid(),
  assignmentRole: z.string().trim().min(1),
  assignmentCategory: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

const deleteSchema = z.object({
  assignmentId: z.string().uuid(),
});

async function loadTransactionForActor(transactionId: string, tenantId: string) {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("transactions")
    .select("id, tenant_id, archived_at")
    .eq("id", transactionId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) return { error: NextResponse.json({ error: error.message }, { status: 500 }), transaction: null };
  if (!data) return { error: NextResponse.json({ error: "not_found" }, { status: 404 }), transaction: null };
  return { error: null, transaction: data };
}

export async function GET(request: NextRequest, ctx: Ctx) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;

  const actor = await loadActorContext();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const txLoaded = await loadTransactionForActor(ctx.params.id, actor.tenantId);
  if (txLoaded.error) return txLoaded.error;
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("transaction_contact_assignments")
    .select(
      "id, transaction_id, contact_id, assignment_role, assignment_category, notes, created_at, contacts(id, full_name, email, phone, company)",
    )
    .eq("tenant_id", actor.tenantId)
    .eq("transaction_id", ctx.params.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    assignments: (data ?? []).map((row) => {
      const contact = Array.isArray(row.contacts) ? row.contacts[0] : row.contacts;
      return {
        id: row.id,
        transactionId: row.transaction_id,
        contactId: row.contact_id,
        assignmentRole: row.assignment_role,
        assignmentCategory: row.assignment_category,
        notes: row.notes,
        createdAt: row.created_at,
        contact: contact
          ? {
              id: contact.id,
              fullName: contact.full_name,
              email: contact.email,
              phone: contact.phone,
              company: contact.company,
            }
          : null,
      };
    }),
  });
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const actor = await loadActorContext();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canWriteContacts(actor.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const txLoaded = await loadTransactionForActor(ctx.params.id, actor.tenantId);
  if (txLoaded.error) return txLoaded.error;
  if (txLoaded.transaction?.archived_at) {
    return NextResponse.json({ error: "archived_transaction_read_only" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = assignmentSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });

  const assignmentRoleRaw = parsed.data.assignmentRole.trim().toLowerCase();
  if (!isTransactionContactRole(assignmentRoleRaw)) {
    return NextResponse.json({ error: "invalid_assignment_role" }, { status: 400 });
  }

  const assignmentCategory = normalizeAssignmentCategory(parsed.data.assignmentCategory ?? null);

  const admin = createServiceRoleClient();
  const { data: contact, error: contactErr } = await admin
    .from("contacts")
    .select("id")
    .eq("tenant_id", actor.tenantId)
    .eq("id", parsed.data.contactId)
    .maybeSingle();
  if (contactErr) return NextResponse.json({ error: contactErr.message }, { status: 500 });
  if (!contact) return NextResponse.json({ error: "contact_not_found" }, { status: 404 });

  const { data, error } = await admin
    .from("transaction_contact_assignments")
    .upsert(
      {
        tenant_id: actor.tenantId,
        transaction_id: ctx.params.id,
        contact_id: parsed.data.contactId,
        assignment_role: assignmentRoleRaw,
        assignment_category: assignmentCategory,
        notes: parsed.data.notes?.trim() || null,
        created_by: actor.userId,
        updated_by: actor.userId,
      },
      { onConflict: "transaction_id,contact_id,assignment_role" },
    )
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, assignmentId: data.id });
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const actor = await loadActorContext();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canWriteContacts(actor.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const txLoaded = await loadTransactionForActor(ctx.params.id, actor.tenantId);
  if (txLoaded.error) return txLoaded.error;
  if (txLoaded.transaction?.archived_at) {
    return NextResponse.json({ error: "archived_transaction_read_only" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = deleteSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("transaction_contact_assignments")
    .delete()
    .eq("id", parsed.data.assignmentId)
    .eq("tenant_id", actor.tenantId)
    .eq("transaction_id", ctx.params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
