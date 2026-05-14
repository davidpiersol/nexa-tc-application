export const CRM_PROVIDER_KEYS = [
  "manual",
  "deltanet",
  "lofty",
  "follow_up_boss",
  "moxiworks",
] as const;

export type CrmProviderKey = (typeof CRM_PROVIDER_KEYS)[number];
export type CrmSyncStatus = "disabled" | "investigate" | "available_when_approved";

export type CrmProviderCatalogItem = {
  key: CrmProviderKey;
  label: string;
  status: CrmSyncStatus;
  authModes: Array<"none" | "oauth" | "api_key" | "partner_access" | "import_export">;
  summary: string;
  guardrail: string;
};

export const CRM_PROVIDER_CATALOG: CrmProviderCatalogItem[] = [
  {
    key: "manual",
    label: "Choral Point CRM-lite",
    status: "disabled",
    authModes: ["none"],
    summary:
      "Internal CRM-lite features built on contacts, SOI categories, lead temperature, notes, reminders, and transaction relationships.",
    guardrail: "No external sync. Contacts remain canonical inside Choral Point.",
  },
  {
    key: "deltanet",
    label: "DeltaNET / Delta Media Group",
    status: "investigate",
    authModes: ["partner_access", "import_export"],
    summary:
      "First broker-context candidate because initial brokers use Coldwell Banker tooling that includes Delta. Public API availability is unconfirmed.",
    guardrail:
      "Treat as vendor/support investigation or import/export only until official API access and field rules are provided.",
  },
  {
    key: "lofty",
    label: "Lofty",
    status: "available_when_approved",
    authModes: ["oauth", "api_key"],
    summary:
      "Viable external CRM candidate with Open API/OAuth/API-key paths, subject to broker approval, rate limits, and field mapping.",
    guardrail: "Do not sync until credentials, consent, rate limits, and mapping are approved.",
  },
  {
    key: "follow_up_boss",
    label: "Follow Up Boss",
    status: "available_when_approved",
    authModes: ["api_key"],
    summary:
      "Viable external CRM candidate with REST API support, subject to broker credentials and API terms.",
    guardrail: "Do not sync without explicit broker consent and approved duplicate/contact matching rules.",
  },
  {
    key: "moxiworks",
    label: "MoxiWorks",
    status: "available_when_approved",
    authModes: ["partner_access", "oauth"],
    summary:
      "Viable external CRM candidate through MoxiCloud documentation and partner access, subject to platform approval.",
    guardrail: "Treat as partner-gated until MoxiCloud access, scopes, and sync terms are confirmed.",
  },
];

export const CRM_LITE_BOUNDARIES = [
  "contacts",
  "SOI categories and segmentation",
  "lead temperature",
  "touch history",
  "follow-up tasks",
  "broker/client relationships",
  "notes",
  "reminders",
  "import/export",
] as const;

export type CrmLiteBoundary = (typeof CRM_LITE_BOUNDARIES)[number];

export type CrmAdapterOperation = "pull_contacts" | "push_contact" | "push_task" | "record_touch";

export type CrmAdapterCapability = {
  providerKey: CrmProviderKey;
  operation: CrmAdapterOperation;
  enabled: boolean;
  reason: string;
};

export function crmProviderLabel(key: CrmProviderKey): string {
  return CRM_PROVIDER_CATALOG.find((provider) => provider.key === key)?.label ?? key;
}

export function crmProviderCanBeEnabledWhenApproved(provider: CrmProviderKey): boolean {
  return provider !== "manual" && CRM_PROVIDER_CATALOG.find((item) => item.key === provider)?.status === "available_when_approved";
}

export function defaultCrmAdapterCapabilities(provider: CrmProviderKey): CrmAdapterCapability[] {
  const canBeEnabledWhenApproved = crmProviderCanBeEnabledWhenApproved(provider);
  const blockedReason =
    provider === "deltanet"
      ? "DeltaNET API access is unconfirmed; use vendor investigation or import/export only."
      : "External CRM sync is disabled until credentials, consent, and mapping are approved.";

  return (["pull_contacts", "push_contact", "push_task", "record_touch"] as const).map((operation) => ({
    providerKey: provider,
    operation,
    enabled: false,
    reason: canBeEnabledWhenApproved ? blockedReason : blockedReason,
  }));
}
