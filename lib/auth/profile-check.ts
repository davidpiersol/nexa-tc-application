import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type PublicUserProfile = { role: string; tenantId: string };

/**
 * Loads `public.users` role for routing — prefers service role so RLS never blocks post-login redirects.
 */
export async function loadPublicUserProfile(userId: string): Promise<PublicUserProfile | null> {
  try {
    const admin = createServiceRoleClient();
    const { data } = await admin
      .from("users")
      .select("role, tenant_id")
      .eq("id", userId)
      .maybeSingle();
    const role = data?.role;
    const tenantId = data?.tenant_id;
    if (typeof role === "string" && typeof tenantId === "string") return { role, tenantId };
  } catch {
    /* Service role missing or DB error — fall back to session-scoped read. */
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("users")
      .select("role, tenant_id")
      .eq("id", userId)
      .maybeSingle();
    const role = data?.role;
    const tenantId = data?.tenant_id;
    if (typeof role === "string" && typeof tenantId === "string") return { role, tenantId };
  } catch {
    /* */
  }

  return null;
}

export async function userHasPublicProfile(userId: string): Promise<boolean> {
  const p = await loadPublicUserProfile(userId);
  return !!p;
}
