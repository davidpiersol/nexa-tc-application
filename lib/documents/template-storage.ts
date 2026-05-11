const SAFE_FILENAME_RE = /[^a-zA-Z0-9._-]+/g;

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
