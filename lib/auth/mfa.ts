/** Roles that must complete Supabase MFA (TOTP) before using the app. */
export const MFA_REQUIRED_ROLES = new Set(["tc", "admin", "superadmin"]);

export function roleRequiresMfa(role: string | undefined | null): boolean {
  if (!role) return false;
  return MFA_REQUIRED_ROLES.has(role);
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
