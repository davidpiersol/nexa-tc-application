/** Slugs used in workflow events + routing (provider-neutral). */
export const SIGNING_PROVIDER_SLUG = {
  neutralManual: "neutral_manual",
  docusignApi: "docusign_api",
  adobeApi: "adobe_acrobat_sign_api",
  skyslopeDigiSignApi: "skyslope_digisign_api",
  dotloopApi: "dotloop_api",
  authentisignApi: "authentisign_api",
  skyslopeApi: "skyslope_api",
} as const;

export type SigningProviderSlug =
  (typeof SIGNING_PROVIDER_SLUG)[keyof typeof SIGNING_PROVIDER_SLUG];

export const SIGNING_DELIVERY_MODE = {
  emailLink: "email_link",
  embedded: "embedded",
  providerPortal: "provider_portal",
  manualExport: "manual_export",
} as const;

export type SigningDeliveryMode =
  (typeof SIGNING_DELIVERY_MODE)[keyof typeof SIGNING_DELIVERY_MODE];

export type SigningProviderSetupField = {
  key: string;
  label: string;
  secret?: boolean;
  help: string;
};

export type SigningProvider = {
  slug: SigningProviderSlug;
  label: string;
  shortLabel: string;
  aliases: string[];
  status: "implemented" | "scaffolded" | "manual";
  apiSummary: string;
  setupHelp: string;
  externalUrl: string | null;
  fields: SigningProviderSetupField[];
};

export const SIGNING_PROVIDERS: SigningProvider[] = [
  {
    slug: SIGNING_PROVIDER_SLUG.docusignApi,
    label: "DocuSign eSignature",
    shortLabel: "DocuSign",
    aliases: ["docusign", "docu sign", "docusign api", "docu"],
    status: "implemented",
    apiSummary: "API send and status sync are wired for sandbox/test credentials.",
    setupHelp:
      "Use a DocuSign developer/sandbox integration key, user ID, account ID, and RSA private key. Recipients receive the provider email link unless embedded signing is added later.",
    externalUrl: "https://developers.docusign.com/docs/esign-rest-api/",
    fields: [
      { key: "integrationKey", label: "Integration key", help: "DocuSign app integration key." },
      { key: "userId", label: "User ID", help: "DocuSign API user GUID." },
      { key: "accountId", label: "Account ID", help: "DocuSign account GUID." },
      {
        key: "rsaPrivateKeyPem",
        label: "RSA private key",
        secret: true,
        help: "Private key from the DocuSign app. It is encrypted and never displayed after save.",
      },
    ],
  },
  {
    slug: SIGNING_PROVIDER_SLUG.adobeApi,
    label: "Adobe Acrobat Sign",
    shortLabel: "Adobe Sign",
    aliases: ["adobe", "adobe sign", "acrobat sign", "adobe acrobat sign"],
    status: "scaffolded",
    apiSummary: "API send/status is planned; current workflow falls back to export/manual handoff.",
    setupHelp:
      "Capture the broker's Adobe Acrobat Sign account choice now. Connect OAuth/API credentials after Adobe integration is approved.",
    externalUrl: "https://developer.adobe.com/acrobat-sign/docs/overview/",
    fields: [
      { key: "accountEmail", label: "Account email", help: "Adobe Sign account owner email." },
      { key: "accessToken", label: "Access token", secret: true, help: "Future API token/OAuth credential." },
    ],
  },
  {
    slug: SIGNING_PROVIDER_SLUG.skyslopeDigiSignApi,
    label: "SkySlope DigiSign",
    shortLabel: "DigiSign",
    aliases: ["digisign", "sky slope digisign", "skyslope digisign", "sky slope digi sign"],
    status: "scaffolded",
    apiSummary: "SkySlope partner/API access must be confirmed before direct send/status sync.",
    setupHelp:
      "Use this when the broker signs through SkySlope DigiSign. Until API access is confirmed, Choral Point exports the packet and records provider status manually.",
    externalUrl: "https://skyslope.com/products-services/digisign/",
    fields: [
      { key: "accountEmail", label: "Account email", help: "SkySlope/DigiSign login email." },
      { key: "partnerToken", label: "Partner token", secret: true, help: "Future partner/API token if issued." },
    ],
  },
  {
    slug: SIGNING_PROVIDER_SLUG.dotloopApi,
    label: "Dotloop",
    shortLabel: "Dotloop",
    aliases: ["dotloop", "dot loop"],
    status: "scaffolded",
    apiSummary: "Public API/partner access is tracked; current workflow falls back to export/manual handoff.",
    setupHelp:
      "Use this when the broker's transaction files live in Dotloop. Direct loop/envelope automation needs approved API credentials.",
    externalUrl: "https://dotloop.github.io/public-api/",
    fields: [
      { key: "accountEmail", label: "Account email", help: "Dotloop account owner email." },
      { key: "accessToken", label: "Access token", secret: true, help: "Future Dotloop API credential." },
    ],
  },
  {
    slug: SIGNING_PROVIDER_SLUG.authentisignApi,
    label: "Lone Wolf Authentisign",
    shortLabel: "Authentisign",
    aliases: ["authentisign", "authenti sign", "lone wolf", "zipform", "zipform plus"],
    status: "scaffolded",
    apiSummary: "Real-estate e-sign provider; API access is likely partner/contract dependent.",
    setupHelp:
      "Use this when the broker signs through Authentisign or zipForm. Direct send/status sync waits on partner API access.",
    externalUrl: "https://www.lwolf.com/products/authentisign",
    fields: [
      { key: "accountEmail", label: "Account email", help: "Lone Wolf/AuthentiSign login email." },
      { key: "partnerToken", label: "Partner token", secret: true, help: "Future partner/API credential if issued." },
    ],
  },
  {
    slug: SIGNING_PROVIDER_SLUG.skyslopeApi,
    label: "SkySlope transaction workspace",
    shortLabel: "SkySlope",
    aliases: ["skyslope", "sky slope"],
    status: "scaffolded",
    apiSummary: "Transaction Management API is tracked; direct DigiSign flow may require separate partner access.",
    setupHelp:
      "Use this when the broker works primarily in SkySlope. Choral Point can export packets until API access is confirmed.",
    externalUrl: "https://skyslope.zendesk.com/hc/en-us/articles/36009561371035-SkySlope-Transaction-Management-APIs",
    fields: [
      { key: "accountEmail", label: "Account email", help: "SkySlope account owner email." },
      { key: "apiToken", label: "API token", secret: true, help: "Future SkySlope API credential if issued." },
    ],
  },
  {
    slug: SIGNING_PROVIDER_SLUG.neutralManual,
    label: "Manual / export packet",
    shortLabel: "Manual export",
    aliases: ["manual", "export", "none", "provider portal", "external"],
    status: "manual",
    apiSummary: "No API send. Choral Point exports a packet and records the provider handoff.",
    setupHelp:
      "Use this when the TC will upload the packet into another signing system or email it outside Choral Point.",
    externalUrl: null,
    fields: [],
  },
];

