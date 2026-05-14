import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { AI_PROVIDER_CATALOG } from "@/lib/ai/catalog";
import { testSavedAiProviderKey } from "@/lib/ai/provider-key-test";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import {
  INTEGRATION_PROVIDERS,
  type IntegrationProvider,
} from "@/lib/integrations/credentials-store";
import { getGlobalCredentials } from "@/lib/integrations/global-credentials-store";
import { validateCsrf } from "@/lib/security/csrf-server";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";

const credentialProviders = new Set(
  AI_PROVIDER_CATALOG.flatMap((provider) =>
    provider.credentialProvider ? [provider.credentialProvider] : [],
  ),
);
const integrationProviders = new Set<string>(Object.values(INTEGRATION_PROVIDERS));

const testSchema = z.object({
  credentialProvider: z.string().min(2).max(80),
});

function isSupportedCredentialProvider(value: string): value is IntegrationProvider {
  return credentialProviders.has(value) && integrationProviders.has(value);
}

export async function POST(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const { error } = await requireGlobalAdmin();
  if (error) return error;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = testSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });
  if (!isSupportedCredentialProvider(parsed.data.credentialProvider)) {
    return NextResponse.json({ error: "unsupported_provider" }, { status: 400 });
  }

  const credential = await getGlobalCredentials<{ apiKey?: string }>(
    parsed.data.credentialProvider,
  );
  const result = await testSavedAiProviderKey(parsed.data.credentialProvider, credential);

  return NextResponse.json({ ok: result.ok, result }, { status: result.ok ? 200 : 400 });
}
