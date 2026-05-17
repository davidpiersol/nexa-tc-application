import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { loadActorContext } from "@/lib/auth/actor-context";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { CONTACT_CATEGORIES, normalizeContactCategories } from "@/lib/contacts/categories";
import { canAccessContacts, canManageBrokerCredentials, canWriteContacts } from "@/lib/contacts/permissions";
import { enforceApiRateLimit } from "@/lib/security/enforce-rate-limit";
import { validateCsrf } from "@/lib/security/csrf-server";
import { wrapEncryptedCredentials } from "@/lib/integrations/credentials-store";
import {
  normalizeSigningDeliveryMode,
  resolveSigningWorkflowSlug,
} from "@/lib/signing/signing-workflow";

type Ctx = { params: { id: string } };

const patchSchema = z.object({
  salutation: z.string().trim().max(32).optional().or(z.literal("")),
  firstName: z.string().trim().min(1).max(80).optional(),
  middleName: z.string().trim().max(80).optional().or(z.literal("")),
  lastName: z.string().trim().min(1).max(80).optional(),
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
  categories: z.array(z.enum(CONTACT_CATEGORIES)).optional(),
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

async function loadContactOr404(tenantId: string, contactId: string) {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("contacts")
    .select(
      "id, tenant_id, salutation, first_name, middle_name, last_name, suffix, full_name, email, phone, company, address_line_1, address_line_2, city, state, postal_code, country, notes, other_category_description",
    )
    .eq("id", contactId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) return { error: NextResponse.json({ error: error.message }, { status: 500 }), data: null };
  if (!data) return { error: NextResponse.json({ error: "not_found" }, { status: 404 }), data: null };
  return { error: null, data };
}

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

export async function GET(request: NextRequest, ctx: Ctx) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;

  const actor = await loadActorContext();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canAccessContacts(actor.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const loaded = await loadContactOr404(actor.tenantId, ctx.params.id);
  if (loaded.error) return loaded.error;
  const contact = loaded.data!;
  const admin = createServiceRoleClient();

  const [{ data: categories }, { data: profile }, { data: credentials }] = await Promise.all([
    admin
      .from("contact_category_assignments")
      .select("category")
      .eq("tenant_id", actor.tenantId)
      .eq("contact_id", contact.id),
    admin
      .from("broker_profiles")
      .select("id, signing_platform, signing_preferences, settings")
      .eq("tenant_id", actor.tenantId)
      .eq("contact_id", contact.id)
      .maybeSingle(),
    admin
      .from("broker_profile_credentials")
      .select("broker_profile_id, provider")
      .eq("tenant_id", actor.tenantId),
  ]);

  const hasCredentials = profile
    ? (credentials ?? []).some((row) => row.broker_profile_id === profile.id)
    : false;

  return NextResponse.json({
    contact: {
      ...contact,
      categories: (categories ?? []).map((row) => row.category),
      brokerProfile: profile
        ? {
            id: profile.id,
            brokerage:
              typeof profile.settings === "object" &&
              profile.settings &&
              "brokerage" in profile.settings
                ? String((profile.settings as { brokerage?: string }).brokerage ?? "")
                : "",
            signingPlatform: profile.signing_platform,
            signingPreference: signingPreferenceMode(profile.signing_preferences),
            settings: profile.settings ?? {},
            hasCredentials,
          }
        : null,
    },
    canManageCredentials: canManageBrokerCredentials(actor.role),
  });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const actor = await loadActorContext();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canWriteContacts(actor.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const loaded = await loadContactOr404(actor.tenantId, ctx.params.id);
  if (loaded.error) return loaded.error;
  const contact = loaded.data!;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 });
  const body = parsed.data;
  const admin = createServiceRoleClient();

  const updateContact: Record<string, unknown> = {
    updated_by: actor.userId,
    updated_at: new Date().toISOString(),
  };
  const currentFirstName = contact.first_name ?? "";
  const currentMiddleName = contact.middle_name ?? "";
  const currentLastName = contact.last_name ?? "";
  const nextFirstName = typeof body.firstName === "string" ? body.firstName.trim() : currentFirstName;
  const nextMiddleName = typeof body.middleName === "string" ? body.middleName.trim() : currentMiddleName;
  const nextLastName = typeof body.lastName === "string" ? body.lastName.trim() : currentLastName;
  updateContact.full_name = fullNameFromParts(nextFirstName, nextMiddleName, nextLastName);
  if (typeof body.salutation === "string") updateContact.salutation = body.salutation.trim() || null;
  if (typeof body.firstName === "string") updateContact.first_name = body.firstName.trim();
  if (typeof body.middleName === "string") updateContact.middle_name = body.middleName.trim() || null;
  if (typeof body.lastName === "string") updateContact.last_name = body.lastName.trim();
  if (typeof body.suffix === "string") updateContact.suffix = body.suffix.trim() || null;
  if (typeof body.email === "string") updateContact.email = body.email.trim().toLowerCase() || null;
  if (typeof body.phone === "string") updateContact.phone = body.phone.trim() || null;
  if (typeof body.company === "string") updateContact.company = body.company.trim() || null;
  if (typeof body.addressLine1 === "string") updateContact.address_line_1 = body.addressLine1.trim() || null;
  if (typeof body.addressLine2 === "string") updateContact.address_line_2 = body.addressLine2.trim() || null;
  if (typeof body.city === "string") updateContact.city = body.city.trim() || null;
  if (typeof body.state === "string") updateContact.state = body.state.trim() || null;
  if (typeof body.postalCode === "string") updateContact.postal_code = body.postalCode.trim() || null;
  if (typeof body.country === "string") updateContact.country = body.country.trim() || null;
  if (typeof body.notes === "string") updateContact.notes = body.notes.trim() || null;
  if (typeof body.otherCategoryDescription === "string") {
    updateContact.other_category_description = body.otherCategoryDescription.trim() || null;
  }

  const { error: updateErr } = await admin
    .from("contacts")
    .update(updateContact)
    .eq("id", contact.id)
    .eq("tenant_id", actor.tenantId);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

  if (body.categories) {
    const categories = normalizeContactCategories(body.categories);
    await admin
      .from("contact_category_assignments")
      .delete()
      .eq("tenant_id", actor.tenantId)
      .eq("contact_id", contact.id);
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
  }

  if (body.brokerProfile) {
    const brokerage = body.brokerProfile.brokerage?.trim();
    const signing = normalizeSigningPreferencePayload(
      body.brokerProfile.signingPlatform,
      body.brokerProfile.signingPreference,
    );
    const { data: profile, error: profileErr } = await admin
      .from("broker_profiles")
      .upsert(
        {
          tenant_id: actor.tenantId,
          contact_id: contact.id,
          signing_platform: signing.signingPlatform,
          signing_preferences: signing.signingPreferences,
          settings: {
            ...(body.brokerProfile.settings ?? {}),
            ...(brokerage ? { brokerage } : {}),
          },
          updated_by: actor.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "contact_id" },
      )
      .select("id")
      .single();
    if (profileErr || !profile) {
      return NextResponse.json({ error: profileErr?.message ?? "broker_profile_upsert_failed" }, { status: 400 });
    }

    const canManageCredentials = canManageBrokerCredentials(actor.role);
    if (
      body.brokerProfile.credentialProvider &&
      body.brokerProfile.credentials &&
      Object.keys(body.brokerProfile.credentials).length > 0
    ) {
      if (!canManageCredentials) {
        return NextResponse.json({ error: "forbidden_credentials" }, { status: 403 });
      }
      const { error: credentialErr } = await admin.from("broker_profile_credentials").upsert(
        {
          broker_profile_id: profile.id,
          tenant_id: actor.tenantId,
          provider: body.brokerProfile.credentialProvider.trim().toLowerCase(),
          credentials_json: wrapEncryptedCredentials(body.brokerProfile.credentials) as unknown as Record<string, unknown>,
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
    operation: "UPDATE",
    old_data: null,
    new_data: { source: "api", operation: "contacts.update" },
    actor_id: actor.userId,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const limited = await enforceApiRateLimit(request);
  if (limited) return limited;
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: "csrf_invalid" }, { status: 403 });
  }

  const actor = await loadActorContext();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canWriteContacts(actor.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const loaded = await loadContactOr404(actor.tenantId, ctx.params.id);
  if (loaded.error) return loaded.error;
  const contact = loaded.data!;

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("contacts")
    .delete()
    .eq("id", contact.id)
    .eq("tenant_id", actor.tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await admin.from("audit_log").insert({
    tenant_id: actor.tenantId,
    table_name: "contacts",
    record_id: contact.id,
    operation: "DELETE",
    old_data: null,
    new_data: { source: "api", operation: "contacts.delete" },
    actor_id: actor.userId,
  });

  return NextResponse.json({ ok: true });
}
