import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { detectPdfFieldNames } from "@/lib/documents/pdf-fields";
import { fillPdfFromMappedFields } from "@/lib/documents/fill-pdf-acroform";
import type { TemplateFieldMappings } from "@/lib/documents/template-field-mapping";
import { buildTransactionFieldSnapshot } from "@/lib/documents/transaction-data-snapshot";

describe("fillPdfFromMappedFields", () => {
  it("fills text fields from canonical mappings", async () => {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]);
    const form = pdf.getForm();
    const addr = form.createTextField("addr_field");
    addr.addToPage(page, { x: 50, y: 700, width: 300, height: 20 });
    const templatePdfBytes = await pdf.save();

    const mappings: TemplateFieldMappings = {
      addr_field: "property_address",
    };
    const snapshot = buildTransactionFieldSnapshot({
      property_address: "456 Oak Ave",
      mls_number: null,
      close_date: null,
      notes: null,
      intake_data: {},
    });

    const filled = await fillPdfFromMappedFields({
      templatePdfBytes,
      fieldMappings: mappings,
      snapshot,
    });

    const names = await detectPdfFieldNames(filled);
    expect(names).toContain("addr_field");

    const loaded = await PDFDocument.load(filled);
    const textField = loaded.getForm().getTextField("addr_field");
    expect(textField.getText()).toContain("456 Oak");
  });
});
