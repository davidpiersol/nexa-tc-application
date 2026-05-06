import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, type FullConfig } from "@playwright/test";
import {
  UAT_PASSWORD,
  UAT_TRANSACTION_ID,
  UAT_USERS,
} from "../scripts/uat-constants";

async function login(
  baseURL: string,
  email: string,
  urlMatch: RegExp,
  statePath: string,
): Promise<void> {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ baseURL });
  const page = await ctx.newPage();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(UAT_PASSWORD);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.waitForURL(urlMatch, { timeout: 45_000 });

  await ctx.storageState({ path: statePath });
  await browser.close();
}

export default async function globalSetup(config: FullConfig) {
  const dir = join(process.cwd(), "playwright", ".auth");
  mkdirSync(dir, { recursive: true });

  const baseURL =
    config.projects[0]?.use?.baseURL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    "http://localhost:3000";

  await login(
    baseURL,
    UAT_USERS.tc.email,
    /\/tc(\/|$)/,
    join(dir, "tc.json"),
  );
  await login(
    baseURL,
    UAT_USERS.buyer.email,
    new RegExp(`/buyer/${UAT_TRANSACTION_ID}`),
    join(dir, "buyer.json"),
  );
}
