/**
 * UAT seed — service role only. Wipes UAT_TENANT_ID and @nexa.test auth users, then recreates.
 * Run: npx tsx --env-file=.env.local scripts/seed.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  UAT_OTHER_TRANSACTION_ID,
  UAT_PASSWORD,
  UAT_TENANT_ID,
  UAT_TRANSACTION_ID,
  UAT_USERS,
} from "./uat-constants";

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

const BUCKET = process.env.SUPABASE_ATTACHMENTS_BUCKET?.trim() || "attachments";

function partyRoleForAppRole(
  r: (typeof UAT_USERS)[keyof typeof UAT_USERS]["role"],
): PartyRole {
  const m: Record<string, PartyRole> = {
    tc: "transaction_coordinator",
    tenant_admin: "other",
    global_admin: "other",
    broker: "other",
    agent: "buyer_agent",
    buyer: "buyer",
    seller: "seller",
    mortgage: "lender",
    title: "title_officer",
    admin: "other",
  };
  return m[r] ?? "other";
}

async function pdfBytes(label: string): Promise<Uint8Array> {
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
  return pdf.save();
}

async function wipe(admin: ReturnType<typeof createServiceRoleClient>) {
  // Tenant row is retained because audit_log is append-only and can block tenant cascade deletes.
  // Instead, wipe tenant-scoped data rows directly.
  const tenantScopedTables = [
    "tenant_access_requests",
    "tenant_admin_assignments",
    "global_resource_registry",
    "transactions",
    "transaction_parties",
    "documents",
    "checklist_items",
    "checklists",
    "checklist_templates",
    "messages",
    "tasks",
    "email_ingestion",
    "api_integrations",
    "users",
  ] as const;

  for (const table of tenantScopedTables) {
    const { error } = await admin.from(table).delete().eq("tenant_id", UAT_TENANT_ID);
    if (error) console.warn(`[seed] ${table} delete:`, error.message);
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
      name: "Nexa Test Brokerage",
      slug: "nexa-test",
      settings: {},
    },
    { onConflict: "id" },
  );
  if (tErr) throw new Error(`tenant insert: ${tErr.message}`);

  const authIds: Record<string, string> = {};

  console.log("[seed] creating auth users + profiles…");
  for (const key of Object.keys(UAT_USERS) as (keyof typeof UAT_USERS)[]) {
    const { email, role } = UAT_USERS[key];
    const dbRole =
      role === "global_admin" ? "superadmin" : role === "tenant_admin" ? "admin" : role;
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password: UAT_PASSWORD,
      email_confirm: true,
      user_metadata: { tenant_id: UAT_TENANT_ID, role },
      app_metadata: { tenant_id: UAT_TENANT_ID, role },
    });
    if (cErr || !created.user) throw new Error(`createUser ${email}: ${cErr?.message}`);
    authIds[key] = created.user.id;

    const { error: pErr } = await admin.from("users").insert({
      id: created.user.id,
      tenant_id: UAT_TENANT_ID,
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

  console.log("[seed] transaction parties (main)…");
  for (const key of Object.keys(UAT_USERS) as (keyof typeof UAT_USERS)[]) {
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

  console.log("[seed] secondary transaction (TC not a party)…");
  const { error: otxErr } = await admin.from("transactions").upsert(
    {
      id: UAT_OTHER_TRANSACTION_ID,
      tenant_id: UAT_TENANT_ID,
      status: "draft",
      property_address: "999 Isolation Test Lane, NM",
      mls_number: "TEST-ISO",
      created_by: authIds.admin,
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
    { record: "users/auth", ok: true, count: Object.keys(authIds).length },
    { record: "transaction main", ok: true, id: UAT_TRANSACTION_ID },
    { record: "transaction isolation", ok: true, id: UAT_OTHER_TRANSACTION_ID },
    { record: "documents main", ok: true, count: docIds.length },
    { record: "checklist items", ok: true, count: itemRows.length },
    { record: "tasks", ok: true, count: taskSpecs.length },
    { record: "messages", ok: true, count: bodies.length },
    { record: "iso document", ok: true, id: isoDoc.id },
  ]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
