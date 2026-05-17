import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { AI_PROVIDER_CATALOG } from "@/lib/ai/catalog";
import { requireGlobalAdmin } from "@/lib/auth/admin-guard";
import {
  listGlobalCredentialStatuses,
  upsertGlobalCredentials,
} from "@/lib/integrations/global-credentials-store";
import {
  INTEGRATION_PROVIDERS,
  type IntegrationProvider,
} from "@/lib/integrations/credentials-store";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { validateCsrf } from "@/lib/security/csrf-server";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";

const credentialProviders = new Set(
  AI_PROVIDER_CATALOG.flatMap((provider) =>
    provider.credentialProvider ? [provider.credentialProvider] : [],
  ),
);
const integrationProviders = new Set<string>(Object.values(INTEGRATION_PROVIDERS));

function isSupportedCredentialProvider(value: string): value is IntegrationProvider {
  return credentialProviders.has(value) && integrationProviders.has(value);
}

const upsertSchema = z.object({
  credentialProvider: z.string().min(2).max(80),
  apiKey: z.string().min(8).max(10_000),
  defaultModel: z.string().trim().min(1).max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function GET(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;

  const { error } = await requireGlobalAdmin();
  if (error) return error;

  const statuses = await listGlobalCredentialStatuses();
  return NextResponse.json({ items: statuses });
}

export async function PUT(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const { actor, error } = await requireGlobalAdmin();
  if (error) return error;
  const current = actor!;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = upsertSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });
  if (!isSupportedCredentialProvider(parsed.data.credentialProvider)) {
    return NextResponse.json({ error: "unsupported_provider" }, { status: 400 });
  }

  const settings = {
    defaultModel: parsed.data.defaultModel ?? null,
    notes: parsed.data.notes ?? null,
    configuredFrom: "global_admin_dashboard",
  };

  await upsertGlobalCredentials(
    parsed.data.credentialProvider,
    { apiKey: parsed.data.apiKey },
    current.userId,
    settings,
  );

  const admin = createServiceRoleClient();
  await admin.from("audit_log").insert({
    tenant_id: current.tenantId,
    table_name: "global_provider_credentials",
    record_id: null,
    operation: "UPDATE",
    old_data: null,
    new_data: {
      source: "api",
      operation: "global_ai_credential_upsert",
      detail: {
        actor_user_id: current.userId,
        credential_provider: parsed.data.credentialProvider,
        has_default_model: Boolean(parsed.data.defaultModel),
      },
    },
    actor_id: current.userId,
  });

  return NextResponse.json({
    ok: true,
    item: {
      provider: parsed.data.credentialProvider,
      configured: true,
      settings,
    },
  });
}
