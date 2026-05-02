import type { DashboardRole } from "@/types/roles";

export type NavItem = { href: string; label: string };

export function roleFromPathname(pathname: string): DashboardRole | null {
  const parts = pathname.split("/").filter(Boolean);
  const seg = parts[0];
  if (
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

  return [{ href: base, label: "Overview" }];
}
