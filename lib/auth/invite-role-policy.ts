const BLOCKED_INVITE_ROLES = new Set(["global_admin", "superadmin", "tenant_admin"]);

export function inviteRoleAllowed(role: string): boolean {
  return !BLOCKED_INVITE_ROLES.has(role);
}

