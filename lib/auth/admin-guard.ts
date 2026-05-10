import { NextResponse } from "next/server";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isGlobalAdminRole, isTenantAdminRole } from "@/lib/auth/roles";

export async function requireGlobalAdmin() {
  const actor = await loadActorContext();
  if (!actor) return { actor: null, error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (!isGlobalAdminRole(actor.role)) {
    return { actor: null, error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { actor, error: null };
}

export async function requireTenantAdminOrGlobal() {
  const actor = await loadActorContext();
  if (!actor) return { actor: null, error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (!isTenantAdminRole(actor.role)) {
    return { actor: null, error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { actor, error: null };
}

