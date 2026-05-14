import { INTEGRATION_PROVIDERS, type IntegrationProvider } from "@/lib/integrations/credentials-store";

export type AiProviderKeyTestResult = {
  ok: boolean;
  provider: IntegrationProvider;
  message: string;
  checkedAt: string;
  status?: number;
  modelCount?: number;
};

type SavedAiCredential = {
  apiKey?: unknown;
};

type ProviderTestConfig = {
  url: string;
  headers: (apiKey: string) => HeadersInit;
  parseModelCount: (body: unknown) => number | undefined;
};

const PROVIDER_TESTS: Partial<Record<IntegrationProvider, ProviderTestConfig>> = {
  [INTEGRATION_PROVIDERS.aiOpenai]: {
    url: "https://api.openai.com/v1/models",
    headers: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    parseModelCount: countDataArray,
  },
  [INTEGRATION_PROVIDERS.aiAnthropic]: {
    url: "https://api.anthropic.com/v1/models",
    headers: (apiKey) => ({
      "anthropic-version": "2023-06-01",
      "x-api-key": apiKey,
    }),
    parseModelCount: countDataArray,
  },
  [INTEGRATION_PROVIDERS.aiGoogleGemini]: {
    url: "https://generativelanguage.googleapis.com/v1beta/models",
    headers: () => ({}),
    parseModelCount: countModelsArray,
  },
  [INTEGRATION_PROVIDERS.aiOpenrouter]: {
    url: "https://openrouter.ai/api/v1/models",
    headers: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    parseModelCount: countDataArray,
  },
  [INTEGRATION_PROVIDERS.aiGroq]: {
    url: "https://api.groq.com/openai/v1/models",
    headers: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    parseModelCount: countDataArray,
  },
  [INTEGRATION_PROVIDERS.aiXaiGrok]: {
    url: "https://api.x.ai/v1/models",
    headers: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    parseModelCount: countDataArray,
  },
};

function countDataArray(body: unknown): number | undefined {
  if (typeof body !== "object" || body === null || !("data" in body)) return undefined;
  const data = (body as { data?: unknown }).data;
  return Array.isArray(data) ? data.length : undefined;
}

function countModelsArray(body: unknown): number | undefined {
  if (typeof body !== "object" || body === null || !("models" in body)) return undefined;
  const models = (body as { models?: unknown }).models;
  return Array.isArray(models) ? models.length : undefined;
}

function keyFromCredential(credential: SavedAiCredential | null): string | null {
  return typeof credential?.apiKey === "string" && credential.apiKey.trim()
    ? credential.apiKey.trim()
    : null;
}

function urlWithKey(provider: IntegrationProvider, url: string, apiKey: string): string {
  if (provider !== INTEGRATION_PROVIDERS.aiGoogleGemini) return url;
  const parsed = new URL(url);
  parsed.searchParams.set("key", apiKey);
  return parsed.toString();
}

export async function testSavedAiProviderKey(
  provider: IntegrationProvider,
  credential: SavedAiCredential | null,
  fetchImpl: typeof fetch = fetch,
): Promise<AiProviderKeyTestResult> {
  const checkedAt = new Date().toISOString();
  const apiKey = keyFromCredential(credential);
  if (!apiKey) {
    return {
      ok: false,
      provider,
      checkedAt,
      message: "No saved API key was found for this provider.",
    };
  }

  const config = PROVIDER_TESTS[provider];
  if (!config) {
    return {
      ok: false,
      provider,
      checkedAt,
      message:
        "This provider needs a service-account or OAuth validator before it can be tested from the dashboard.",
    };
  }

  let response: Response;
  try {
    response = await fetchImpl(urlWithKey(provider, config.url, apiKey), {
      method: "GET",
      headers: config.headers(apiKey),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      provider,
      checkedAt,
      message: "The provider could not be reached. Check network access and try again.",
    };
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      provider,
      checkedAt,
      status: response.status,
      message:
        response.status === 401 || response.status === 403
          ? "The provider rejected the saved key."
          : `Provider validation failed with HTTP ${response.status}.`,
    };
  }

  const modelCount = config.parseModelCount(body);
  return {
    ok: true,
    provider,
    checkedAt,
    status: response.status,
    modelCount,
    message:
      typeof modelCount === "number"
        ? `Key validated. Provider returned ${modelCount} model${modelCount === 1 ? "" : "s"}.`
        : "Key validated. Provider accepted the request.",
  };
}
