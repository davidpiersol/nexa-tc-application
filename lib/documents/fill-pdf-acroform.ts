import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFForm,
  PDFRadioGroup,
  PDFTextField,
} from "pdf-lib";
import type { TemplateFieldMappings } from "@/lib/documents/template-field-mapping";
import {
  valueForCanonicalField,
  type TransactionFieldSnapshot,
} from "@/lib/documents/transaction-data-snapshot";

function applyText(field: PDFTextField, value: string) {
  field.setText(value);
}

function applyCheckbox(field: PDFCheckBox, value: string) {
  const v = value.trim().toLowerCase();
  const on =
    v === "yes" ||
    v === "true" ||
    v === "1" ||
    v === "on" ||
    v === "x" ||
    v === "checked";
  if (on) field.check();
  else field.uncheck();
}

function applyDropdown(field: PDFDropdown, value: string) {
  const opts = field.getOptions();
  const exact = opts.find((o) => o === value);
  if (exact) {
    field.select(exact);
    return;
  }
  const ci = opts.find((o) => o.localeCompare(value, undefined, { sensitivity: "accent" }) === 0);
  if (ci) {
    field.select(ci);
    return;
  }
}

function applyRadioGroup(field: PDFRadioGroup, value: string) {
  const opts = field.getOptions();
  const exact = opts.find((o) => o === value);
  if (exact) {
    field.select(exact);
    return;
  }
  const ci = opts.find(
    (o) => o.toLowerCase() === value.trim().toLowerCase(),
  );
  if (ci) field.select(ci);
}

function setFieldForMapping(
  form: PDFForm,
  pdfFieldName: string,
  displayValue: string,
): void {
  let field;
  try {
    field = form.getField(pdfFieldName);
  } catch {
    return;
  }

  if (field instanceof PDFTextField) {
    applyText(field, displayValue);
    return;
  }
  if (field instanceof PDFCheckBox) {
    applyCheckbox(field, displayValue);
    return;
  }
  if (field instanceof PDFDropdown) {
    applyDropdown(field, displayValue);
    return;
  }
  if (field instanceof PDFRadioGroup) {
    applyRadioGroup(field, displayValue);
  }
}

/**
 * Fills AcroForm fields using template PDF field names → canonical mappings and a transaction snapshot.
 */
export async function fillPdfFromMappedFields(input: {
  templatePdfBytes: Uint8Array;
  fieldMappings: TemplateFieldMappings;
  snapshot: TransactionFieldSnapshot;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.load(input.templatePdfBytes, {
    ignoreEncryption: true,
  });
  const form = doc.getForm();

  for (const [pdfFieldName, canonicalField] of Object.entries(input.fieldMappings)) {
    const key = pdfFieldName.trim();
    const canonical = canonicalField.trim();
    if (!key || !canonical) continue;
    const displayValue = valueForCanonicalField(input.snapshot, canonical);
    setFieldForMapping(form, key, displayValue);
  }

  const pdfBytes = await doc.save();
  return pdfBytes;
}
