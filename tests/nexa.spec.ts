import { expect, test } from "@playwright/test";
import { UAT_TRANSACTION_ID } from "../scripts/uat-constants";
import {
  attachConsoleCapture,
  firstTransactionId,
  gotoApp,
} from "./test-helpers";

test.describe("Guest · login", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("signup page explains Yahoo is not a built-in OAuth provider", async ({ page }) => {
    await gotoApp(page, "/signup");
    await expect(page.getByText(/Yahoo Mail is not offered/i)).toBeVisible();
  });

  test("login page renders and rejects bad password without crash", async ({ page }) => {
    const errs = attachConsoleCapture(page);
    await gotoApp(page, "/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await page.getByLabel("Email").fill("nobody@nexa.test");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });
    expect(errs).toEqual([]);
  });
});

test.describe("TC dashboard", () => {
  test.use({ storageState: "playwright/.auth/tc.json" });

  test("overview shows a transaction card for seeded property", async ({ page }) => {
    const errs = attachConsoleCapture(page);
    await gotoApp(page, "/tc");
    await expect(page.getByText(/Desert Willow/i).first()).toBeVisible({
      timeout: 30_000,
    });
    expect(errs).toEqual([]);
  });

  test("transactions API exposes the seeded transactions", async ({ page }) => {
    const id = await firstTransactionId(page);
    expect(id).toMatch(/^[a-f0-9-]{36}$/);
  });

  test("transaction detail has Documents + First Pass actions", async ({ page }) => {
    const errs = attachConsoleCapture(page);
    const id = await firstTransactionId(page);
    await gotoApp(page, `/tc/transactions/${id}`);
    await expect(
      page.getByRole("link", { name: "Documents" }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("link", { name: "First Pass" }).first(),
    ).toBeVisible();
    expect(errs).toEqual([]);
  });

  test("transaction list address link opens detail", async ({ page }) => {
    await gotoApp(page, "/tc/transactions");
    const firstAddressLink = page
      .locator('ul li a[href^="/tc/transactions/"]')
      .filter({ hasNotText: /^Open$/ })
      .filter({ hasNot: page.locator('a[href$="/new"]') })
      .first();
    await expect(firstAddressLink).toBeVisible({ timeout: 30_000 });
    const href = await firstAddressLink.getAttribute("href");
    expect(href).toMatch(/^\/tc\/transactions\/[a-f0-9-]+$/);
    await firstAddressLink.click();
    await expect(page).toHaveURL(/\/tc\/transactions\/[a-f0-9-]+$/, {
      timeout: 30_000,
    });
  });

  test("help panel opens from floating button", async ({ page }) => {
    await gotoApp(page, "/tc");
    await page.getByRole("button", { name: /open help/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
  });

  test("party and document rows open dedicated detail pages", async ({ page }) => {
    const id = await firstTransactionId(page);
    await gotoApp(page, `/tc/transactions/${id}`);

    const firstPartyLink = page
      .locator('a[href^="/tc/transactions/"][href*="/parties/"]')
      .first();
    await expect(firstPartyLink).toBeVisible({ timeout: 30_000 });
    await firstPartyLink.click();
    await expect(page).toHaveURL(new RegExp(`/tc/transactions/${id}/parties/[a-f0-9-]+$`));

    await page.getByRole("link", { name: "Transaction detail", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/tc/transactions/${id}$`));

    const firstDocLink = page
      .locator('a[href^="/tc/transactions/"][href*="/documents/"]')
      .first();
    await expect(firstDocLink).toBeVisible({ timeout: 30_000 });
    await firstDocLink.click();
    await expect(page).toHaveURL(new RegExp(`/tc/transactions/${id}/documents/[a-f0-9-]+$`));
  });

  test("documents page supports card/list, search, sort, and detail actions", async ({ page }) => {
    const id = await firstTransactionId(page);
    await gotoApp(page, `/tc/transactions/${id}/documents`);

    await page.getByRole("button", { name: "List view" }).click();
    await page.getByPlaceholder("Search file, category, status").fill("zzzz-no-match");
    await expect(page.getByText(/No documents match your current filters/i)).toBeVisible();
    await page.getByPlaceholder("Search file, category, status").fill("");
    await page.locator("#tc-doc-sort").selectOption("name_asc");

    const firstDetailLink = page.locator(`a[href^="/tc/transactions/${id}/documents/"]`).first();
    await expect(firstDetailLink).toBeVisible({ timeout: 30_000 });
    await firstDetailLink.click();

    await expect(page).toHaveURL(new RegExp(`/tc/transactions/${id}/documents/[a-f0-9-]+$`));
    await expect(page.getByRole("button", { name: "Download document" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Upload revised document" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete document" })).toBeVisible();
  });

  test("transaction workspace nav switches between detail pages", async ({ page }) => {
    const id = await firstTransactionId(page);
    await gotoApp(page, `/tc/transactions/${id}/documents`);

    const docsNavLink = page.getByRole("link", { name: "Documents" }).first();
    await expect(docsNavLink).toHaveClass(/bg-brand-gold/);

    await page.getByRole("link", { name: "Transaction detail", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/tc/transactions/${id}$`));

    await page.getByRole("link", { name: "First Pass" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/tc/transactions/${id}/first-pass$`));
    await expect(page.getByRole("link", { name: "First Pass" }).first()).toHaveClass(
      /bg-brand-gold/,
    );

    await page.getByRole("link", { name: "Edit transaction details" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/tc/transactions/${id}/edit$`));
    await expect(
      page.getByRole("link", { name: "Edit transaction details" }).first(),
    ).toHaveClass(/bg-brand-gold/);

    await page.getByRole("link", { name: "Back to transactions" }).click();
    await expect(page).toHaveURL(/\/tc\/transactions$/);
  });

  test("close + archive workflow hides transaction from default list", async ({ page }) => {
    const marker = `Archive QA ${Date.now()}`;
    await gotoApp(page, "/tc/transactions/new");
    await page.getByLabel("Property address").fill(marker);
    await page.getByRole("button", { name: "Create transaction" }).click();
    await expect(page).toHaveURL(/\/tc\/transactions\/[a-f0-9-]+$/);
    const detailUrl = page.url();
    const id = detailUrl.split("/").at(-1);
    expect(id).toBeTruthy();

    await page.getByRole("link", { name: "Edit transaction details" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/tc/transactions/${id}/edit$`));
    await page.locator('select[name="status"]').selectOption("closed");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(/Saved\./i)).toBeVisible({ timeout: 15_000 });

    await page.getByRole("link", { name: "Transaction detail", exact: true }).click();
    await expect(page.getByRole("button", { name: "Archive transaction" })).toBeVisible();
    await page.getByRole("button", { name: "Archive transaction" }).click();
    await expect(page).toHaveURL(/\/tc\/archive$/);

    await gotoApp(page, "/tc/transactions");
    await expect(page.getByText(marker)).toHaveCount(0);

    await gotoApp(page, "/tc/archive");
    await expect(page.getByText(marker)).toBeVisible({ timeout: 15_000 });
  });

  test("no broken http(s) images on TC overview", async ({ page }) => {
    await gotoApp(page, "/tc");
    const srcs = await page.locator("img[src]").evaluateAll((els) =>
      els.map((e) => (e as HTMLImageElement).getAttribute("src")),
    );
    for (const src of srcs) {
      if (!src || src.startsWith("data:")) continue;
      const res = await page.request.get(src);
      expect(res.ok(), `img ${src} should load`).toBeTruthy();
    }
  });
});

test.describe("Buyer timeline", () => {
  test.use({ storageState: "playwright/.auth/buyer.json" });

  test("buyer workspace renders timeline copy", async ({ page }) => {
    const errs = attachConsoleCapture(page);
    await gotoApp(page, `/buyer/${UAT_TRANSACTION_ID}`);
    await expect(page.getByText(/Your home purchase/i)).toBeVisible({
      timeout: 30_000,
    });
    expect(errs).toEqual([]);
  });
});
