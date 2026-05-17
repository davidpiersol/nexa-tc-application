import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { loadActorContext } from "@/lib/auth/actor-context";
import { validateCsrf } from "@/lib/security/csrf-server";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { createClient } from "@/lib/supabase/server";
import { uatIssuesEnabled } from "@/lib/uat/issues";

const createSchema = z.object({
  issueType: z.enum(["bug", "enhancement"]),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(10).max(5000),
  currentUrl: z.string().trim().max(500).optional(),
  severity: z.enum(["low", "medium", "high", "blocking"]).optional(),
});

export async function POST(request: NextRequest) {
  if (!uatIssuesEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const actor = await loadActorContext();
  const limited = await enforceApiRateLimit(request, actor?.userId);
  if (limited) return limited;
  if (!(await validateCsrf(request))) return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let payload: unknown;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.from("uat_issues").insert({
    tenant_id: actor.tenantId,
    submitted_by: actor.userId,
    issue_type: parsed.data.issueType,
    title: parsed.data.title,
    description: parsed.data.description,
    current_url: parsed.data.currentUrl || null,
    severity: parsed.data.severity ?? null,
  }).select("id").single();
  if (error || !data) return NextResponse.json({ error: error?.message ?? "insert_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, issueId: data.id });
}
