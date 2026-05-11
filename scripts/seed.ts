/**
 * UAT seed — service role only. Wipes UAT_TENANT_ID and @nexa.test auth users, then recreates.
 * Run: npx tsx --env-file=.env.local scripts/seed.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  UAT_PASSWORD,
  UAT_PLATFORM_TENANT_ID,
  UAT_TENANT_ID,
  UAT_TRANSACTION_ID,
  UAT_OTHER_TRANSACTION_ID,
  UAT_USERS,
} from "./uat-constants";

const EXTRA_TRANSACTION_IDS = [
  "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
  "cccccccc-cccc-4ccc-8ccc-ccccccccccc2",
  "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
  "cccccccc-cccc-4ccc-8ccc-ccccccccccc4",
  "cccccccc-cccc-4ccc-8ccc-ccccccccccc5",
  "cccccccc-cccc-4ccc-8ccc-ccccccccccc6",
  "cccccccc-cccc-4ccc-8ccc-ccccccccccc7",
  "cccccccc-cccc-4ccc-8ccc-ccccccccccc8",
  "cccccccc-cccc-4ccc-8ccc-ccccccccccc9",
] as const;

const CONTACTS_PER_CATEGORY = 3;
const BROKER_COUNT = 3;
const LINKED_TRANSACTION_COUNT = 10;

const NON_BROKER_CATEGORIES = [
  "attorney",
  "buyer",
  "client",
  "lead",
  "lender",
  "seller",
  "soi",
  "tc",
  "title",
  "vendor",
  "other",
] as const;

function assertSeedSafetyGate() {
  const allowed = process.env.ALLOW_UAT_SEED;
  if (allowed !== "1") {
    throw new Error(
      "Refusing to run seed.ts. Set ALLOW_UAT_SEED=1 to explicitly allow UAT seeding.",
    );
  }

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_UAT_SEED_IN_PROD !== "1") {
    throw new Error(
      "Refusing to run seed.ts in NODE_ENV=production. Set ALLOW_UAT_SEED_IN_PROD=1 only in controlled CI/test environments.",
    );
  }
}

type PartyRole =
  | "buyer"
  | "seller"
  | "listing_agent"
  | "buyer_agent"
  | "transaction_coordinator"
  | "lender"
  | "title_officer"
  | "other";

type DocCategory =
  | "contract"
  | "disclosure"
  | "title"
  | "mortgage"
  | "inspection";

type DocStatus =
  | "uploaded"
  | "under_review"
  | "approved"
  | "sent_for_signature";

type TemplateSelectionState =
  | "required"
  | "optional"
  | "default"
  | "unavailable"
  | "pending_licensed_copy";

const BUCKET = process.env.SUPABASE_ATTACHMENTS_BUCKET?.trim() || "attachments";

function tenantIdForUser(
  u: (typeof UAT_USERS)[keyof typeof UAT_USERS],
): string {
  return u.tenant === "platform" ? UAT_PLATFORM_TENANT_ID : UAT_TENANT_ID;
}

function partyRoleForAppRole(
  r: (typeof UAT_USERS)[keyof typeof UAT_USERS]["role"],
): PartyRole {
  const m: Record<string, PartyRole> = {
    tc: "transaction_coordinator",
    tenant_admin: "other",
    global_admin: "other",
    broker: "buyer_agent",
    agent: "buyer_agent",
    buyer: "buyer",
    seller: "seller",
    mortgage: "lender",
    title: "title_officer",
    admin: "other",
  };
  return m[r] ?? "other";
}

async function pdfBytes(
  label: string,
  fieldNames: string[] = [],
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(label, {
    x: 50,
    y: 750,
    size: 18,
    font,
    color: rgb(0.15, 0.15, 0.2),
  });
  const form = pdf.getForm();
  fieldNames.forEach((fieldName, idx) => {
    const field = form.createTextField(fieldName);
    field.addToPage(page, {
      x: 50,
      y: 700 - idx * 36,
      width: 300,
      height: 22,
    });
  });
  return pdf.save();
}

function linkedIntakeData(args: {
  sellerName: string;
  buyerName: string;
  sellerBrokerName: string;
  buyerBrokerName: string;
  sellerBrokerCompany: string;
  buyerBrokerCompany: string;
  sellerBrokerEmail: string;
  buyerBrokerEmail: string;
}): Record<string, unknown> {
  return {
    sellers_names: args.sellerName,
    buyers_names: args.buyerName,
    seller_broker_1_brokerage_firm: args.sellerBrokerCompany,
    seller_broker_1_broker_name: args.sellerBrokerName,
    seller_broker_1_email: args.sellerBrokerEmail,
    seller_broker_1_city: "Albuquerque",
    seller_broker_1_state: "NM",
    buyer_broker_1_brokerage_firm: args.buyerBrokerCompany,
    buyer_broker_1_broker_name: args.buyerBrokerName,
    buyer_broker_1_email: args.buyerBrokerEmail,
    buyer_broker_1_city: "Albuquerque",
    buyer_broker_1_state: "NM",
    tc_representation_side: "both",
    tc_engaged: true,
    source_forms_received: "Seed",
  };
}

async function wipe(admin: ReturnType<typeof createServiceRoleClient>) {
  // Tenant row is retained because audit_log is append-only and can block tenant cascade deletes.
  // Transactions are retained for the same reason: audit_log.transaction_id uses ON DELETE SET NULL,
  // which would mutate immutable audit rows. Deterministic transaction upserts below refresh seed rows.
  const tenantScopedTables = [
    "transaction_document_selections",
    "transaction_contact_assignments",
    "contact_company_links",
    "broker_profile_credentials",
    "broker_profiles",
    "contact_category_assignments",
    "transaction_parties",
    "documents",
    "checklist_items",
    "checklists",
    "messages",
    "tasks",
    "email_ingestion",
    "api_integrations",
    "checklist_templates",
    "contacts",
    "companies",
    "tenant_access_requests",
    "tenant_admin_assignments",
    "users",
  ] as const;

  for (const table of tenantScopedTables) {
    const { error } = await admin.from(table).delete().eq("tenant_id", UAT_TENANT_ID);
    if (error) console.warn(`[seed] ${table} delete:`, error.message);
    const { error: platformErr } = await admin
      .from(table)
      .delete()
      .eq("tenant_id", UAT_PLATFORM_TENANT_ID);
    if (platformErr) console.warn(`[seed] ${table} platform delete:`, platformErr.message);
  }

  await admin
    .from("global_document_template_versions")
    .delete()
    .like("storage_path", "templates/global/%");
  await admin
    .from("global_document_templates")
    .delete()
    .contains("metadata", { seed_key: "uat_template" });

  const { error: globalRegistryErr } = await admin
    .from("global_resource_registry")
    .delete()
    .not("id", "is", null);
  if (globalRegistryErr) {
    console.warn("[seed] global_resource_registry delete:", globalRegistryErr.message);
  }

  const emailSet = new Set<string>(Object.values(UAT_USERS).map((u) => u.email));
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    if (!data.users.length) break;
    for (const u of data.users) {
      if (u.email && emailSet.has(u.email)) {
        const { error: delErr } = await admin.auth.admin.deleteUser(u.id);
        if (delErr) console.warn("[seed] delete auth user", u.email, delErr.message);
      }
    }
    if (data.users.length < 200) break;
    page += 1;
  }
}

async function main() {
  assertSeedSafetyGate();
  const admin = createServiceRoleClient();
  console.log("[seed] wiping previous UAT data…");
  await wipe(admin);

  console.log("[seed] inserting tenant…");
  const { error: tErr } = await admin.from("tenants").upsert(
    {
      id: UAT_TENANT_ID,
      name: "CD Legacy Transitions",
      slug: "nexa-test",
      settings: {},
    },
    { onConflict: "id" },
  );
  if (tErr) throw new Error(`tenant insert: ${tErr.message}`);

  const { error: platformTenantErr } = await admin.from("tenants").upsert(
    {
      id: UAT_PLATFORM_TENANT_ID,
      name: "Choral Point Platform",
      slug: "choral-point-platform",
      settings: {},
    },
    { onConflict: "id" },
  );
  if (platformTenantErr) throw new Error(`platform tenant insert: ${platformTenantErr.message}`);

  const authIds: Record<string, string> = {};

  console.log("[seed] creating auth users + profiles…");
  for (const key of Object.keys(UAT_USERS) as (keyof typeof UAT_USERS)[]) {
    const { email, role } = UAT_USERS[key];
    const tenantId = tenantIdForUser(UAT_USERS[key]);
    const dbRole =
      role === "global_admin"
        ? "superadmin"
        : role === "tenant_admin"
          ? "admin"
          : role === "broker"
            ? "agent"
            : role;
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password: UAT_PASSWORD,
      email_confirm: true,
      user_metadata: { tenant_id: tenantId, role },
      app_metadata: { tenant_id: tenantId, role },
    });
    if (cErr || !created.user) throw new Error(`createUser ${email}: ${cErr?.message}`);
    authIds[key] = created.user.id;

    const { error: pErr } = await admin.from("users").insert({
      id: created.user.id,
      tenant_id: tenantId,
      email,
      role: dbRole,
      full_name: `UAT ${key}`,
    });
    if (pErr) throw new Error(`public.users ${email}: ${pErr.message}`);
  }

  const today = new Date();
  const close = new Date(today);
  close.setDate(close.getDate() + 30);
  const contractDate = today.toISOString().slice(0, 10);
  const closeDate = close.toISOString().slice(0, 10);

  const tcId = authIds.tc;
  const SAMPLE_COUNT = 5;

  console.log("[seed] main transaction…");
  const { error: txErr } = await admin.from("transactions").upsert(
    {
      id: UAT_TRANSACTION_ID,
      tenant_id: UAT_TENANT_ID,
      status: "under_contract",
      property_address: "1234 Desert Willow Drive, Albuquerque, NM 87120",
      mls_number: "TEST-001",
      purchase_price: 425000,
      earnest_money: 8500,
      contract_date: contractDate,
      close_date: closeDate,
      tc_id: tcId,
      created_by: tcId,
    },
    { onConflict: "id" },
  );
  if (txErr) throw new Error(`transaction: ${txErr.message}`);

  console.log("[seed] additional transactions…");
  const extraTransactionIds: string[] = [];
  for (let i = 0; i < LINKED_TRANSACTION_COUNT - 1; i++) {
    const extraClose = new Date(today);
    extraClose.setDate(extraClose.getDate() + 15 + i * 7);
    const { data: tx, error } = await admin
      .from("transactions")
      .upsert({
        id: EXTRA_TRANSACTION_IDS[i],
        tenant_id: UAT_TENANT_ID,
        status: i % 2 === 0 ? "active" : "under_contract",
        property_address: `${1200 + i} Sample Vista Road, Albuquerque, NM 8712${i}`,
        mls_number: `TEST-X${i + 1}`,
        contract_date: contractDate,
        close_date: extraClose.toISOString().slice(0, 10),
        created_by: tcId,
        notes: `Seeded sample transaction ${i + 1}`,
      }, { onConflict: "id" })
      .select("id")
      .single();
    if (error || !tx) throw new Error(`extra transaction ${i + 1}: ${error?.message}`);
    extraTransactionIds.push(tx.id);
  }

  console.log("[seed] transaction parties (main)…");
  for (const key of Object.keys(UAT_USERS) as (keyof typeof UAT_USERS)[]) {
    if (UAT_USERS[key].tenant !== "company") continue;
    const uid = authIds[key];
    const { role } = UAT_USERS[key];
    const { error: pErr } = await admin.from("transaction_parties").insert({
      tenant_id: UAT_TENANT_ID,
      transaction_id: UAT_TRANSACTION_ID,
      user_id: uid,
      party_role: partyRoleForAppRole(role),
      display_name: `UAT ${key}`,
      contact_email: UAT_USERS[key].email,
    });
    if (pErr) throw new Error(`party ${key}: ${pErr.message}`);
  }

  console.log("[seed] checklist template + instance…");
  const templateItems = Array.from({ length: 10 }, (_, i) => ({
    title: `UAT template item ${i + 1}`,
    sort_order: i,
  }));

  const { data: tmpl, error: tmplErr } = await admin
    .from("checklist_templates")
    .insert({
      tenant_id: UAT_TENANT_ID,
      name: "UAT Default Template",
      description: "Seeded for automated UAT",
      template_items: templateItems,
      transaction_type: null,
    })
    .select("id")
    .single();

  if (tmplErr || !tmpl) throw new Error(`template: ${tmplErr?.message}`);

  const { data: cl, error: clErr } = await admin
    .from("checklists")
    .insert({
      tenant_id: UAT_TENANT_ID,
      transaction_id: UAT_TRANSACTION_ID,
      name: "UAT Default Template",
    })
    .select("id")
    .single();

  if (clErr || !cl) throw new Error(`checklist: ${clErr?.message}`);

  const itemRows: { id: string }[] = [];
  for (const item of templateItems) {
    const { data: row, error: iErr } = await admin
      .from("checklist_items")
      .insert({
        tenant_id: UAT_TENANT_ID,
        transaction_id: UAT_TRANSACTION_ID,
        checklist_id: cl.id,
        title: item.title,
        sort_order: item.sort_order,
        completed: false,
      })
      .select("id")
      .single();
    if (iErr || !row) throw new Error(`checklist item: ${iErr?.message}`);
    itemRows.push(row);
  }

  const completeCount = Math.floor(itemRows.length * 0.4);
  for (let i = 0; i < completeCount; i++) {
    await admin
      .from("checklist_items")
      .update({ completed: true, updated_at: new Date().toISOString() })
      .eq("id", itemRows[i].id);
  }

  console.log("[seed] documents (PDFs)…");
  const categories: DocCategory[] = [
    "contract",
    "disclosure",
    "inspection",
    "mortgage",
    "title",
  ];
  const statuses: DocStatus[] = [
    "uploaded",
    "under_review",
    "approved",
    "sent_for_signature",
  ];
  let si = 0;
  const docIds: string[] = [];
  for (const cat of categories) {
    for (let k = 0; k < 3; k++) {
      const label = `${cat}-${k + 1}`;
      const buf = await pdfBytes(label);
      const path = `${UAT_TENANT_ID}/${UAT_TRANSACTION_ID}/${Date.now()}_${k}_${cat}.pdf`;
      const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buf, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (upErr) throw new Error(`storage upload: ${upErr.message}`);

      const status = statuses[si % statuses.length];
      si++;

      const { data: docRow, error: dErr } = await admin
        .from("documents")
        .insert({
          tenant_id: UAT_TENANT_ID,
          transaction_id: UAT_TRANSACTION_ID,
          uploaded_by: tcId,
          category: cat,
          status,
          file_name: `${label}.pdf`,
          storage_path: path,
          mime_type: "application/pdf",
          size_bytes: buf.byteLength,
        })
        .select("id")
        .single();

      if (dErr || !docRow) throw new Error(`document row: ${dErr?.message}`);
      docIds.push(docRow.id);
    }
  }

  console.log("[seed] global document templates + selections…");
  const templateSpecs: Array<{
    formNumber: string;
    title: string;
    category: DocCategory | "other";
    availability: "available" | "unavailable" | "pending_licensed_copy";
    selectionState: TemplateSelectionState;
    fieldMappings: Record<string, string>;
    docStatus:
      | "missing"
      | "requested"
      | "uploaded"
      | "under_review"
      | "approved"
      | "rejected";
  }> = [
    {
      formNumber: "NMAR-2104",
      title: "Residential Purchase Agreement",
      category: "contract",
      availability: "available",
      selectionState: "required",
      fieldMappings: {
        property_address_field: "property_address",
        mls_number_field: "mls_number",
      },
      docStatus: "uploaded",
    },
    {
      formNumber: "NMAR-1100",
      title: "Seller Property Disclosure",
      category: "disclosure",
      availability: "available",
      selectionState: "default",
      fieldMappings: {
        property_address_field: "property_address",
        sellers_names_field: "intake_data.sellers_names",
      },
      docStatus: "under_review",
    },
    {
      formNumber: "NMAR-2300",
      title: "Lead-Based Paint Addendum",
      category: "disclosure",
      availability: "pending_licensed_copy",
      selectionState: "pending_licensed_copy",
      fieldMappings: {},
      docStatus: "missing",
    },
    {
      formNumber: "NMAR-2600",
      title: "Historic Property Rider",
      category: "other",
      availability: "unavailable",
      selectionState: "unavailable",
      fieldMappings: {},
      docStatus: "missing",
    },
    {
      formNumber: "NMAR-2420",
      title: "HOA Addendum",
      category: "other",
      availability: "available",
      selectionState: "optional",
      fieldMappings: {
        property_address_field: "property_address",
      },
      docStatus: "requested",
    },
  ];

  const templateSelectionIds: string[] = [];
  for (const spec of templateSpecs) {
    const { data: templateRow, error: templateErr } = await admin
      .from("global_document_templates")
      .upsert(
        {
          form_number: spec.formNumber,
          title: spec.title,
          category: spec.category,
          jurisdiction_state: "NM",
          availability_status: spec.availability,
          is_active: true,
          metadata: { seed_key: "uat_template" },
          created_by: tcId,
          updated_by: tcId,
        },
        { onConflict: "form_number,jurisdiction_state" },
      )
      .select("id")
      .single();
    if (templateErr || !templateRow) {
      throw new Error(`global template ${spec.formNumber}: ${templateErr?.message}`);
    }

    const templateVersionId = randomUUID();
    const versionPath = `templates/global/${templateRow.id}/${templateVersionId}/${spec.formNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
    const templatePdf = await pdfBytes(
      `${spec.formNumber} template`,
      Object.keys(spec.fieldMappings),
    );
    const { error: templateUploadErr } = await admin.storage
      .from(BUCKET)
      .upload(versionPath, templatePdf, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (templateUploadErr) {
      throw new Error(`template storage upload ${spec.formNumber}: ${templateUploadErr.message}`);
    }

    const { data: versionRow, error: versionErr } = await admin
      .from("global_document_template_versions")
      .upsert(
        {
          id: templateVersionId,
          template_id: templateRow.id,
          version_label: "seed-v1",
          source_file_name: `${spec.formNumber}.pdf`,
          storage_path: versionPath,
          review_status: "approved",
          mapping_review_status: "approved",
          fillable_field_names: Object.keys(spec.fieldMappings),
          field_mappings: spec.fieldMappings,
          is_current: true,
          is_active: true,
          created_by: tcId,
          updated_by: tcId,
        },
        { onConflict: "template_id,version_label" },
      )
      .select("id")
      .single();
    if (versionErr || !versionRow) {
      throw new Error(`template version ${spec.formNumber}: ${versionErr?.message}`);
    }

    const { data: selectionRow, error: selectionErr } = await admin
      .from("transaction_document_selections")
      .upsert(
        {
          tenant_id: UAT_TENANT_ID,
          transaction_id: UAT_TRANSACTION_ID,
          template_id: templateRow.id,
          template_version_id: versionRow.id,
          selection_state: spec.selectionState,
          document_status: spec.docStatus,
          notes: `Seeded ${spec.selectionState} template`,
          added_by: tcId,
        },
        { onConflict: "transaction_id,template_id" },
      )
      .select("id")
      .single();
    if (selectionErr || !selectionRow) {
      throw new Error(`transaction template selection ${spec.formNumber}: ${selectionErr?.message}`);
    }
    templateSelectionIds.push(selectionRow.id);
  }

  console.log("[seed] tasks…");
  const overdue = new Date(today);
  overdue.setDate(overdue.getDate() - 3);
  const future1 = new Date(today);
  future1.setDate(future1.getDate() + 5);
  const future2 = new Date(today);
  future2.setDate(future2.getDate() + 12);

  const taskSpecs = [
    { title: "UAT overdue task A", due: overdue, priority: "high" },
    { title: "UAT overdue task B", due: overdue, priority: "medium" },
    { title: "UAT future task C", due: future1, priority: "low" },
    { title: "UAT future task D", due: future2, priority: "high" },
    { title: "UAT future task E", due: future2, priority: "medium" },
  ];

  for (const t of taskSpecs) {
    const dueStr = t.due.toISOString().slice(0, 10);
    const { error: taskErr } = await admin.from("tasks").insert({
      tenant_id: UAT_TENANT_ID,
      transaction_id: UAT_TRANSACTION_ID,
      assigned_to: tcId,
      title: t.title,
      due_date: dueStr,
      priority: t.priority,
    });
    if (taskErr) throw new Error(`task: ${taskErr.message}`);
  }

  console.log("[seed] messages…");
  const bodies = [
    { body: "Internal: timeline aligned with title.", internal: true },
    { body: "External: hi everyone — quick update on inspection.", internal: false },
    { body: "Internal: lender package queued for review.", internal: true },
    { body: "External: thanks — received the disclosure draft.", internal: false },
    { body: "Internal: reminder — earnest money verified.", internal: true },
    { body: "External: closing date works for us.", internal: false },
  ];

  for (const m of bodies) {
    const { error: mErr } = await admin.from("messages").insert({
      tenant_id: UAT_TENANT_ID,
      transaction_id: UAT_TRANSACTION_ID,
      sender_user_id: tcId,
      body: m.body,
      is_internal: m.internal,
    });
    if (mErr) throw new Error(`message: ${mErr.message}`);
  }

  for (const txId of extraTransactionIds) {
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const { error: taskErr } = await admin.from("tasks").insert({
        tenant_id: UAT_TENANT_ID,
        transaction_id: txId,
        assigned_to: tcId,
        title: `Sample task ${i + 1} for ${txId.slice(0, 8)}`,
        due_date: new Date(Date.now() + (i + 2) * 86400000).toISOString().slice(0, 10),
        priority: i % 2 === 0 ? "medium" : "high",
      });
      if (taskErr) throw new Error(`extra task: ${taskErr.message}`);
    }
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const { error: mErr } = await admin.from("messages").insert({
        tenant_id: UAT_TENANT_ID,
        transaction_id: txId,
        sender_user_id: tcId,
        body: `Sample message ${i + 1} for ${txId.slice(0, 8)}`,
        is_internal: i % 2 === 0,
      });
      if (mErr) throw new Error(`extra message: ${mErr.message}`);
    }
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const label = `extra-${txId.slice(0, 4)}-${i + 1}`;
      const buf = await pdfBytes(label);
      const path = `${UAT_TENANT_ID}/${txId}/${Date.now()}_${i}_extra.pdf`;
      const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buf, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (upErr) throw new Error(`extra storage upload: ${upErr.message}`);
      const { error: dErr } = await admin.from("documents").insert({
        tenant_id: UAT_TENANT_ID,
        transaction_id: txId,
        uploaded_by: tcId,
        category: "other",
        status: "uploaded",
        file_name: `${label}.pdf`,
        storage_path: path,
        mime_type: "application/pdf",
        size_bytes: buf.byteLength,
      });
      if (dErr) throw new Error(`extra document row: ${dErr.message}`);
    }
  }

  console.log("[seed] contacts, broker profiles, and companies…");
  const companyRows: { id: string; name: string }[] = [];
  const companyNames = ["ReMax", "Coldwell Banker", "Keller Williams", "eXp Realty", "Compass"];
  for (const [idx, name] of companyNames.entries()) {
    const { data, error } = await admin
      .from("companies")
      .insert({
        tenant_id: UAT_TENANT_ID,
        name,
        company_type: "brokerage",
        created_by: tcId,
        updated_by: tcId,
        phone: `505-555-10${idx}`,
      })
      .select("id, name")
      .single();
    if (error || !data) throw new Error(`company ${name}: ${error?.message}`);
    companyRows.push(data);
  }

  const contactIds: string[] = [];
  const contactsByCategory = new Map<string, Array<{ id: string; fullName: string; email: string }>>();
  const brokerContacts: Array<{
    id: string;
    fullName: string;
    email: string;
    company: string;
  }> = [];

  let contactOrdinal = 1;
  for (const category of NON_BROKER_CATEGORIES) {
    for (let i = 0; i < CONTACTS_PER_CATEGORY; i++) {
      const firstName = `${category.toUpperCase()}${i + 1}`;
      const lastName = "Contact";
      const fullName = `${firstName} ${lastName}`;
      const email = `${category}.${i + 1}@nexa.test`;
      const company = companyRows[(contactOrdinal - 1) % companyRows.length]?.name ?? "Nexa";
      const { data: contact, error: cErr } = await admin
        .from("contacts")
        .insert({
          tenant_id: UAT_TENANT_ID,
          salutation: i % 2 === 0 ? "Mr." : "Ms.",
          first_name: firstName,
          middle_name: null,
          last_name: lastName,
          suffix: null,
          full_name: fullName,
          email,
          phone: `505-555-${String(300 + contactOrdinal).padStart(4, "0")}`,
          company,
          address_line_1: `${700 + contactOrdinal} Copper Ave`,
          city: "Albuquerque",
          state: "NM",
          postal_code: `871${String(i).padStart(2, "0")}`,
          country: "USA",
          notes: `Seeded ${category} contact ${i + 1}`,
          other_category_description: category === "other" ? `Other type ${i + 1}` : null,
          created_by: tcId,
          updated_by: tcId,
        })
        .select("id")
        .single();
      if (cErr || !contact) {
        throw new Error(`contact ${category}-${i + 1}: ${cErr?.message}`);
      }
      contactIds.push(contact.id);

      const { error: catErr } = await admin.from("contact_category_assignments").insert({
        contact_id: contact.id,
        tenant_id: UAT_TENANT_ID,
        category,
      });
      if (catErr) throw new Error(`contact category ${category}-${i + 1}: ${catErr.message}`);

      const existing = contactsByCategory.get(category) ?? [];
      existing.push({ id: contact.id, fullName, email });
      contactsByCategory.set(category, existing);

      const { error: linkErr } = await admin.from("contact_company_links").insert({
        tenant_id: UAT_TENANT_ID,
        contact_id: contact.id,
        company_id: companyRows[contactOrdinal % companyRows.length]?.id,
        relationship: "employee",
        is_primary: true,
      });
      if (linkErr) throw new Error(`contact company link ${category}-${i + 1}: ${linkErr.message}`);
      contactOrdinal += 1;
    }
  }

  for (let i = 0; i < BROKER_COUNT; i++) {
    const firstName = `Broker${i + 1}`;
    const lastName = "Contact";
    const fullName = `${firstName} ${lastName}`;
    const email = `broker.${i + 1}@nexa.test`;
    const company = companyRows[i % companyRows.length]?.name ?? "Nexa Brokerage";
    const { data: contact, error: cErr } = await admin
      .from("contacts")
      .insert({
        tenant_id: UAT_TENANT_ID,
        salutation: "Ms.",
        first_name: firstName,
        middle_name: null,
        last_name: lastName,
        suffix: null,
        full_name: fullName,
        email,
        phone: `505-555-${String(800 + i).padStart(4, "0")}`,
        company,
        address_line_1: `${900 + i} Broker Plaza`,
        city: "Albuquerque",
        state: "NM",
        postal_code: `8712${i}`,
        country: "USA",
        notes: `Seeded broker contact ${i + 1}`,
        created_by: tcId,
        updated_by: tcId,
      })
      .select("id")
      .single();
    if (cErr || !contact) throw new Error(`broker contact ${i + 1}: ${cErr?.message}`);
    contactIds.push(contact.id);

    const { error: catErr } = await admin.from("contact_category_assignments").insert({
      contact_id: contact.id,
      tenant_id: UAT_TENANT_ID,
      category: "broker",
    });
    if (catErr) throw new Error(`broker category ${i + 1}: ${catErr.message}`);

    const { data: profile, error: pErr } = await admin
      .from("broker_profiles")
      .insert({
        tenant_id: UAT_TENANT_ID,
        contact_id: contact.id,
        signing_platform: "docusign",
        signing_preferences: { mode: "email_link" },
        settings: { brokerage: company },
        created_by: tcId,
        updated_by: tcId,
      })
      .select("id")
      .single();
    if (pErr || !profile) throw new Error(`broker profile ${i + 1}: ${pErr?.message}`);

    const { error: credErr } = await admin.from("broker_profile_credentials").insert({
      broker_profile_id: profile.id,
      tenant_id: UAT_TENANT_ID,
      provider: "docusign",
      credentials_json: {
        v: 1,
        cipher: "aes-256-gcm",
        blob: "seed-placeholder",
      },
      updated_by: tcId,
    });
    if (credErr) throw new Error(`broker creds ${i + 1}: ${credErr.message}`);

    brokerContacts.push({
      id: contact.id,
      fullName,
      email,
      company,
    });

    const { error: linkErr } = await admin.from("contact_company_links").insert({
      tenant_id: UAT_TENANT_ID,
      contact_id: contact.id,
      company_id: companyRows[i % companyRows.length]?.id,
      relationship: "employee",
      is_primary: true,
    });
    if (linkErr) throw new Error(`broker company link ${i + 1}: ${linkErr.message}`);
  }

  const sellerContacts = contactsByCategory.get("seller") ?? [];
  const buyerContacts = contactsByCategory.get("buyer") ?? [];
  const vendorContacts = contactsByCategory.get("vendor") ?? [];
  const lenderContacts = contactsByCategory.get("lender") ?? [];
  const titleContacts = contactsByCategory.get("title") ?? [];
  const attorneyContacts = contactsByCategory.get("attorney") ?? [];
  const linkedTransactionIds = [UAT_TRANSACTION_ID, ...extraTransactionIds];
  for (let i = 0; i < linkedTransactionIds.length; i++) {
    const seller = sellerContacts[i % sellerContacts.length];
    const buyer = buyerContacts[i % buyerContacts.length];
    const sellerBroker = brokerContacts[i % brokerContacts.length];
    const buyerBroker = brokerContacts[(i + 1) % brokerContacts.length];
    const { error: txLinkErr } = await admin
      .from("transactions")
      .update({
        intake_data: linkedIntakeData({
          sellerName: seller?.fullName ?? `Seller ${i + 1}`,
          buyerName: buyer?.fullName ?? `Buyer ${i + 1}`,
          sellerBrokerName: sellerBroker?.fullName ?? `Seller Broker ${i + 1}`,
          buyerBrokerName: buyerBroker?.fullName ?? `Buyer Broker ${i + 1}`,
          sellerBrokerCompany: sellerBroker?.company ?? "Nexa Brokerage",
          buyerBrokerCompany: buyerBroker?.company ?? "Nexa Brokerage",
          sellerBrokerEmail: sellerBroker?.email ?? `seller.broker.${i + 1}@nexa.test`,
          buyerBrokerEmail: buyerBroker?.email ?? `buyer.broker.${i + 1}@nexa.test`,
        }),
      })
      .eq("id", linkedTransactionIds[i]);
    if (txLinkErr) throw new Error(`transaction link update ${i + 1}: ${txLinkErr.message}`);
  }

  console.log("[seed] transaction contact assignments…");
  const assignmentSeed = [
    {
      contact: vendorContacts[0],
      role: "vendor" as const,
      category: "vendor" as const,
      notes: "Primary inspection vendor",
    },
    {
      contact: lenderContacts[0],
      role: "lender" as const,
      category: "lender" as const,
      notes: "Primary lending contact",
    },
    {
      contact: titleContacts[0],
      role: "title" as const,
      category: "title" as const,
      notes: "Assigned title officer",
    },
    {
      contact: attorneyContacts[0],
      role: "attorney" as const,
      category: "attorney" as const,
      notes: "Closing counsel",
    },
    {
      contact: brokerContacts[0],
      role: "broker" as const,
      category: "broker" as const,
      notes: "Listing broker",
    },
  ].filter((row) => row.contact);

  for (const row of assignmentSeed) {
    const { error: assignErr } = await admin
      .from("transaction_contact_assignments")
      .upsert(
        {
          tenant_id: UAT_TENANT_ID,
          transaction_id: UAT_TRANSACTION_ID,
          contact_id: row.contact!.id,
          assignment_role: row.role,
          assignment_category: row.category,
          notes: row.notes,
          created_by: tcId,
          updated_by: tcId,
        },
        { onConflict: "transaction_id,contact_id,assignment_role" },
      );
    if (assignErr) throw new Error(`transaction contact assignment: ${assignErr.message}`);
  }

  console.log("[seed] secondary transaction (TC not a party)…");
  const { error: otxErr } = await admin.from("transactions").upsert(
    {
      id: UAT_OTHER_TRANSACTION_ID,
      tenant_id: UAT_TENANT_ID,
      status: "draft",
      property_address: "999 Isolation Test Lane, NM",
      mls_number: "TEST-ISO",
      created_by: tcId,
    },
    { onConflict: "id" },
  );
  if (otxErr) throw new Error(`other tx: ${otxErr.message}`);

  await admin.from("transaction_parties").insert({
    tenant_id: UAT_TENANT_ID,
    transaction_id: UAT_OTHER_TRANSACTION_ID,
    user_id: authIds.buyer,
    party_role: "buyer",
    display_name: "Isolation buyer",
    contact_email: UAT_USERS.buyer.email,
  });

  const isoBuf = await pdfBytes("isolation-doc");
  const isoPath = `${UAT_TENANT_ID}/${UAT_OTHER_TRANSACTION_ID}/iso.pdf`;
  const { error: isoUp } = await admin.storage.from(BUCKET).upload(isoPath, isoBuf, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (isoUp) throw new Error(`iso storage: ${isoUp.message}`);

  const { data: isoDoc, error: isoDocErr } = await admin
    .from("documents")
    .insert({
      tenant_id: UAT_TENANT_ID,
      transaction_id: UAT_OTHER_TRANSACTION_ID,
      uploaded_by: authIds.admin,
      category: "other",
      status: "uploaded",
      file_name: "iso.pdf",
      storage_path: isoPath,
      mime_type: "application/pdf",
      size_bytes: isoBuf.byteLength,
      visible_to_client: true,
    })
    .select("id")
    .single();

  if (isoDocErr || !isoDoc) throw new Error(`iso doc: ${isoDocErr?.message}`);

  const statePath = join(process.cwd(), "scripts", ".uat-seed-state.json");
  writeFileSync(
    statePath,
    JSON.stringify(
      {
        checklistItemId: itemRows[0]?.id,
        documentId: docIds[0],
        isoDocumentId: isoDoc.id,
        transactionId: UAT_TRANSACTION_ID,
        otherTransactionId: UAT_OTHER_TRANSACTION_ID,
        linkedTransactionIds: [UAT_TRANSACTION_ID, ...extraTransactionIds],
        brokerContactIds: brokerContacts.map((b) => b.id),
        templateSelectionIds,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`[seed] wrote ${statePath}`);

  console.log("\n[seed] — summary (all targeted tables)");
  console.table([
    { record: "tenant", ok: true, id: UAT_TENANT_ID },
    { record: "platform tenant", ok: true, id: UAT_PLATFORM_TENANT_ID },
    { record: "users/auth", ok: true, count: Object.keys(authIds).length },
    { record: "transaction main", ok: true, id: UAT_TRANSACTION_ID },
    { record: "transaction isolation", ok: true, id: UAT_OTHER_TRANSACTION_ID },
    { record: "documents main", ok: true, count: docIds.length },
    { record: "checklist items", ok: true, count: itemRows.length },
    { record: "tasks", ok: true, count: taskSpecs.length },
    { record: "messages", ok: true, count: bodies.length },
    { record: "extra transactions", ok: true, count: extraTransactionIds.length },
    { record: "linked transactions total", ok: true, count: LINKED_TRANSACTION_COUNT },
    { record: "contacts", ok: true, count: contactIds.length },
    { record: "brokers", ok: true, count: brokerContacts.length },
    { record: "transaction contact assignments", ok: true, count: assignmentSeed.length },
    { record: "template selections", ok: true, count: templateSelectionIds.length },
    { record: "companies", ok: true, count: companyRows.length },
    { record: "iso document", ok: true, id: isoDoc.id },
  ]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
