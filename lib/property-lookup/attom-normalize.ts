import type { PropertyLookupSuggestion } from "./types";

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Conservative ATTOM normalizer: only maps fields when a known value is present. */
export function normalizeAttomSuggestions(payload: unknown): PropertyLookupSuggestion[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const property = Array.isArray(root.property) ? (root.property[0] as Record<string, unknown> | undefined) : undefined;
  if (!property) return [];
  const address = (property.address ?? {}) as Record<string, unknown>;
  const lot = (property.lot ?? {}) as Record<string, unknown>;
  const assessment = (property.assessment ?? {}) as Record<string, unknown>;
  const owner = (property.owner ?? {}) as Record<string, unknown>;
  const identifier = (property.identifier ?? {}) as Record<string, unknown>;
  const candidates: Array<[PropertyLookupSuggestion["fieldKey"], string | null]> = [
    ["property_address", text(address.oneLine)],
    ["parcel_number", text(identifier.apn)],
    ["owner_name", text(owner.owner1?.toString())],
    ["acreage", lot.lotSize1 ? String(lot.lotSize1) : null],
    ["assessed_value", assessment.assessed?.toString() ?? null],
  ];
  return candidates.flatMap(([fieldKey, value]) => value ? [{ fieldKey, value, sourceKind: "attom" as const, confidence: 85, sourceNotes: "Normalized from configured ATTOM property response; human confirmation required." }] : []);
}
