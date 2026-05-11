import { describe, expect, it } from "vitest";
import {
  canVersionBecomeCurrent,
  isCanonicalTemplateFieldKey,
  validateTemplateFieldMappings,
} from "@/lib/documents/template-field-mapping";

describe("template field mapping helpers", () => {
  it("accepts known canonical keys and rejects unknown keys", () => {
    expect(isCanonicalTemplateFieldKey("property_address")).toBe(true);
    expect(isCanonicalTemplateFieldKey("intake_data.buyer_signature_date")).toBe(true);
    expect(isCanonicalTemplateFieldKey("intake_data.some_random_json_path")).toBe(false);
  });

  it("validates mappings against detected pdf fields and canonical options", () => {
    const result = validateTemplateFieldMappings(
      {
        property_address_field: "property_address",
        buyer_signature_field: "intake_data.buyer_signature_date",
      },
      ["property_address_field", "buyer_signature_field"],
    );

    expect(result.errors).toEqual([]);
    expect(result.normalized).toEqual({
      property_address_field: "property_address",
      buyer_signature_field: "intake_data.buyer_signature_date",
    });
  });

  it("reports unknown fields and duplicate canonical targets", () => {
    const result = validateTemplateFieldMappings(
      {
        unknown_pdf: "property_address",
        addr_1: "property_address",
        addr_2: "property_address",
      },
      ["addr_1", "addr_2"],
    );

    expect(result.errors).toContain("unknown_pdf_field:unknown_pdf");
    expect(result.errors).toContain("duplicate_canonical_field:property_address");
    expect(result.normalized).toEqual({
      addr_1: "property_address",
    });
  });

  it("requires approved review + mapping status before current promotion", () => {
    expect(
      canVersionBecomeCurrent({ reviewStatus: "approved", mappingReviewStatus: "approved" }),
    ).toBe(true);
    expect(
      canVersionBecomeCurrent({ reviewStatus: "approved", mappingReviewStatus: "needs_review" }),
    ).toBe(false);
    expect(
      canVersionBecomeCurrent({ reviewStatus: "needs_review", mappingReviewStatus: "approved" }),
    ).toBe(false);
  });
});
