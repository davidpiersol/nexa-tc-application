/** Best-effort US address split for ATTOM (`line1, city, ST 12345`). */

export function parseUsAddress(
  line: string | null | undefined,
): { line1: string; city: string; state: string; postalCode: string } | null {
  if (!line?.trim()) return null;
  const parts = line
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 3) return null;
  const last = parts[parts.length - 1]!;
  const m = last.match(/^([A-Za-z]{2})\s+(\d{5})(-\d{4})?$/);
  if (!m) return null;
  const state = m[1]!.toUpperCase();
  const postalCode = m[2]! + (m[3] ?? "");
  const city = parts[parts.length - 2]!;
  const line1 = parts.slice(0, parts.length - 2).join(", ");
  if (!line1) return null;
  return { line1, city, state, postalCode };
}
