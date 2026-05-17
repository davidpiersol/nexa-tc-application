export function resolveActiveRole(currentRole: string, allowedRoles: readonly string[]): string {
  if (allowedRoles.includes(currentRole)) return currentRole;
  return allowedRoles[0] ?? currentRole;
}
