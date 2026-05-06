/**
 * TC “All transactions” list — optional `?filter=` query aligned with dashboard KPIs.
 */

export const TC_TRANSACTION_LIST_FILTERS = [
  "active",
  "due-week",
  "pending-reviews",
  "signatures",
] as const;

export type TcTransactionListFilter = (typeof TC_TRANSACTION_LIST_FILTERS)[number];

export function isTcTransactionListFilter(
  value: string | undefined,
): value is TcTransactionListFilter {
  return (
    value !== undefined &&
    (TC_TRANSACTION_LIST_FILTERS as readonly string[]).includes(value)
  );
}

/** Parses `filter` from Next.js `searchParams` (string or string[]). */
export function parseTcTransactionListFilter(
  raw: string | string[] | undefined,
): TcTransactionListFilter | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v || !isTcTransactionListFilter(v)) return undefined;
  return v;
}

/** Human-readable banner title for the active filter. */
export function tcTransactionListFilterTitle(
  filter: TcTransactionListFilter | undefined,
): string | undefined {
  if (!filter) return undefined;
  switch (filter) {
    case "active":
      return "Active transactions";
    case "due-week":
      return "Due this week";
    case "pending-reviews":
      return "Pending reviews";
    case "signatures":
      return "Signatures needed";
    default:
      return undefined;
  }
}

/** Query-string values used by TC dashboard StatsCard links. */
export function tcTransactionListHref(filter: TcTransactionListFilter): string {
  return `/tc/transactions?filter=${encodeURIComponent(filter)}`;
}
