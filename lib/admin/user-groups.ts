export const TENANT_GROUPS = [
  "Admin",
  "TC",
  "Broker",
  "Client",
  "Title",
  "Mortgage",
] as const;

export type TenantGroup = (typeof TENANT_GROUPS)[number];

export const TENANT_LOGIN_TYPES = [
  "admin",
  "tc",
  "agent",
  "broker",
  "buyer",
  "seller",
  "mortgage",
  "title",
] as const;

export type TenantLoginType = (typeof TENANT_LOGIN_TYPES)[number];

export const TENANT_ASSIGNABLE_LOGIN_TYPES = [
  "admin",
  "tc",
  "broker",
  "buyer",
  "seller",
  "mortgage",
  "title",
] as const satisfies readonly TenantLoginType[];

export type TenantAssignableLoginType = (typeof TENANT_ASSIGNABLE_LOGIN_TYPES)[number];

export function assignableLoginType(role: string): TenantAssignableLoginType {
  if (role === "agent") return "broker";
  if (TENANT_ASSIGNABLE_LOGIN_TYPES.includes(role as TenantAssignableLoginType)) {
    return role as TenantAssignableLoginType;
  }
  return "buyer";
}

export function isTenantGroup(value: string): value is TenantGroup {
  return TENANT_GROUPS.includes(value as TenantGroup);
}

export function groupForRole(role: string): TenantGroup {
  if (["admin", "tenant_admin"].includes(role)) return "Admin";
  if (role === "tc") return "TC";
  if (["broker", "agent"].includes(role)) return "Broker";
  if (["buyer", "seller"].includes(role)) return "Client";
  if (role === "title") return "Title";
  if (role === "mortgage") return "Mortgage";
  return "Client";
}

export function groupMapFromTenantSettings(settings: unknown): Record<string, TenantGroup> {
  if (!settings || typeof settings !== "object") return {};
  const raw = (settings as Record<string, unknown>).userGroups;
  if (!raw || typeof raw !== "object") return {};

  const out: Record<string, TenantGroup> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" && isTenantGroup(value)) out[key] = value;
  }
  return out;
}

export function applyGroupToTenantSettings(
  settings: unknown,
  userId: string,
  group: TenantGroup,
): Record<string, unknown> {
  const base = settings && typeof settings === "object" ? { ...(settings as Record<string, unknown>) } : {};
  const existingMap = groupMapFromTenantSettings(base);
  return {
    ...base,
    userGroups: {
      ...existingMap,
      [userId]: group,
    },
  };
}
