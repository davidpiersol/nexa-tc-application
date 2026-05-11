import { asAppRole, isGlobalAdminRole, isTenantAdminRole } from "@/lib/auth/roles";

export function canAccessContacts(role: string | null | undefined): boolean {
  const appRole = asAppRole(role);
  return !!appRole && ["global_admin", "superadmin", "tenant_admin", "admin", "tc", "broker", "agent"].includes(appRole);
}

export function canWriteContacts(role: string | null | undefined): boolean {
  const appRole = asAppRole(role);
  return !!appRole && ["global_admin", "superadmin", "tenant_admin", "admin", "tc"].includes(appRole);
}

export function canManageBrokerCredentials(role: string | null | undefined): boolean {
  return isGlobalAdminRole(role) || isTenantAdminRole(role);
}
