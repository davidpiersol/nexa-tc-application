import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { detectPdfFieldNames } from "@/lib/documents/pdf-fields";

describe("detectPdfFieldNames", () => {
  it("detects acroform fields from a fillable PDF", async () => {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]);
    const form = pdf.getForm();
    const first = form.createTextField("buyer_name");
    first.addToPage(page, { x: 50, y: 700, width: 200, height: 20 });
    const second = form.createTextField("property_address");
    second.addToPage(page, { x: 50, y: 660, width: 300, height: 20 });

    const bytes = await pdf.save();
    const fields = await detectPdfFieldNames(bytes);
    expect(fields).toEqual(["buyer_name", "property_address"]);
  });
});
