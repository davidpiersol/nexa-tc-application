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
    if (pathname.startsWith("/admin/tenant")) return "/admin/tenant/dashboard";
    return "/admin/global/dashboard";
  }
  if (role === "tc") return "/tc";
  if (role === "agent") {
    const parts = pathname.split("/").filter(Boolean);
    const seg = parts[1];
    if (seg && seg !== "profile" && seg.length > 0) {
      return `/agent/${seg}`;
    }
    return "/agent";
  }
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
      { href: "/tc/mls-entry", label: "MLS entry" },
      { href: "/tc/contacts", label: "Contacts" },
      { href: "/tc/brokers", label: "Brokers" },
      { href: "/tc/billing", label: "Billing" },
      { href: "/tc/archive", label: "Archive" },
      { href: "/tc/settings", label: "Settings" },
    ];
  }

  if (role === "admin") {
    if (pathname.startsWith("/admin/global")) {
      return [
        { href: "/admin/global/dashboard", label: "Dashboard" },
        { href: "/admin/global/tenants", label: "Tenants" },
        { href: "/admin/global/templates", label: "Templates" },
        { href: "/admin/global/package-rules", label: "Package rules" },
        { href: "/admin/global/wiki", label: "Wiki" },
        { href: "/admin/global/reports", label: "Reports" },
      ];
    }
    return [
      { href: "/admin/tenant/dashboard", label: "Dashboard" },
      { href: "/admin/tenant/users", label: "Users" },
      { href: "/admin/tenant/groups", label: "Groups" },
      { href: "/admin/tenant/reports", label: "Reports" },
    ];
  }

  if (role === "agent") {
    return [
      { href: "/agent", label: "Transactions" },
      { href: "/agent/profile", label: "Signing & profile" },
    ];
  }

  return [{ href: base, label: "Overview" }];
}

/**
 * Profile route per role: TC `/tc/profile`; agent `/agent/profile`; other parties `/{role}/{transactionId}/profile`.
 */
export function profileHrefFromPathname(pathname: string): string | null {
  const role = roleFromPathname(pathname);
  if (!role) return null;
  if (role === "admin") return null;
  if (role === "tc") return "/tc/profile";
  if (role === "agent") return "/agent/profile";

  const parts = pathname.split("/").filter(Boolean);
  const scopedId = parts[1];
  if (!scopedId || scopedId === "profile") return null;

  return `/${role}/${scopedId}/profile`;
}
