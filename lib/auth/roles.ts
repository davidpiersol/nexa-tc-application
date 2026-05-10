export type AppRole =
  | "global_admin"
  | "tenant_admin"
  | "superadmin"
  | "admin"
  | "tc"
  | "broker"
  | "agent"
  | "buyer"
  | "seller"
  | "title"
  | "mortgage";

export const GLOBAL_ADMIN_ROLES = new Set<AppRole>(["global_admin", "superadmin"]);
export const TENANT_ADMIN_ROLES = new Set<AppRole>(["tenant_admin", "admin"]);
export const TC_ROLES = new Set<AppRole>(["tc"]);
export const PRIVILEGED_ROLES = new Set<AppRole>([
  "global_admin",
  "superadmin",
  "tenant_admin",
  "admin",
  "tc",
]);

export function asAppRole(role: string | undefined | null): AppRole | null {
  if (!role) return null;
  const v = role as AppRole;
  const allow: AppRole[] = [
    "global_admin",
    "tenant_admin",
    "superadmin",
    "admin",
    "tc",
    "broker",
    "agent",
    "buyer",
    "seller",
    "title",
    "mortgage",
  ];
  return allow.includes(v) ? v : null;
}

export function isGlobalAdminRole(role: string | undefined | null): boolean {
  const v = asAppRole(role);
  return !!v && GLOBAL_ADMIN_ROLES.has(v);
}

export function isTenantAdminRole(role: string | undefined | null): boolean {
  const v = asAppRole(role);
  return !!v && (TENANT_ADMIN_ROLES.has(v) || GLOBAL_ADMIN_ROLES.has(v));
}

export function isPrivilegedRole(role: string | undefined | null): boolean {
  const v = asAppRole(role);
  return !!v && PRIVILEGED_ROLES.has(v);
}

