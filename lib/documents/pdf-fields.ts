import { PDFDocument } from "pdf-lib";

export async function detectPdfFieldNames(
  bytes: Uint8Array,
): Promise<string[]> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = doc.getForm();
  const names = form
    .getFields()
    .map((field) => field.getName().trim())
    .filter((name) => name.length > 0);
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
}
