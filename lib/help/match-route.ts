/**
 * Context-aware default article for the current pathname.
 * More specific patterns win (first match).
 */

const ROUTE_RULES: { slug: string; test: (pathname: string) => boolean }[] = [
  {
    slug: "tc-document-manager",
    test: (p) => /\/tc\/transactions\/[^/]+\/documents(\/[^/]+)?$/.test(p),
  },
  {
    slug: "tc-checklists",
    test: (p) => /\/tc\/transactions\/[^/]+\/first-pass$/.test(p),
  },
  {
    slug: "tc-assign-vendors",
    test: (p) => /\/tc\/transactions\/[^/]+\/vendors$/.test(p),
  },
  {
    slug: "tc-inviting-parties",
    test: (p) => /\/tc\/transactions\/[^/]+\/parties\/[^/]+$/.test(p),
  },
  {
    slug: "tc-opening-a-transaction",
    test: (p) => p === "/tc/transactions/new",
  },
  {
    slug: "tc-opening-a-transaction",
    test: (p) => /\/tc\/transactions\/[^/]+\/edit$/.test(p),
  },
  {
    slug: "tc-opening-a-transaction",
    test: (p) =>
      /\/tc\/transactions\/[^/]+$/.test(p) &&
      !p.endsWith("/transactions") &&
      !/\/transactions\/[^/]+\/(documents|first-pass|vendors|parties|edit)/.test(p),
  },
  {
    slug: "tc-opening-a-transaction",
    test: (p) => p === "/tc/transactions",
  },
  {
    slug: "tc-contacts-directory",
    test: (p) => p === "/tc/contacts" || p === "/tc/contacts/new",
  },
  {
    slug: "tc-contact-delete-impact-check",
    test: (p) => /^\/tc\/contacts\/[^/]+$/.test(p),
  },
  {
    slug: "tc-broker-profiles",
    test: (p) => p === "/tc/brokers" || p.startsWith("/tc/brokers/"),
  },
  {
    slug: "tc-mls-entry",
    test: (p) => p === "/tc/mls-entry" || p.startsWith("/tc/mls-entry/"),
  },
  {
    slug: "tc-billing-and-invoices",
    test: (p) => p === "/tc/billing" || p.startsWith("/tc/billing/"),
  },
  {
    slug: "tc-reports",
    test: (p) => p === "/tc/reports" || p.startsWith("/tc/reports/"),
  },
  {
    slug: "tc-crm",
    test: (p) => p === "/tc/crm" || p.startsWith("/tc/crm/"),
  },
  {
    slug: "tc-deadlines-and-tasks",
    test: (p) => p === "/tc/settings" || p.startsWith("/tc/settings/"),
  },
  {
    slug: "tc-dashboard-overview",
    test: (p) => p === "/tc" || p === "/tc/" || p === "/tc/profile" || p === "/tc/archive",
  },
  {
    slug: "agent-dashboard-overview",
    test: (p) => p === "/agent" || p === "/agent/profile",
  },
  {
    slug: "agent-crm",
    test: (p) => p === "/agent/crm" || p.startsWith("/agent/crm/"),
  },
  {
    slug: "agent-uploading-documents",
    test: (p) => /^\/agent\/[^/]+\/documents$/.test(p),
  },
  {
    slug: "agent-messaging",
    test: (p) => /^\/agent\/[^/]+\/messages$/.test(p),
  },
  {
    slug: "buyer-welcome",
    test: (p) => /^\/buyer\/[^/]+$/.test(p) || /^\/buyer\/[^/]+\/profile$/.test(p),
  },
  {
    slug: "buyer-uploading-documents",
    test: (p) => /^\/buyer\/[^/]+\/documents$/.test(p),
  },
  {
    slug: "agent-dashboard-overview",
    test: (p) => /^\/agent\/[^/]+\/profile$/.test(p),
  },
  {
    slug: "seller-welcome",
    test: (p) => /^\/seller\/[^/]+$/.test(p) || /^\/seller\/[^/]+\/profile$/.test(p),
  },
  {
    slug: "agent-dashboard-overview",
    test: (p) => /^\/agent\/[^/]+$/.test(p),
  },
  {
    slug: "mortgage-dashboard-overview",
    test: (p) => /^\/mortgage\/[^/]+$/.test(p) || /^\/mortgage\/[^/]+\/profile$/.test(p),
  },
  {
    slug: "title-dashboard-overview",
    test: (p) => /^\/title\/[^/]+$/.test(p) || /^\/title\/[^/]+\/profile$/.test(p),
  },
  {
    slug: "global-admin-wiki",
    test: (p) => p === "/admin/global/wiki",
  },
  {
    slug: "global-admin-tenants",
    test: (p) => p === "/admin/global/tenants" || p.startsWith("/admin/global/tenants/"),
  },
  {
    slug: "tenant-admin-user-management",
    test: (p) => p === "/admin/tenant/users" || p.startsWith("/admin/tenant/users/"),
  },
  {
    slug: "global-admin-overview",
    test: (p) =>
      p === "/admin/global" ||
      p === "/admin/global/dashboard" ||
      p === "/admin/global/reports",
  },
  {
    slug: "global-admin-overview",
    test: (p) => p.startsWith("/admin/global"),
  },
];

const DEFAULT_SLUG = "workspace-overview";

export function resolveHelpSlugForPath(pathname: string): string {
  const path =
    pathname.endsWith("/") && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  for (const rule of ROUTE_RULES) {
    if (rule.test(path)) return rule.slug;
  }

  return DEFAULT_SLUG;
}
