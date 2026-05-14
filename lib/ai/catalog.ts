export const AI_PROVIDER_KEYS = [
  "disabled",
  "openai",
  "anthropic",
  "google_gemini",
  "google_vertex",
  "openrouter",
  "groq",
  "xai_grok",
] as const;

export type AiProviderKey = (typeof AI_PROVIDER_KEYS)[number];

export const AI_FEATURE_KEYS = [
  "intake_assist",
  "property_legal_description_assist",
  "smart_search",
  "template_mapping_suggestions",
  "package_review",
  "missing_data_explanation",
  "activity_summary",
  "task_suggestions",
  "communication_drafts",
  "help_copilot",
] as const;

export type AiFeatureKey = (typeof AI_FEATURE_KEYS)[number];

export type AiCostTier = "low" | "medium" | "high";

export type AiProviderCatalogItem = {
  key: AiProviderKey;
  label: string;
  credentialProvider: string | null;
  authMode: "none" | "api_key" | "oauth" | "service_account" | "gateway_key";
  notes: string;
};

export type AiFeatureCatalogItem = {
  key: AiFeatureKey;
  label: string;
  defaultCostTier: AiCostTier;
  defaultProvider: AiProviderKey;
  defaultModel: string;
  maxOutputTokens: number;
  requiresHumanReview: true;
  safetyBoundary: string;
};

export type AiFeatureSetting = {
  featureKey: AiFeatureKey;
  enabled: boolean;
  providerKey: AiProviderKey;
  modelKey: string;
  maxOutputTokens: number;
  monthlyBudgetCents: number;
  requireExpensiveModelConfirmation: boolean;
};

export type AiUsageEstimateInput = {
  inputTokens: number;
  outputTokens: number;
  inputPerMillionCents?: number;
  outputPerMillionCents?: number;
};

export const AI_PROVIDER_CATALOG: AiProviderCatalogItem[] = [
  {
    key: "disabled",
    label: "No AI",
    credentialProvider: null,
    authMode: "none",
    notes: "Core workflows must continue without an AI provider.",
  },
  {
    key: "openai",
    label: "OpenAI",
    credentialProvider: "ai_openai",
    authMode: "api_key",
    notes: "Direct OpenAI API provider for assistive drafting, mapping, summaries, and search help.",
  },
  {
    key: "anthropic",
    label: "Anthropic",
    credentialProvider: "ai_anthropic",
    authMode: "api_key",
    notes: "Direct Anthropic Claude provider. Must not be the only hard-coded AI path.",
  },
  {
    key: "google_gemini",
    label: "Google Gemini Developer API",
    credentialProvider: "ai_google_gemini",
    authMode: "api_key",
    notes: "Direct Gemini API path for tenants using Google AI Studio credentials.",
  },
  {
    key: "google_vertex",
    label: "Google Vertex AI",
    credentialProvider: "ai_google_vertex",
    authMode: "service_account",
    notes: "Enterprise Google Cloud path where tenant/project and service account controls matter.",
  },
  {
    key: "openrouter",
    label: "OpenRouter-compatible gateway",
    credentialProvider: "ai_openrouter",
    authMode: "gateway_key",
    notes: "Gateway option for routing to many models behind one OpenAI-compatible API shape.",
  },
  {
    key: "groq",
    label: "Groq",
    credentialProvider: "ai_groq",
    authMode: "api_key",
    notes: "Fast inference provider added to the catalog for lower-latency assistive workflows.",
  },
  {
    key: "xai_grok",
    label: "xAI Grok",
    credentialProvider: "ai_xai_grok",
    authMode: "api_key",
    notes: "xAI Grok provider for current testing with a user-supplied key stored outside source control.",
  },
];

