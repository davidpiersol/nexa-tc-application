export const CORE_CANONICAL_TEMPLATE_FIELDS = [
  "property_address",
  "mls_number",
  "close_date",
  "notes",
] as const;

export const INTAKE_DATA_CANONICAL_KEYS = [
  "tc_engaged",
  "tc_review_completed_by",
  "tc_review_completed_at",
  "source_forms_received",
  "follow_up_required",
  "follow_up_notes",
  "tc_representation_side",
  "sellers_names",
  "seller_signature_captured",
  "seller_signature_date",
  "seller_is_nm_broker",
  "seller_has_other_listing_agreement",
  "conflict_of_interest_disclosed",
  "conflict_of_interest_explanation",
  "adverse_material_facts_disclosed",
  "adverse_material_facts_explanation",
  "property_legal_description",
  "property_type",
  "community_type",
  "farm_and_ranch",
  "rights_conveyed",
  "rights_conveyed_explanation",
  "fixture_exclusions",
  "seller_broker_1_brokerage_firm",
  "seller_broker_1_qualifying_broker_name",
  "seller_broker_1_nmrec_license_no",
  "seller_broker_1_broker_name",
  "seller_broker_1_team_name",
  "seller_broker_1_office_phone",
  "seller_broker_1_cell_phone",
  "seller_broker_1_email",
  "seller_broker_1_address",
  "seller_broker_1_city",
  "seller_broker_1_state",
  "seller_broker_1_zip_code",
  "seller_broker_1_is_realtor",
  "seller_broker_2_brokerage_firm",
  "seller_broker_2_qualifying_broker_name",
  "seller_broker_2_nmrec_license_no",
  "seller_broker_2_broker_name",
  "seller_broker_2_team_name",
  "seller_broker_2_office_phone",
  "seller_broker_2_cell_phone",
  "seller_broker_2_email",
  "seller_broker_2_address",
  "seller_broker_2_city",
  "seller_broker_2_state",
  "seller_broker_2_zip_code",
  "seller_broker_2_is_realtor",
  "buyers_names",
  "buyer_signature_captured",
  "buyer_signature_date",
  "buyer_is_nm_broker",
  "buyer_has_other_broker_agreement",
  "buyer_broker_1_brokerage_firm",
  "buyer_broker_1_qualifying_broker_name",
  "buyer_broker_1_nmrec_license_no",
  "buyer_broker_1_broker_name",
  "buyer_broker_1_team_name",
  "buyer_broker_1_office_phone",
  "buyer_broker_1_cell_phone",
  "buyer_broker_1_email",
  "buyer_broker_1_address",
  "buyer_broker_1_city",
  "buyer_broker_1_state",
  "buyer_broker_1_zip_code",
  "buyer_broker_1_is_realtor",
  "buyer_broker_2_brokerage_firm",
  "buyer_broker_2_qualifying_broker_name",
  "buyer_broker_2_nmrec_license_no",
  "buyer_broker_2_broker_name",
  "buyer_broker_2_team_name",
  "buyer_broker_2_office_phone",
  "buyer_broker_2_cell_phone",
  "buyer_broker_2_email",
  "buyer_broker_2_address",
  "buyer_broker_2_city",
  "buyer_broker_2_state",
  "buyer_broker_2_zip_code",
  "buyer_broker_2_is_realtor",
] as const;

const CORE_CANONICAL_SET = new Set<string>(CORE_CANONICAL_TEMPLATE_FIELDS);
const INTAKE_CANONICAL_SET = new Set<string>(
  INTAKE_DATA_CANONICAL_KEYS.map((key) => `intake_data.${key}`),
);

export type TemplateFieldMappings = Record<string, string>;

export type CanonicalFieldPickerOption = {
  key: string;
  label: string;
  group: "transaction" | "intake_data";
};

export const CANONICAL_FIELD_PICKER_OPTIONS: CanonicalFieldPickerOption[] = [
  ...CORE_CANONICAL_TEMPLATE_FIELDS.map((key) => ({
    key,
    label: key.replaceAll("_", " "),
    group: "transaction" as const,
  })),
  ...INTAKE_DATA_CANONICAL_KEYS.map((key) => ({
    key: `intake_data.${key}`,
    label: key.replaceAll("_", " "),
    group: "intake_data" as const,
  })),
];

export function isCanonicalTemplateFieldKey(key: string): boolean {
  return CORE_CANONICAL_SET.has(key) || INTAKE_CANONICAL_SET.has(key);
}

function cleanFieldName(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateTemplateFieldMappings(
  rawMappings: unknown,
  availablePdfFields: unknown,
): { normalized: TemplateFieldMappings; errors: string[] } {
  const errors: string[] = [];
  const normalized: TemplateFieldMappings = {};
  const available = new Set<string>();

  if (Array.isArray(availablePdfFields)) {
    for (const field of availablePdfFields) {
      const cleaned = cleanFieldName(field);
      if (cleaned) available.add(cleaned);
    }
  }

  if (!rawMappings || typeof rawMappings !== "object" || Array.isArray(rawMappings)) {
    return {
      normalized: {},
      errors: ["mappings_invalid_shape"],
    };
  }

  const usedCanonical = new Set<string>();
  for (const [rawPdfField, rawCanonicalField] of Object.entries(rawMappings)) {
    const pdfField = cleanFieldName(rawPdfField);
    if (!pdfField) continue;

    if (!available.has(pdfField)) {
      errors.push(`unknown_pdf_field:${pdfField}`);
      continue;
    }

    const canonicalField = cleanFieldName(rawCanonicalField);
    if (!canonicalField) continue;
    if (!isCanonicalTemplateFieldKey(canonicalField)) {
      errors.push(`unknown_canonical_field:${canonicalField}`);
      continue;
    }
    if (usedCanonical.has(canonicalField)) {
      errors.push(`duplicate_canonical_field:${canonicalField}`);
      continue;
    }

    usedCanonical.add(canonicalField);
    normalized[pdfField] = canonicalField;
  }

  return { normalized, errors };
}

export function canVersionBecomeCurrent(input: {
  reviewStatus: string | null | undefined;
  mappingReviewStatus: string | null | undefined;
}): boolean {
  return input.reviewStatus === "approved" && input.mappingReviewStatus === "approved";
}
