/** Slugs used in workflow events + routing (provider-neutral). */
export const SIGNING_PROVIDER_SLUG = {
  neutralManual: "neutral_manual",
  docusignApi: "docusign_api",
} as const;

export type SigningProviderSlug =
  (typeof SIGNING_PROVIDER_SLUG)[keyof typeof SIGNING_PROVIDER_SLUG];

/**
 * Normalize broker profile `signing_platform` free text to a routing bucket.
 */
export function resolveSigningWorkflowSlug(signingPlatformRaw: string | null | undefined): {
  slug: SigningProviderSlug;
  label: string;
} {
  const s = (signingPlatformRaw ?? "").trim().toLowerCase();
  if (s === "docusign" || s.startsWith("docu")) {
    return { slug: SIGNING_PROVIDER_SLUG.docusignApi, label: "DocuSign API" };
  }
  return {
    slug: SIGNING_PROVIDER_SLUG.neutralManual,
    label: "Manual / provider UI",
  };
}