export const AI_FEATURE_CATALOG: AiFeatureCatalogItem[] = [
  {
    key: "intake_assist",
    label: "Intake assist",
    defaultCostTier: "medium",
    defaultProvider: "xai_grok",
    defaultModel: "grok-fast-general",
    maxOutputTokens: 1200,
    requiresHumanReview: true,
    safetyBoundary: "Suggest intake values only; never change transaction data automatically.",
  },
  {
    key: "property_legal_description_assist",
    label: "Property/legal description assist",
    defaultCostTier: "medium",
    defaultProvider: "xai_grok",
    defaultModel: "grok-reasoning-general",
    maxOutputTokens: 1400,
    requiresHumanReview: true,
    safetyBoundary: "Summarize or extract pasted/source property text; human confirms legal fields.",
  },
  {
    key: "smart_search",
    label: "Smart search",
    defaultCostTier: "low",
    defaultProvider: "groq",
    defaultModel: "fast-search-helper",
    maxOutputTokens: 800,
    requiresHumanReview: true,
    safetyBoundary: "Return ranked suggestions only; do not modify records.",
  },
  {
    key: "template_mapping_suggestions",
    label: "Template mapping suggestions",
    defaultCostTier: "high",
    defaultProvider: "xai_grok",
    defaultModel: "grok-strong-mapping",
    maxOutputTokens: 2000,
    requiresHumanReview: true,
    safetyBoundary: "Create draft mappings only; admin approval is required before applying.",
  },
  {
    key: "package_review",
    label: "Package completeness review",
    defaultCostTier: "medium",
    defaultProvider: "xai_grok",
    defaultModel: "grok-strong-review",
    maxOutputTokens: 1600,
    requiresHumanReview: true,
    safetyBoundary: "Flag possible package gaps only; TC decides whether the packet is complete.",
  },
  {
    key: "missing_data_explanation",
    label: "Missing-data explanation",
    defaultCostTier: "low",
    defaultProvider: "groq",
    defaultModel: "fast-general",
    maxOutputTokens: 700,
    requiresHumanReview: true,
    safetyBoundary: "Explain missing fields and likely sources; do not fabricate values.",
  },
  {
    key: "activity_summary",
    label: "Activity summary",
    defaultCostTier: "low",
    defaultProvider: "groq",
    defaultModel: "fast-summary",
    maxOutputTokens: 900,
    requiresHumanReview: true,
    safetyBoundary: "Summarize existing events with AI pass / Human pass source labels.",
  },
  {
    key: "task_suggestions",
    label: "Task/reminder suggestions",
    defaultCostTier: "low",
    defaultProvider: "groq",
    defaultModel: "fast-general",
    maxOutputTokens: 800,
    requiresHumanReview: true,
    safetyBoundary: "Suggest tasks only; never assign, complete, or notify automatically.",
  },
  {
    key: "communication_drafts",
    label: "Broker/client message drafts",
    defaultCostTier: "medium",
    defaultProvider: "xai_grok",
    defaultModel: "grok-polished-writing",
    maxOutputTokens: 1200,
    requiresHumanReview: true,
    safetyBoundary: "Draft messages only; never send email, Slack, SMS, or signature requests.",
  },
  {
    key: "help_copilot",
    label: "Help/copilot",
    defaultCostTier: "low",
    defaultProvider: "groq",
    defaultModel: "fast-general",
    maxOutputTokens: 900,
    requiresHumanReview: true,
    safetyBoundary: "Answer workflow help questions; avoid legal advice.",
  },
];

export function isAiProviderKey(value: string | null | undefined): value is AiProviderKey {
  return AI_PROVIDER_KEYS.includes(value as AiProviderKey);
}

export function isAiFeatureKey(value: string | null | undefined): value is AiFeatureKey {
  return AI_FEATURE_KEYS.includes(value as AiFeatureKey);
}

export function defaultAiFeatureSettings(): AiFeatureSetting[] {
  return AI_FEATURE_CATALOG.map((feature) => ({
    featureKey: feature.key,
    enabled: true,
    providerKey: feature.defaultProvider,
    modelKey: feature.defaultModel,
    maxOutputTokens: feature.maxOutputTokens,
    monthlyBudgetCents: 5_000,
    requireExpensiveModelConfirmation: feature.defaultCostTier === "high",
  }));
}

export function estimateAiUsageCostCents(input: AiUsageEstimateInput): number | null {
  if (input.inputPerMillionCents == null || input.outputPerMillionCents == null) return null;
  const safeInput = Math.max(0, Math.round(input.inputTokens));
  const safeOutput = Math.max(0, Math.round(input.outputTokens));
  return Math.ceil(
    (safeInput / 1_000_000) * input.inputPerMillionCents +
      (safeOutput / 1_000_000) * input.outputPerMillionCents,
  );
}