const PROVIDERS_BY_SLUG = new Map(SIGNING_PROVIDERS.map((provider) => [provider.slug, provider]));

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function getSigningProvider(slug: SigningProviderSlug): SigningProvider {
  return PROVIDERS_BY_SLUG.get(slug) ?? PROVIDERS_BY_SLUG.get(SIGNING_PROVIDER_SLUG.neutralManual)!;
}

export function isSigningProviderSlug(value: string | null | undefined): value is SigningProviderSlug {
  return Boolean(value && PROVIDERS_BY_SLUG.has(value as SigningProviderSlug));
}

/**
 * Normalize broker profile `signing_platform` free text to a routing bucket.
 */
export function resolveSigningWorkflowSlug(signingPlatformRaw: string | null | undefined): {
  slug: SigningProviderSlug;
  label: string;
} {
  const s = normalizeToken(signingPlatformRaw ?? "");
  for (const provider of SIGNING_PROVIDERS) {
    if (
      normalizeToken(provider.slug) === s ||
      provider.aliases.some((alias) => s === normalizeToken(alias) || s.startsWith(`${normalizeToken(alias)} `))
    ) {
      return { slug: provider.slug, label: provider.label };
    }
  }
  const manual = getSigningProvider(SIGNING_PROVIDER_SLUG.neutralManual);
  return { slug: manual.slug, label: manual.label };
}

export function normalizeSigningDeliveryMode(value: string | null | undefined): SigningDeliveryMode {
  const s = normalizeToken(value ?? "");
  if (s.includes("embedded")) return SIGNING_DELIVERY_MODE.embedded;
  if (s.includes("portal")) return SIGNING_DELIVERY_MODE.providerPortal;
  if (s.includes("manual") || s.includes("export")) return SIGNING_DELIVERY_MODE.manualExport;
  return SIGNING_DELIVERY_MODE.emailLink;
}

export type SigningEnvelopeStatus =
  | "draft"
  | "sent"
  | "delivered"
  | "completed"
  | "declined"
  | "voided"
  | "failed"
  | "manual"
  | "unknown";

export function normalizeEnvelopeStatus(value: string | null | undefined): SigningEnvelopeStatus {
  const s = normalizeToken(value ?? "");
  if (!s) return "unknown";
  if (s.includes("created") || s.includes("draft")) return "draft";
  if (s.includes("delivered") || s.includes("viewed")) return "delivered";
  if (s.includes("complete") || s.includes("signed")) return "completed";
  if (s.includes("declined")) return "declined";
  if (s.includes("void")) return "voided";
  if (s.includes("fail") || s.includes("error")) return "failed";
  if (s.includes("manual")) return "manual";
  if (s.includes("sent") || s.includes("in process") || s.includes("out for signature")) return "sent";
  return "unknown";
}

export function signingEnvelopeStatusLabel(status: SigningEnvelopeStatus): string {
  const labels: Record<SigningEnvelopeStatus, string> = {
    draft: "Draft",
    sent: "Sent",
    delivered: "Delivered/viewed",
    completed: "Completed",
    declined: "Declined",
    voided: "Voided",
    failed: "Failed",
    manual: "Manual handoff",
    unknown: "Unknown",
  };
  return labels[status];
}

export function redactSigningCredentials(input: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const k = key.toLowerCase();
    redacted[key] =
      k.includes("secret") || k.includes("token") || k.includes("key") || k.includes("password")
        ? "[stored]"
        : value;
  }
  return redacted;
}
