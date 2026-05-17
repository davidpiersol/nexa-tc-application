/**
 * Upper bound on template/source PDF bytes loaded into pdf-lib during generation (DoS mitigation).
 * Override with env only for local diagnostics.
 */
export const DEFAULT_MAX_GENERATION_TEMPLATE_BYTES = 15 * 1024 * 1024;

export function maxGenerationTemplateBytes(): number {
  const raw = process.env.NEXA_MAX_GENERATION_TEMPLATE_MB?.trim();
  if (!raw) return DEFAULT_MAX_GENERATION_TEMPLATE_BYTES;
  const mb = Number(raw);
  if (!Number.isFinite(mb) || mb <= 0 || mb > 100) {
    return DEFAULT_MAX_GENERATION_TEMPLATE_BYTES;
  }
  return Math.floor(mb * 1024 * 1024);
}
