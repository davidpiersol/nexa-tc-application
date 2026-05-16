import type { PropertyLookupSuggestion } from "./types";

const labels: Array<[RegExp, PropertyLookupSuggestion["fieldKey"]]> = [
  [/^owner\s*[:\-]\s*(.+)$/im, "owner_name"],
  [/^parcel(?:\s*(?:number|no\.?|id))?\s*[:\-]\s*(.+)$/im, "parcel_number"],
  [/^legal(?:\s*description)?\s*[:\-]\s*(.+)$/im, "property_legal_description"],
  [/^acreage\s*[:\-]\s*(.+)$/im, "acreage"],
  [/^mailing(?:\s*address)?\s*[:\-]\s*(.+)$/im, "mailing_address"],
  [/^county\s*[:\-]\s*(.+)$/im, "county"],
  [/^assessed(?:\s*value)?\s*[:\-]\s*(.+)$/im, "assessed_value"],
  [/^tax(?:\s*value)?\s*[:\-]\s*(.+)$/im, "tax_value"],
  [/^gis(?:\s*link)?\s*[:\-]\s*(.+)$/im, "gis_link"],
  [/^transfer(?:\s*history)?\s*[:\-]\s*(.+)$/im, "transfer_history"],
];

export function extractManualPropertySuggestions(text: string): PropertyLookupSuggestion[] {
  return labels.flatMap(([pattern, fieldKey]) => {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    return value
      ? [{ fieldKey, value, sourceKind: "manual_text" as const, confidence: 70, sourceNotes: "Extracted from pasted assessor/GIS text; human confirmation required." }]
      : [];
  });
}
