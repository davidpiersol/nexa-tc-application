const SAFE_FILENAME_RE = /[^a-zA-Z0-9._-]+/g;

/** Mirrors `global_document_template_versions_pdf_path_check` — single-segment `.pdf` filename, no slashes. */
const GLOBAL_TEMPLATE_STORAGE_RE =
  /^templates\/global\/([0-9a-fA-F-]{36})\/([0-9a-fA-F-]{36})\/[^/]+[.]pdf$/;

export function sanitizeTemplateFileName(fileName: string): string {
  const trimmed = fileName.trim() || "template.pdf";
  const replaced = trimmed.replace(SAFE_FILENAME_RE, "_");
  const condensed = replaced.replace(/_+/g, "_").slice(0, 120);
  const lower = condensed.toLowerCase();
  if (lower.endsWith(".pdf")) return condensed || "template.pdf";
  return `${condensed || "template"}.pdf`;
}

export function buildGlobalTemplateStoragePath(args: {
  templateId: string;
  versionId: string;
  sourceFileName: string;
}): string {
  const safeFilename = sanitizeTemplateFileName(args.sourceFileName);
  return `templates/global/${args.templateId}/${args.versionId}/${safeFilename}`;
}

export function parseGlobalTemplateStoragePath(path: string): {
  templateId: string;
  versionId: string;
} | null {
  const m = path.trim().match(GLOBAL_TEMPLATE_STORAGE_RE);
  if (!m) return null;
  return { templateId: m[1], versionId: m[2] };
}

/**
 * Validates that a persisted template version path targets the expected template and version ids
 * before service-role downloads (prevents traversal or mismatched blobs).
 */
export function isExpectedGlobalTemplateVersionPath(args: {
  storagePath: string;
  templateId: string;
  versionId: string;
}): boolean {
  const parsed = parseGlobalTemplateStoragePath(args.storagePath);
  if (!parsed) return false;
  return (
    parsed.templateId === args.templateId &&
    parsed.versionId === args.versionId
  );
}
