/**
 * POST /api/auth/login as seeded TC — verifies CSRF + Supabase Auth after dev boot.
 */
import { UAT_PASSWORD, UAT_USERS } from "./uat-constants";
import { CookieJar, fetchCsrfAndJar } from "./http-session";

const BASE = (
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

async function main() {
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
    body: JSON.stringify({
      email: UAT_USERS.tc.email,
      password: UAT_PASSWORD,
    }),
  });
  if (!loginRes.ok) {
    const body = await loginRes.text();
    console.error(`[smoke-login] failed ${loginRes.status}: ${body}`);
    process.exit(1);
  }
  console.log("[smoke-login] ok", UAT_USERS.tc.email);
}

main().catch((e) => {
  console.error("[smoke-login]", e);
  process.exit(1);
});
