/** Top bar titles aligned with Figma frame names (fallback when route matches). */
export function dashboardTitleForPath(pathname: string): string {
  if (pathname === "/tc/profile") return "Profile";
  if (pathname.match(/^\/agent\/[^/]+\/profile$/)) return "Profile";
  if (pathname.match(/^\/seller\/[^/]+\/profile$/)) return "Profile";
  if (pathname.match(/^\/mortgage\/[^/]+\/profile$/)) return "Profile";
  if (pathname.match(/^\/title\/[^/]+\/profile$/)) return "Profile";
  if (pathname.match(/^\/buyer\/[^/]+\/profile$/)) return "Profile";
  if (pathname.match(/^\/buyer\/[^/]+\/documents$/)) return "Buyer Documents";
  if (pathname.match(/^\/buyer\/[^/]+\/messages$/)) return "Message TC";
  if (pathname === "/tc") return "TC Dashboard";
  if (pathname.startsWith("/tc/transactions/") && pathname.includes("/first-pass")) {
    return "First Pass Review";
  }
  if (pathname.startsWith("/tc/transactions/") && pathname.includes("/documents")) {
    return "Document Manager";
  }
  if (pathname.startsWith("/tc/transactions/") && pathname.includes("/edit")) {
    return "Edit Transaction Details";
  }
  if (pathname.startsWith("/tc/transactions/") && pathname.includes("/parties/")) {
    return "Party Details";
  }
  if (pathname === "/tc/transactions/new") return "New Transaction";
  if (pathname.match(/^\/tc\/transactions\/[^/]+$/)) {
    return "Transaction Detail";
  }
  if (pathname === "/tc/archive") return "Archive";
  if (pathname === "/tc/transactions") return "Transactions";
  if (pathname === "/tc/settings") return "Settings";
  if (pathname.match(/^\/agent\/[^/]+$/)) return "Agent Dashboard";
  if (pathname.match(/^\/buyer\/[^/]+$/)) return "Buyer Dashboard";
  if (pathname.match(/^\/seller\/[^/]+$/)) return "Seller Dashboard";
  if (pathname.match(/^\/mortgage\/[^/]+$/)) return "Mortgage Dashboard";
  if (pathname.match(/^\/title\/[^/]+$/)) return "Title Dashboard";
  if (pathname === "/admin/global" || pathname === "/admin/global/dashboard") return "Global Admin";
  if (pathname === "/admin/global/tenants") return "Tenants";
  if (pathname === "/admin/global/reports") return "Reports";
  if (pathname === "/admin/tenant" || pathname === "/admin/tenant/dashboard") return "Admin Console";
  if (pathname === "/admin/tenant/users") return "Users";
  if (pathname === "/admin/tenant/groups") return "Groups";
  if (pathname === "/admin/tenant/reports") return "Reports";
  return "Nexa";
}
