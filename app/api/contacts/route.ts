import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { loadActorContext } from "@/lib/auth/actor-context";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  CONTACT_CATEGORIES,
  normalizeContactCategories,
} from "@/lib/contacts/categories";
import {
  canAccessContacts,
  canManageBrokerCredentials,
  canWriteContacts,
} from "@/lib/contacts/permissions";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { wrapEncryptedCredentials } from "@/lib/integrations/credentials-store";
import {
  normalizeSigningDeliveryMode,
  resolveSigningWorkflowSlug,
} from "@/lib/signing/signing-workflow";

type BrokerProfileRow = {
  id: string;
  contact_id: string;
  signing_platform: string | null;
  signing_preferences: unknown;
  settings: Record<string, unknown> | null;
};

const createContactSchema = z.object({
  salutation: z.string().trim().max(32).optional().or(z.literal("")),
  firstName: z.string().trim().min(1).max(80),
  middleName: z.string().trim().max(80).optional().or(z.literal("")),
  lastName: z.string().trim().min(1).max(80),
  suffix: z.string().trim().max(32).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  addressLine1: z.string().trim().max(160).optional().or(z.literal("")),
  addressLine2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  state: z.string().trim().max(60).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  otherCategoryDescription: z.string().trim().max(200).optional().or(z.literal("")),
  categories: z.array(z.enum(CONTACT_CATEGORIES)).default([]),
  brokerProfile: z
    .object({
      brokerage: z.string().trim().max(120).optional().or(z.literal("")),
      signingPlatform: z.string().trim().max(80).optional().or(z.literal("")),
      signingPreference: z.string().trim().max(80).optional().or(z.literal("")),
      settings: z.record(z.string(), z.unknown()).optional(),
      credentialProvider: z.string().trim().max(80).optional().or(z.literal("")),
      credentials: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

function fullNameFromParts(firstName: string, middleName: string, lastName: string): string {
  return [firstName.trim(), middleName.trim(), lastName.trim()]
    .filter((part) => part.length > 0)
    .join(" ");
}

function signingPreferenceMode(signingPreferences: unknown): string | null {
  if (
    typeof signingPreferences === "object" &&
    signingPreferences &&
    "mode" in signingPreferences
  ) {
    const mode = (signingPreferences as { mode?: unknown }).mode;
    return typeof mode === "string" && mode.trim().length > 0 ? mode : null;
  }
  return null;
}

function normalizeSigningPreferencePayload(platform: string | undefined, preference: string | undefined) {
  const providerSlug = resolveSigningWorkflowSlug(platform).slug;
  const mode = normalizeSigningDeliveryMode(preference);
  return {
    signingPlatform: providerSlug,
    signingPreferences: { providerSlug, mode },
  };
}

export async function GET(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;

  const actor = await loadActorContext();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canAccessContacts(actor.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const brokerOnly = request.nextUrl.searchParams.get("brokers") === "1";
  const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";

  const admin = createServiceRoleClient();
  let contactQuery = admin
    .from("contacts")
    .select(
      "id, tenant_id, salutation, first_name, middle_name, last_name, suffix, full_name, email, phone, company, address_line_1, address_line_2, city, state, postal_code, country, notes, other_category_description, created_at, updated_at",
    )
    .eq("tenant_id", actor.tenantId)
    .order("full_name", { ascending: true });

  if (q.length > 0) {
    contactQuery = contactQuery.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%`,
    );
  }

  const { data: contacts, error: contactErr } = await contactQuery;
  if (contactErr) return NextResponse.json({ error: contactErr.message }, { status: 500 });
  const rows = contacts ?? [];
  if (rows.length === 0) return NextResponse.json({ contacts: [] });

  const ids = rows.map((row) => row.id);
  const [{ data: categoryRows }, { data: profileRows }, { data: credentialRows }] = await Promise.all([
    admin
      .from("contact_category_assignments")
      .select("contact_id, category")
      .eq("tenant_id", actor.tenantId)
      .in("contact_id", ids),
    admin
      .from("broker_profiles")
      .select("id, contact_id, signing_platform, signing_preferences, settings")
      .eq("tenant_id", actor.tenantId)
      .in("contact_id", ids),
    admin
      .from("broker_profile_credentials")
      .select("broker_profile_id")
      .eq("tenant_id", actor.tenantId),
  ]);

  const categoriesByContact = new Map<string, string[]>();
  for (const row of categoryRows ?? []) {
    const current = categoriesByContact.get(row.contact_id) ?? [];
    current.push(row.category);
    categoriesByContact.set(row.contact_id, current);
  }

  const profileByContact = new Map<string, BrokerProfileRow>();
  for (const row of (profileRows ?? []) as BrokerProfileRow[]) {
    profileByContact.set(row.contact_id, row);
  }
  const credentialProfileIds = new Set((credentialRows ?? []).map((row) => row.broker_profile_id));

  const enriched = rows.map((row) => {
    const profile = profileByContact.get(row.id);
    const categories = categoriesByContact.get(row.id) ?? [];
    return {
      ...row,
      categories,
      brokerProfile: profile
        ? {
            id: profile.id,
            signingPlatform: profile.signing_platform,
            signingPreference: signingPreferenceMode(profile.signing_preferences),
            settings: profile.settings ?? {},
            hasCredentials: credentialProfileIds.has(profile.id),
          }
        : null,
    };
  });

  return NextResponse.json({
    contacts: brokerOnly
      ? enriched.filter((row) => row.categories.includes("broker"))
      : enriched,
  });
}

export async function POST(request: NextRequest) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const actor = await loadActorContext();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canWriteContacts(actor.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createContactSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });
  const body = parsed.data;

  const admin = createServiceRoleClient();
  const { data: contact, error: insertErr } = await admin
    .from("contacts")
    .insert({
      tenant_id: actor.tenantId,
      salutation: body.salutation?.trim() || null,
      first_name: body.firstName.trim(),
      middle_name: body.middleName?.trim() || null,
      last_name: body.lastName.trim(),
      suffix: body.suffix?.trim() || null,
      full_name: fullNameFromParts(body.firstName, body.middleName ?? "", body.lastName),
      email: body.email?.trim().toLowerCase() || null,
      phone: body.phone?.trim() || null,
      company: body.company?.trim() || null,
      address_line_1: body.addressLine1?.trim() || null,
      address_line_2: body.addressLine2?.trim() || null,
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      postal_code: body.postalCode?.trim() || null,
      country: body.country?.trim() || null,
      notes: body.notes?.trim() || null,
      other_category_description: body.otherCategoryDescription?.trim() || null,
      created_by: actor.userId,
      updated_by: actor.userId,
    })
    .select("id")
    .single();
  if (insertErr || !contact) {
    return NextResponse.json({ error: insertErr?.message ?? "insert_failed" }, { status: 400 });
  }

  const categories = normalizeContactCategories(body.categories);
  if (categories.length > 0) {
    const { error: categoriesErr } = await admin.from("contact_category_assignments").insert(
      categories.map((category) => ({
        contact_id: contact.id,
        tenant_id: actor.tenantId,
        category,
      })),
    );
    if (categoriesErr) return NextResponse.json({ error: categoriesErr.message }, { status: 400 });
  }

  if (body.brokerProfile && categories.includes("broker")) {
    const brokerage = body.brokerProfile.brokerage?.trim();
    const signing = normalizeSigningPreferencePayload(
      body.brokerProfile.signingPlatform,
      body.brokerProfile.signingPreference,
    );
    const { data: profile, error: profileErr } = await admin
      .from("broker_profiles")
      .insert({
        tenant_id: actor.tenantId,
        contact_id: contact.id,
        signing_platform: signing.signingPlatform,
        signing_preferences: signing.signingPreferences,
        settings: {
          ...(body.brokerProfile.settings ?? {}),
          ...(brokerage ? { brokerage } : {}),
        },
        created_by: actor.userId,
        updated_by: actor.userId,
      })
      .select("id")
      .single();
    if (profileErr || !profile) {
      return NextResponse.json(
        { error: profileErr?.message ?? "broker_profile_insert_failed" },
        { status: 400 },
      );
    }

    if (
      body.brokerProfile.credentialProvider &&
      body.brokerProfile.credentials &&
      Object.keys(body.brokerProfile.credentials).length > 0
    ) {
      if (!canManageBrokerCredentials(actor.role)) {
        return NextResponse.json({ error: "forbidden_credentials" }, { status: 403 });
      }
      const { error: credentialErr } = await admin.from("broker_profile_credentials").upsert(
        {
          broker_profile_id: profile.id,
          tenant_id: actor.tenantId,
          provider: body.brokerProfile.credentialProvider.trim().toLowerCase(),
          credentials_json: wrapEncryptedCredentials(
            body.brokerProfile.credentials,
          ) as unknown as Record<string, unknown>,
          updated_by: actor.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "broker_profile_id" },
      );
      if (credentialErr) return NextResponse.json({ error: credentialErr.message }, { status: 400 });
    }
  }

  await admin.from("audit_log").insert({
    tenant_id: actor.tenantId,
    table_name: "contacts",
    record_id: contact.id,
    operation: "INSERT",
    old_data: null,
    new_data: { source: "api", operation: "contacts.create" },
    actor_id: actor.userId,
  });

  return NextResponse.json({ ok: true, contactId: contact.id });
}
