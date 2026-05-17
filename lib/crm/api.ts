import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { loadActorContext, type ActorContext } from "@/lib/auth/actor-context";
import { asAppRole, isPrivilegedRole } from "@/lib/auth/roles";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export function canUseCrm(role: string | null | undefined): boolean {
  const appRole = asAppRole(role);
  return appRole === "broker" || appRole === "agent" || isPrivilegedRole(appRole);
}

export async function requireCrmApiActor(request: NextRequest): Promise<
  | { actor: ActorContext; response?: never }
  | { actor?: never; response: NextResponse }
> {
  const actor = await loadActorContext();
  const limited = await enforceApiRateLimit(request, actor?.userId);
  if (limited) return { response: limited };
  if (!(await validateCsrf(request))) {
    return { response: NextResponse.json({ error: "csrf_invalid" }, { status: 403 }) };
  }
  if (!actor) return { response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (!canUseCrm(actor.role)) {
    return { response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { actor };
}

export async function contactBelongsToTenant(
  tenantId: string,
  contactId: string | null,
): Promise<boolean> {
  if (!contactId) return true;
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("contacts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", contactId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

export async function contactsBelongToTenant(
  tenantId: string,
  contactIds: Array<string | null>,
): Promise<boolean> {
  const ids = Array.from(new Set(contactIds.filter(Boolean) as string[]));
  if (ids.length === 0) return true;
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("contacts")
    .select("id")
    .eq("tenant_id", tenantId)
    .in("id", ids);
  if (error) return false;
  return (data ?? []).length === ids.length;
}
