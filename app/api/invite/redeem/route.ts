import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { claimInviteJti, releaseInviteJti } from "@/lib/invite/redis";
import { verifyInviteToken } from "@/lib/invite/jwt";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { validateCsrf } from "@/lib/security/csrf-server";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";

const bodySchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

/**
 * Complete invite: verify JWT, anti-replay via Redis, create auth user + profile row.
 */
export async function POST(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;

  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const payload = await verifyInviteToken(parsed.data.token);
  if (!payload) {
    return NextResponse.json({ error: "invalid_invite" }, { status: 400 });
  }

  const claimed = await claimInviteJti(payload.jti);
  if (!claimed) {
    return NextResponse.json({ error: "invite_already_used" }, { status: 409 });
  }

  try {
    const admin = createServiceRoleClient();
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: payload.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        tenant_id: payload.tenant_id,
        role: payload.role,
      },
      app_metadata: {
        tenant_id: payload.tenant_id,
        role: payload.role,
      },
    });

    if (createErr || !created.user) {
      await releaseInviteJti(payload.jti);
      return NextResponse.json(
        { error: createErr?.message ?? "create_user_failed" },
        { status: 400 },
      );
    }

    const { error: profileErr } = await admin.from("users").insert({
      id: created.user.id,
      tenant_id: payload.tenant_id,
      email: payload.email,
      role: payload.role,
    });

    if (profileErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      await releaseInviteJti(payload.jti);
      return NextResponse.json({ error: profileErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, userId: created.user.id });
  } catch (e) {
    await releaseInviteJti(payload.jti);
    const msg = e instanceof Error ? e.message : "server_error";
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json({ error: "service_role_not_configured" }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
