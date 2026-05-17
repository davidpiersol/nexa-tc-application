import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, request, type FullConfig } from "@playwright/test";
import {
  UAT_PASSWORD,
  UAT_TRANSACTION_ID,
  UAT_USERS,
} from "../scripts/uat-constants";

/**
 * Wait for the dev server to respond to /login before any test logs in. This avoids
 * the "Email field never appeared" timeout when Playwright races a cold-starting
 * Next dev server.
 */
async function waitForServer(baseURL: string, timeoutMs = 60_000): Promise<void> {
  const client = await request.newContext();
  const deadline = Date.now() + timeoutMs;
  let lastErr: unknown;
  while (Date.now() < deadline) {
    try {
      const res = await client.get(`${baseURL}/login`, { timeout: 5_000 });
      if (res.ok()) {
        await client.dispose();
        return;
      }
      lastErr = new Error(`HTTP ${res.status()}`);
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  await client.dispose();
  throw new Error(
    `Dev server at ${baseURL} did not respond to /login within ${timeoutMs}ms: ${String(lastErr)}`,
  );
}

async function login(
  baseURL: string,
  email: string,
  urlMatch: RegExp,
  statePath: string,
  prewarmPaths: string[] = [],
): Promise<void> {
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ baseURL });
    const page = await ctx.newPage();

    await page.goto("/login", { waitUntil: "load", timeout: 60_000 });
    await page.getByLabel("Email").waitFor({ state: "visible", timeout: 30_000 });
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(UAT_PASSWORD);
    await page.getByRole("button", { name: /continue/i }).click();
    await page.waitForURL(urlMatch, { timeout: 60_000 });

    // Pre-warm common routes so dev-mode lazy-compile doesn't cost the first test
    // 30s while waiting for streamed content.
    for (const path of prewarmPaths) {
      await page.goto(path, { waitUntil: "load", timeout: 60_000 }).catch(() => undefined);
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);
    }

    await ctx.storageState({ path: statePath });
  } finally {
    await browser.close();
  }
}

export default async function globalSetup(config: FullConfig) {
  const dir = join(process.cwd(), "playwright", ".auth");
  mkdirSync(dir, { recursive: true });

  const baseURL =
    config.projects[0]?.use?.baseURL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    "http://localhost:3000";

  await waitForServer(baseURL);

  await login(
    baseURL,
    UAT_USERS.tc.email,
    /\/tc(\/|$)/,
    join(dir, "tc.json"),
    ["/tc", "/tc/transactions"],
  );

  await login(
    baseURL,
    UAT_USERS.buyer.email,
    /\/buyer\/[a-f0-9-]+/,
    join(dir, "buyer.json"),
  );

  await login(
    baseURL,
    UAT_USERS.agent.email,
    /\/agent(\/|$)/,
    join(dir, "agent.json"),
    ["/agent", `/agent/${UAT_TRANSACTION_ID}`],
  );
}
