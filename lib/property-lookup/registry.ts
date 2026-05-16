export const REQUIRED_PROPERTY_FIELDS = [
  "property_address",
  "county",
  "parcel_number",
  "owner_name",
  "mailing_address",
  "property_legal_description",
  "acreage",
] as const;

export function missingPropertyFields(fields: Record<string, unknown>): string[] {
  return REQUIRED_PROPERTY_FIELDS.filter((field) => !String(fields[field] ?? "").trim());
}
