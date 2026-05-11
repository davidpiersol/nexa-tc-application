/**
 * Context-aware default article for the current pathname.
 * More specific patterns win (first match).
 */

const ROUTE_RULES: { slug: string; test: (pathname: string) => boolean }[] = [
  {
    slug: "tc-document-manager",
    test: (p) => /\/tc\/transactions\/[^/]+\/documents$/.test(p),
  },
  {
    slug: "tc-checklists",
    test: (p) => /\/tc\/transactions\/[^/]+\/first-pass$/.test(p),
  },
  {
    slug: "tc-opening-a-transaction",
    test: (p) =>
      /\/tc\/transactions\/[^/]+$/.test(p) &&
      !p.endsWith("/transactions") &&
      !/\/transactions\/[^/]+\/(documents|first-pass)$/.test(p),
  },
  {
    slug: "tc-opening-a-transaction",
    test: (p) => p === "/tc/transactions",
  },
  {
    slug: "tc-contact-delete-impact-check",
    test: (p) => /^\/tc\/contacts\/[^/]+$/.test(p),
  },
  {
    slug: "tc-contacts-directory",
    test: (p) => p === "/tc/contacts" || p.startsWith("/tc/contacts/"),
  },
  {
    slug: "tc-broker-profiles",
    test: (p) => p === "/tc/brokers" || p.startsWith("/tc/brokers/"),
  },
  {
    slug: "tc-deadlines-and-tasks",
    test: (p) => p === "/tc/settings" || p.startsWith("/tc/settings/"),
  },
  {
    slug: "tc-dashboard-overview",
    test: (p) => p === "/tc" || p === "/tc/",
  },
  {
    slug: "buyer-welcome",
    test: (p) => /^\/buyer\/[^/]+$/.test(p),
  },
  {
    slug: "seller-welcome",
    test: (p) => /^\/seller\/[^/]+$/.test(p),
  },
  {
    slug: "agent-dashboard-overview",
    test: (p) => /^\/agent\/[^/]+$/.test(p),
  },
  {
    slug: "mortgage-dashboard-overview",
    test: (p) => /^\/mortgage\/[^/]+$/.test(p),
  },
  {
    slug: "title-dashboard-overview",
    test: (p) => /^\/title\/[^/]+$/.test(p),
  },
  {
    slug: "global-admin-wiki",
    test: (p) => p === "/admin/global/wiki",
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
