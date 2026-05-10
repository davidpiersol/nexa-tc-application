import { isPrivilegedRole } from "@/lib/auth/roles";

/** Roles that must complete Supabase MFA (TOTP) before using the app. */
export const MFA_REQUIRED_ROLES = new Set([
  "tc",
  "admin",
  "superadmin",
  "tenant_admin",
  "global_admin",
]);

export function roleRequiresMfa(role: string | undefined | null): boolean {
  return isPrivilegedRole(role);
}

export function roleFromUser(user: {
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): string | undefined {
  const um = user.user_metadata?.role;
  const am = user.app_metadata?.role;
  if (typeof um === "string") return um;
  if (typeof am === "string") return am;
  return undefined;
}
