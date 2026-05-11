import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";

const createTemplateSchema = z.object({
  formNumber: z.string().trim().min(2).max(60),
  title: z.string().trim().min(2).max(180),
  category: z.enum([
    "contract",
    "disclosure",
    "title",
    "mortgage",
    "inspection",
    "hoa",
    "other",
  ]),
  jurisdictionState: z.string().trim().min(2).max(10).default("NM"),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  const { error } = await requireGlobalAdmin();
  if (error) return error;

  const admin = createServiceRoleClient();
  const { data, error: qErr } = await admin
    .from("global_document_templates")
    .select(
      "id, form_number, title, category, jurisdiction_state, availability_status, is_active, updated_at, global_document_template_versions(id, version_label, review_status, is_current, created_at)",
    )
    .order("updated_at", { ascending: false });
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const { actor, error } = await requireGlobalAdmin();
  if (error) return error;
  const current = actor!;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = createTemplateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { data, error: insertErr } = await admin
    .from("global_document_templates")
    .insert({
      form_number: parsed.data.formNumber,
      title: parsed.data.title,
      category: parsed.data.category,
      jurisdiction_state: parsed.data.jurisdictionState.toUpperCase(),
      availability_status: "available",
      is_active: parsed.data.isActive,
      metadata: {},
      created_by: current.userId,
      updated_by: current.userId,
    })
    .select(
      "id, form_number, title, category, jurisdiction_state, availability_status, is_active",
    )
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, template: data });
}
