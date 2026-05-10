/**
 * Automated UAT against a running Next.js dev server (same origin).
 * Run after: seed + npm run dev (or via scripts/run-local-uat.sh).
 *
 *   npx tsx --env-file=.env.local scripts/uat.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  UAT_OTHER_TRANSACTION_ID,
  UAT_PASSWORD,
  UAT_TRANSACTION_ID,
  UAT_USERS,
} from "./uat-constants";
import { CookieJar, fetchCsrfAndJar } from "./http-session";

const BASE = (
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

type Row = { area: string; name: string; ok: boolean; detail?: string };

const rows: Row[] = [];

function record(area: string, name: string, ok: boolean, detail?: string) {
  rows.push({ area, name, ok, detail });
}

async function login(email: string, password: string): Promise<CookieJar> {
  const jar = new CookieJar();
  const csrf = await fetchCsrfAndJar(BASE, jar);
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/json",
      Cookie: jar.header(),
      "x-csrf-token": csrf,
    },
    body: JSON.stringify({ email, password }),
  });
  jar.captureFrom(loginRes);
  return jar;
}

async function csrfForJar(jar: CookieJar): Promise<string> {
  return fetchCsrfAndJar(BASE, jar);
}

function loadSeedState(): {
  checklistItemId: string;
  documentId: string;
  isoDocumentId: string;
} | null {
  try {
    const raw = readFileSync(join(process.cwd(), "scripts", ".uat-seed-state.json"), "utf8");
    return JSON.parse(raw) as {
      checklistItemId: string;
      documentId: string;
      isoDocumentId: string;
    };
  } catch {
    return null;
  }
}

function jsonContentType(res: Response): boolean {
  const ct = res.headers.get("content-type") ?? "";
  return ct.includes("application/json");
}

async function main() {
  const seed = loadSeedState();
  if (!seed) {
    console.error("Missing scripts/.uat-seed-state.json — run scripts/seed.ts first.");
    process.exit(1);
  }

  const usedInCode = [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  for (const k of usedInCode) {
    const ok = Boolean(process.env[k]?.trim());
    record("env", `process.env.${k} set (local UAT)`, ok, ok ? "" : "add to .env.local");
  }

  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------
  try {
    const jar = await login(UAT_USERS.tc.email, UAT_PASSWORD);
    const me = await fetch(`${BASE}/api/transactions`, {
      headers: { Cookie: jar.header() },
    });
    record("auth", "TC can log in", me.ok, `status ${me.status}`);
  } catch (e) {
    record("auth", "TC can log in", false, String(e));
  }

  const roles: (keyof typeof UAT_USERS)[] = [
    "g_admin",
    "t_admin",
    "tc",
    "agent",
    "buyer",
    "seller",
    "mortgage",
    "title",
    "admin",
  ];
  for (const key of roles) {
    try {
      const jar = await login(UAT_USERS[key].email, UAT_PASSWORD);
      const r = await fetch(`${BASE}/api/auth/role-redirect`, {
        redirect: "manual",
        headers: { Cookie: jar.header() },
      });
      const loc = r.headers.get("location") ?? "";
      let okPath = false;
      if (key === "g_admin") okPath = loc.includes("/admin/global");
      else if (key === "t_admin" || key === "admin") okPath = loc.includes("/admin/tenant");
      else if (key === "tc") okPath = loc.includes("/tc");
      else if (key === "agent") okPath = loc.includes("/agent/");
      else if (key === "buyer") okPath = loc.includes("/buyer/");
      else if (key === "seller") okPath = loc.includes("/seller/");
      else if (key === "mortgage") okPath = loc.includes("/mortgage/");
      else if (key === "title") okPath = loc.includes("/title/");
      const ok = r.status === 302 && okPath;
      record("auth", `role redirect: ${key}`, ok, `→ ${loc || "n/a"}`);
    } catch (e) {
      record("auth", `role redirect: ${key}`, false, String(e));
    }
  }

  try {
    const jar = await login(UAT_USERS.buyer.email, UAT_PASSWORD);
    const r = await fetch(`${BASE}/tc`, {
      redirect: "manual",
      headers: { Cookie: jar.header() },
    });
    record("data", "Buyer cannot access /tc (403)", r.status === 403, `status ${r.status}`);
  } catch (e) {
    record("data", "Buyer cannot access /tc (403)", false, String(e));
  }

  try {
    const jar = await login(UAT_USERS.tc.email, UAT_PASSWORD);
    const r = await fetch(`${BASE}/buyer/${UAT_OTHER_TRANSACTION_ID}`, {
      redirect: "manual",
      headers: { Cookie: jar.header() },
    });
    record(
      "data",
      "TC cannot open /buyer for tx they are not on (403)",
      r.status === 403,
      `status ${r.status}`,
    );
  } catch (e) {
    record("data", "TC cannot open /buyer for foreign tx", false, String(e));
  }

  try {
    const jar = new CookieJar();
    const csrf = await fetchCsrfAndJar(BASE, jar);
    const bad = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: jar.header(),
        "x-csrf-token": csrf,
      },
      body: JSON.stringify({ email: "nope@nexa.test", password: "wrong" }),
    });
    jar.captureFrom(bad);
    record(
      "auth",
      "Invalid credentials safe JSON",
      bad.status === 401 && jsonContentType(bad),
      `status ${bad.status}`,
    );
  } catch (e) {
    record("auth", "Invalid credentials safe JSON", false, String(e));
  }

  try {
    let hit429 = false;
    for (let i = 0; i < 11; i++) {
      const jar = new CookieJar();
      const csrf = await fetchCsrfAndJar(BASE, jar);
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: jar.header(),
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({ email: "ratelimit@nexa.test", password: "bad-password-xx" }),
      });
      if (res.status === 429) {
        hit429 = true;
        break;
      }
    }
    record("auth", "11th failed login returns 429", hit429, hit429 ? "" : "no 429 seen");
  } catch (e) {
    record("auth", "11th failed login returns 429", false, String(e));
  }

  // -------------------------------------------------------------------------
  // Data isolation
  // -------------------------------------------------------------------------
  try {
    const jarTc = await login(UAT_USERS.tc.email, UAT_PASSWORD);
    const r = await fetch(`${BASE}/api/transactions`, { headers: { Cookie: jarTc.header() } });
    const j = (await r.json()) as { transactions?: unknown[] };
    const ids = j.transactions ?? [];
    record(
      "data",
      "GET /api/transactions OK for TC",
      r.ok && ids.length > 0 && jsonContentType(r),
      `${ids.length} rows`,
    );

    const jarBuyer = await login(UAT_USERS.buyer.email, UAT_PASSWORD);
    const rb = await fetch(`${BASE}/api/transactions`, {
      headers: { Cookie: jarBuyer.header() },
    });
    const jb = (await rb.json()) as { transactions?: unknown[] };
    const buyerRows = jb.transactions ?? [];
    record(
      "data",
      "Buyer sees scoped transactions only",
      rb.ok && buyerRows.length >= 1 && buyerRows.length <= 2,
      `count ${buyerRows.length}`,
    );
  } catch (e) {
    record("data", "transactions isolation", false, String(e));
  }

  try {
    const jar = await login(UAT_USERS.mortgage.email, UAT_PASSWORD);
    const r = await fetch(`${BASE}/api/documents/${seed.isoDocumentId}`, {
      headers: { Cookie: jar.header() },
    });
    record(
      "data",
      "Mortgage cannot download isolation doc (403/404)",
      r.status === 403 || r.status === 404,
      `status ${r.status}`,
    );
  } catch (e) {
    record("data", "Doc isolation download", false, String(e));
  }

  // -------------------------------------------------------------------------
  // Core workflows
  // -------------------------------------------------------------------------
  try {
    const jar = await login(UAT_USERS.tc.email, UAT_PASSWORD);
    const csrf = await csrfForJar(jar);
    const r = await fetch(`${BASE}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: jar.header(),
        "x-csrf-token": csrf,
      },
      body: JSON.stringify({
        mls_number: `UAT-${Date.now()}`,
        property_address: "500 Automation Rd",
        transaction_type: "purchase",
        close_date: new Date().toISOString().slice(0, 10),
      }),
    });
    jar.captureFrom(r);
    record(
      "workflow",
      "POST /api/transactions",
      r.ok && jsonContentType(r),
      `status ${r.status}`,
    );
  } catch (e) {
    record("workflow", "POST /api/transactions", false, String(e));
  }

  try {
    const jar = await login(UAT_USERS.tc.email, UAT_PASSWORD);
    const csrf = await csrfForJar(jar);
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([200, 200]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    page.drawText("uat-upload", { x: 20, y: 170, size: 14, font });
    const bytes = Buffer.from(await pdf.save());

    const fd = new FormData();
    fd.set("transaction_id", UAT_TRANSACTION_ID);
    fd.set("category", "contract");
    fd.append(
      "file",
      new File([bytes], `uat-${Date.now()}.pdf`, { type: "application/pdf" }),
    );

    const r = await fetch(`${BASE}/api/documents`, {
      method: "POST",
      headers: {
        Cookie: jar.header(),
        "x-csrf-token": csrf,
      },
      body: fd,
    });
    jar.captureFrom(r);
    record(
      "workflow",
      "POST /api/documents multipart upload",
      r.ok && jsonContentType(r),
      `status ${r.status}`,
    );
  } catch (e) {
    record("workflow", "POST /api/documents", false, String(e));
  }

  try {
    const jar = await login(UAT_USERS.tc.email, UAT_PASSWORD);
    const csrf = await csrfForJar(jar);
    const r = await fetch(`${BASE}/api/checklist-items/${seed.checklistItemId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: jar.header(),
        "x-csrf-token": csrf,
      },
      body: JSON.stringify({ completed: true }),
    });
    jar.captureFrom(r);
    record(
      "workflow",
      "PATCH /api/checklist-items/[id]",
      r.ok && jsonContentType(r),
      `status ${r.status}`,
    );
  } catch (e) {
    record("workflow", "PATCH checklist-items", false, String(e));
  }

  try {
    const jar = await login(UAT_USERS.tc.email, UAT_PASSWORD);
    const csrf = await csrfForJar(jar);
    const post = await fetch(`${BASE}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: jar.header(),
        "x-csrf-token": csrf,
      },
      body: JSON.stringify({
        transaction_id: UAT_TRANSACTION_ID,
        body: `UAT ping ${Date.now()}`,
      }),
    });
    jar.captureFrom(post);
    const get = await fetch(
      `${BASE}/api/messages?transaction_id=${encodeURIComponent(UAT_TRANSACTION_ID)}`,
      { headers: { Cookie: jar.header() } },
    );
    record(
      "workflow",
      "POST+GET /api/messages",
      post.ok && get.ok && jsonContentType(get),
      `post ${post.status} get ${get.status}`,
    );
  } catch (e) {
    record("workflow", "messages", false, String(e));
  }

  for (const path of [
    "/api/transactions",
    "/api/csrf",
    "/api/messages?transaction_id=" + UAT_TRANSACTION_ID,
  ]) {
    try {
      const jar = await login(UAT_USERS.tc.email, UAT_PASSWORD);
      const u = `${BASE}${path}`;
      const res = await fetch(u, { headers: { Cookie: jar.header() } });
      const ctOk =
        (res.headers.get("content-type") ?? "").includes("application/json");
      record(
        "api",
        `Content-Type application/json ${path.split("?")[0]}`,
        ctOk,
        `status ${res.status}`,
      );
    } catch (e) {
      record("api", `content-type ${path}`, false, String(e));
    }
  }

  const failed = rows.filter((r) => !r.ok);
  const passed = rows.filter((r) => r.ok);

  console.log("\n=== NEXA UAT RESULTS ===\n");
  console.log(
    "| Area | Test | Pass | Detail |\n|------|------|------|--------|",
  );
  for (const row of rows) {
    const p = row.ok ? "PASS" : "FAIL";
    console.log(`| ${row.area} | ${row.name} | ${p} | ${row.detail ?? ""} |`);
  }
  console.log(`\nPassed: ${passed.length}  Failed: ${failed.length}\n`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
