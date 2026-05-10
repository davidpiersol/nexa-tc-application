import type { DashboardRole } from "@/types/roles";

export type NavItem = { href: string; label: string };

export function roleFromPathname(pathname: string): DashboardRole | null {
  const parts = pathname.split("/").filter(Boolean);
  const seg = parts[0];
  if (
    seg === "admin" ||
    seg === "tc" ||
    seg === "agent" ||
    seg === "buyer" ||
    seg === "seller" ||
    seg === "mortgage" ||
    seg === "title"
  ) {
    return seg;
  }
  return null;
}

/** Role + optional scoped id (e.g. buyer workspace). */
export function routeBase(pathname: string): string {
  const role = roleFromPathname(pathname);
  if (!role) return "/";
  if (role === "admin") {
    return pathname.startsWith("/admin/tenant") ? "/admin/tenant" : "/admin/global";
  }
  if (role === "tc") return "/tc";
  const parts = pathname.split("/").filter(Boolean);
  const id = parts[1];
  if (id) return `/${role}/${id}`;
  return `/${role}`;
}

export function navItemsForPath(pathname: string): NavItem[] {
  const role = roleFromPathname(pathname);
  if (!role) return [];
  const base = routeBase(pathname);

  if (role === "tc") {
    return [
      { href: "/tc", label: "Overview" },
      { href: "/tc/transactions", label: "Transactions" },
      { href: "/tc/settings", label: "Settings" },
    ];
  }

  if (role === "admin") {
    return [
      { href: "/admin/global", label: "Global" },
      { href: "/admin/tenant", label: "Tenant" },
    ];
  }

  return [{ href: base, label: "Overview" }];
}

/**
 * Profile route per role: TC uses `/tc/profile`; party dashboards use `/{role}/{transactionId}/profile`.
 */
export function profileHrefFromPathname(pathname: string): string | null {
  const role = roleFromPathname(pathname);
  if (!role) return null;
  if (role === "admin") return null;
  if (role === "tc") return "/tc/profile";

  const parts = pathname.split("/").filter(Boolean);
  const scopedId = parts[1];
  if (!scopedId || scopedId === "profile") return null;

  return `/${role}/${scopedId}/profile`;
}

