export type TenantLifecycleState = {
  is_suspended?: boolean | null;
  archived_at?: string | null;
};

export function tenantLifecycleLabel(tenant: TenantLifecycleState): "active" | "deactivated" | "archived" {
  if (tenant.archived_at) return "archived";
  if (tenant.is_suspended) return "deactivated";
  return "active";
}

export function tenantIsAccessible(tenant: TenantLifecycleState): boolean {
  return tenantLifecycleLabel(tenant) === "active";
}
