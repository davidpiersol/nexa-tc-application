import type { TemplateFieldMappings } from "@/lib/documents/template-field-mapping";

/** Flat transaction + intake values used for PDF fill and persisted snapshots. */
export type TransactionFieldSnapshot = {
  property_address: string | null;
  mls_number: string | null;
  close_date: string | null;
  notes: string | null;
  intake_data: Record<string, unknown>;
};

export type StoredGenerationSnapshot = {
  template_id: string;
  template_version_id: string;
  form_number: string;
  captured_at: string;
  field_snapshot: TransactionFieldSnapshot;
};

function normalizeIntake(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

export function buildTransactionFieldSnapshot(row: {
  property_address: string | null;
  mls_number: string | null;
  close_date: string | null;
  notes: string | null;
  intake_data: unknown;
}): TransactionFieldSnapshot {
  return {
    property_address: row.property_address?.trim() || null,
    mls_number: row.mls_number?.trim() || null,
    close_date: row.close_date?.trim() || null,
    notes: row.notes?.trim() || null,
    intake_data: normalizeIntake(row.intake_data),
  };
}

export function normalizeScalarForPdf(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") return value.trim();
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

export function valueForCanonicalField(
  snapshot: TransactionFieldSnapshot,
  canonicalField: string,
): string {
  switch (canonicalField) {
    case "property_address":
      return normalizeScalarForPdf(snapshot.property_address);
    case "mls_number":
      return normalizeScalarForPdf(snapshot.mls_number);
    case "close_date":
      return normalizeScalarForPdf(snapshot.close_date);
    case "notes":
      return normalizeScalarForPdf(snapshot.notes);
    default:
      break;
  }

  if (canonicalField.startsWith("intake_data.")) {
    const key = canonicalField.slice("intake_data.".length);
    return normalizeScalarForPdf(snapshot.intake_data[key]);
  }

  return "";
}

/** Unique canonical keys referenced by PDF field mappings (pdf field → canonical). */
export function mappedCanonicalKeys(mappings: TemplateFieldMappings): string[] {
  return Array.from(new Set(Object.values(mappings).map((k) => k.trim()).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b),
  );
}

/**
 * Returns canonical field keys that are mapped but have no non-empty value in the snapshot.
 */
export function listMissingMappedCanonicalFields(
  mappings: TemplateFieldMappings,
  snapshot: TransactionFieldSnapshot,
): string[] {
  const missing: string[] = [];
  for (const key of mappedCanonicalKeys(mappings)) {
    if (valueForCanonicalField(snapshot, key).length === 0) {
      missing.push(key);
    }
  }
  return missing;
}

export function buildStoredGenerationSnapshot(input: {
  templateId: string;
  templateVersionId: string;
  formNumber: string;
  fieldSnapshot: TransactionFieldSnapshot;
}): StoredGenerationSnapshot {
  return {
    template_id: input.templateId,
    template_version_id: input.templateVersionId,
    form_number: input.formNumber,
    captured_at: new Date().toISOString(),
    field_snapshot: input.fieldSnapshot,
  };
}
