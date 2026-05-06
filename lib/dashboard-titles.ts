/** Top bar titles aligned with Figma frame names (fallback when route matches). */
export function dashboardTitleForPath(pathname: string): string {
  if (pathname === "/tc/profile") return "Profile";
  if (pathname.match(/^\/agent\/[^/]+\/profile$/)) return "Profile";
  if (pathname.match(/^\/seller\/[^/]+\/profile$/)) return "Profile";
  if (pathname.match(/^\/mortgage\/[^/]+\/profile$/)) return "Profile";
  if (pathname.match(/^\/title\/[^/]+\/profile$/)) return "Profile";
  if (pathname.match(/^\/buyer\/[^/]+\/profile$/)) return "Profile";
  if (pathname === "/tc") return "TC Dashboard";
  if (pathname.startsWith("/tc/transactions/") && pathname.includes("/first-pass")) {
    return "First Pass Review";
  }
  if (pathname.startsWith("/tc/transactions/") && pathname.includes("/documents")) {
    return "Document Manager";
  }
  if (pathname === "/tc/transactions/new") return "New Transaction";
  if (pathname.match(/^\/tc\/transactions\/[^/]+$/)) {
    return "Transaction Detail";
  }
  if (pathname === "/tc/transactions") return "Transactions";
  if (pathname === "/tc/settings") return "Settings";
  if (pathname.match(/^\/agent\/[^/]+$/)) return "Agent Dashboard";
  if (pathname.match(/^\/buyer\/[^/]+$/)) return "Buyer Dashboard";
  if (pathname.match(/^\/seller\/[^/]+$/)) return "Seller Dashboard";
  if (pathname.match(/^\/mortgage\/[^/]+$/)) return "Mortgage Dashboard";
  if (pathname.match(/^\/title\/[^/]+$/)) return "Title Dashboard";
  return "Nexa";
}
