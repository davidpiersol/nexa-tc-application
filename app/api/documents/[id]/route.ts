import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { createClient } from "@/lib/supabase/server";

const BUCKET =
  process.env.SUPABASE_ATTACHMENTS_BUCKET?.trim() || "attachments";

type Ctx = { params: { id: string } };

/**
 * Signed download URL for a document row — RLS must allow read; otherwise 403/404.
 */
export async function GET(request: NextRequest, ctx: Ctx) {
  const { id } = ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const limited = await enforceApiRateLimit(request, user?.id);
  if (limited) return limited;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, storage_path, file_name, mime_type, tenant_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!doc?.storage_path) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, 60);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json(
      { error: signErr?.message ?? "sign_failed" },
      { status: 403 },
    );
  }

  return NextResponse.json({
    url: signed.signedUrl,
    file_name: doc.file_name,
    mime_type: doc.mime_type,
  });
}
