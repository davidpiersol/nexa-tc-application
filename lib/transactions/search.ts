type SearchRow = {
  propertyAddress: string | null;
  mlsNumber: string | null;
  notes: string | null;
  intakeData?: Record<string, unknown> | null;
  partyText?: string | null;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return "";
  }
}

export function buildTransactionSearchText(row: SearchRow): string {
  return normalize(
    [
      row.propertyAddress ?? "",
      row.mlsNumber ?? "",
      row.notes ?? "",
      safeJsonStringify(row.intakeData ?? {}),
      row.partyText ?? "",
    ].join(" "),
  );
}

export function matchesTransactionSearch(row: SearchRow, query: string | undefined): boolean {
  const q = normalize(query ?? "");
  if (!q) return true;
  return buildTransactionSearchText(row).includes(q);
}
