import { describe, expect, it } from "vitest";
import {
  buildStoredGenerationSnapshot,
  buildTransactionFieldSnapshot,
  listMissingMappedCanonicalFields,
  mappedCanonicalKeys,
  normalizeScalarForPdf,
  valueForCanonicalField,
} from "@/lib/documents/transaction-data-snapshot";
import type { TemplateFieldMappings } from "@/lib/documents/template-field-mapping";

describe("transaction field snapshot", () => {
  it("builds snapshot from transaction row", () => {
    const snap = buildTransactionFieldSnapshot({
      property_address: " 123 Main ",
      mls_number: "MLS1",
      close_date: "2026-06-01",
      notes: null,
      intake_data: { sellers_names: "A & B", tc_engaged: true },
    });
    expect(snap.property_address).toBe("123 Main");
    expect(snap.intake_data.tc_engaged).toBe(true);
  });

  it("reads core and intake canonical fields", () => {
    const snap = buildTransactionFieldSnapshot({
      property_address: "x",
      mls_number: null,
      close_date: null,
      notes: "",
      intake_data: {},
    });
    expect(valueForCanonicalField(snap, "property_address")).toBe("x");
    expect(valueForCanonicalField(snap, "mls_number")).toBe("");
    expect(valueForCanonicalField(snap, "intake_data.custom")).toBe("");
  });

  it("lists mapped canonical keys uniquely", () => {
    const mappings: TemplateFieldMappings = {
      A: "property_address",
      B: "property_address",
      C: "intake_data.tc_engaged",
    };
    expect(mappedCanonicalKeys(mappings)).toEqual([
      "intake_data.tc_engaged",
      "property_address",
    ]);
  });

  it("reports missing values for mapped fields only", () => {
    const mappings: TemplateFieldMappings = {
      f1: "property_address",
      f2: "notes",
    };
    const snap = buildTransactionFieldSnapshot({
      property_address: "",
      mls_number: "m",
      close_date: null,
      notes: "ok",
      intake_data: {},
    });
    expect(listMissingMappedCanonicalFields(mappings, snap)).toEqual(["property_address"]);
  });

  it("buildStoredGenerationSnapshot nests transaction snapshot", () => {
    const fieldSnapshot = buildTransactionFieldSnapshot({
      property_address: "1",
      mls_number: null,
      close_date: null,
      notes: null,
      intake_data: {},
    });
    const stored = buildStoredGenerationSnapshot({
      templateId: "00000000-0000-4000-8000-000000000001",
      templateVersionId: "00000000-0000-4000-8000-000000000002",
      formNumber: "NMAR-1",
      fieldSnapshot,
    });
    expect(stored.template_version_id).toBe("00000000-0000-4000-8000-000000000002");
    expect(stored.field_snapshot.property_address).toBe("1");
    expect(stored.captured_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("normalizeScalarForPdf coerces booleans", () => {
    expect(normalizeScalarForPdf(true)).toBe("Yes");
    expect(normalizeScalarForPdf(false)).toBe("No");
  });
});
