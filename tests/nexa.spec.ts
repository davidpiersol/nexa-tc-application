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
    await expect(page.getByText("Operations center")).toBeVisible();
    await expect(page.getByText("Scorecard setup blocked")).toBeVisible();
    await expect(page.getByText("AI pass").first()).toBeVisible();
    expect(errs).toEqual([]);
  });

  test("transactions API exposes the seeded transactions", async ({ page }) => {
    const id = await firstTransactionId(page);
    expect(id).toMatch(/^[a-f0-9-]{36}$/);
  });

  test("transaction detail has Documents + First Pass actions", async ({ page }) => {
    const errs = attachConsoleCapture(page);
    const id = UAT_TRANSACTION_ID;
    await gotoApp(page, `/tc/transactions/${id}`);
    await expect(
      page.getByRole("link", { name: "Documents" }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("link", { name: "First Pass" }).first(),
    ).toBeVisible();
    await expect(page.getByText("AI pass").first()).toBeVisible();
    await expect(page.getByText("Human pass").first()).toBeVisible();
    expect(errs).toEqual([]);
  });

  test("scorecard page keeps blocked operational placeholder visible", async ({ page }) => {
    const errs = attachConsoleCapture(page);
    await gotoApp(page, "/tc/scorecard");
    await expect(page.getByRole("heading", { level: 2, name: "Scorecard" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/scorecard task definitions have not been supplied/i)).toBeVisible();
    await expect(page.getByText("Slack", { exact: true })).toBeVisible();
    await expect(page.getByText("Microsoft Outlook / Calendar", { exact: true })).toBeVisible();
    expect(errs).toEqual([]);
  });

  test("CRM page shows disabled external CRM scaffolding", async ({ page }) => {
    const errs = attachConsoleCapture(page);
    await gotoApp(page, "/tc/crm");
    await expect(page.getByRole("heading", { level: 2, name: "CRM" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("DeltaNET / Delta Media Group")).toBeVisible();
    await expect(page.getByText("Lofty")).toBeVisible();
    await expect(page.getByText("Follow Up Boss")).toBeVisible();
    await expect(page.getByText("MoxiWorks")).toBeVisible();
    await expect(page.getByText(/no provider sync is active/i)).toBeVisible();
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
    const id = UAT_TRANSACTION_ID;
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
    const id = UAT_TRANSACTION_ID;
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

  test("documents page generates a filled PDF from a mapped template", async ({ page }) => {
    const id = UAT_TRANSACTION_ID;
    await gotoApp(page, `/tc/transactions/${id}/documents`);

    const generateButton = page.getByRole("button", { name: "Generate filled PDF" }).first();
    await expect(generateButton).toBeEnabled({ timeout: 30_000 });
    await generateButton.click();

    await page.getByPlaceholder("Search file, category, status").fill("NMAR-2104");
    await expect(page.getByText(/NMAR-2104[.]pdf/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("transaction workspace nav switches between detail pages", async ({ page }) => {
    const id = UAT_TRANSACTION_ID;
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

    await page.getByRole("link", { name: "Assign Vendors" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/tc/transactions/${id}/vendors$`));
    await expect(page.getByRole("link", { name: "Assign Vendors" }).first()).toHaveClass(
      /bg-brand-gold/,
    );

    await page.getByRole("link", { name: "Back to transactions" }).click();
    await expect(page).toHaveURL(/\/tc\/transactions$/);
  });

  test("assign and remove vendor from transaction", async ({ page }) => {
    const id = UAT_TRANSACTION_ID;
    const note = `QA vendor assignment ${Date.now()}`;
    await gotoApp(page, `/tc/transactions/${id}/vendors`);

    await page.getByRole("combobox", { name: /^Contact/ }).selectOption({ index: 1 });
    await page.getByRole("combobox", { name: "Assignment role" }).selectOption("other");
    await page.getByRole("combobox", { name: "Category context (optional)" }).selectOption("other");
    await page.getByLabel("Notes (optional)").fill(note);
    await page.getByRole("button", { name: "Assign vendor" }).click();

    await expect(page.getByText(`Notes · ${note}`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Category context · Other/i).first()).toBeVisible();

    await page.getByRole("link", { name: "Transaction detail", exact: true }).click();
    await expect(page.getByText(/Assigned service providers/i)).toBeVisible();
    await expect(page.getByText(/Category context · Other/i).first()).toBeVisible();

    await page.getByRole("link", { name: "Assign Vendors" }).first().click();
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .locator("li")
      .filter({ hasText: `Notes · ${note}` })
      .getByRole("button", { name: "Remove" })
      .click();
    await expect(page.getByText(`Notes · ${note}`)).toHaveCount(0);
  });

  test("contacts and brokers foundation pages render", async ({ page }) => {
    await gotoApp(page, "/tc/contacts");
    await expect(page).toHaveURL(/\/tc\/contacts$/);
    await expect(page.getByRole("heading", { level: 2, name: "Contacts" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("link", { name: "Add contacts" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();

    await gotoApp(page, "/tc/brokers");
    await expect(page).toHaveURL(/\/tc\/brokers$/);
    await expect(page.getByRole("heading", { level: 2, name: "Brokers" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("link", { name: "Add broker" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
  });

  test("contact delete preserves transaction snapshot and removes lookup", async ({ page }) => {
    const marker = `QA Contact ${Date.now()}`;
    await gotoApp(page, "/tc/contacts/new");
    await page.getByLabel("First name").fill("QA");
    await page.getByLabel("Last name").fill(marker);
    await page.getByLabel("Email").fill(`qa.contact.${Date.now()}@nexa.test`);
    await page.getByLabel("City").fill("Albuquerque");
    await page.getByRole("checkbox", { name: "Client" }).check();
    await page.getByRole("button", { name: "Create contact" }).click();
    await expect(page).toHaveURL(/\/tc\/contacts\/[a-f0-9-]+$/);
    const contactDetailUrl = page.url();
    const contactDetailPath = new URL(contactDetailUrl).pathname;

    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("City").fill("Santa Fe");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Santa Fe")).toBeVisible();

    const txId = UAT_TRANSACTION_ID;
    await gotoApp(page, `/tc/transactions/${txId}/edit`);
    await page.getByLabel("Seller name(s)").fill(`QA ${marker}`);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(/Saved\./i)).toBeVisible({ timeout: 15_000 });

    const deletedName = `QA ${marker}`;
    await gotoApp(page, contactDetailPath);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(/\/tc\/contacts$/);
    await expect(page.getByText(marker)).toHaveCount(0);

    await gotoApp(page, `/tc/transactions/${txId}/edit`);
    await expect(page.getByLabel("Seller name(s)")).toHaveValue(deletedName);
    await expect(
      page.locator(`#contact-options-all option[value="${deletedName}"]`),
    ).toHaveCount(0);

    await gotoApp(page, `/tc/transactions/${txId}`);
    await expect(page).toHaveURL(new RegExp(`/tc/transactions/${txId}$`));
    await expect(page.getByRole("heading", { level: 3, name: "Documents" })).toBeVisible();
  });

  test("broker create flow works", async ({ page }) => {
    await gotoApp(page, "/tc/brokers/new");
    await page.getByLabel("First name").fill("Broker");
    await page.getByLabel("Last name").fill(`QA ${Date.now()}`);
    await page.getByLabel("E-sign provider").selectOption("docusign_api");
    await page.getByRole("combobox", { name: "Brokerage" }).selectOption("Other");
    await page.getByLabel("Brokerage (other)").fill("QA Brokerage");
    await page.getByRole("button", { name: "Create broker" }).click();
    await expect(page).toHaveURL(/\/tc\/brokers\/[a-f0-9-]+$/);
    await expect(page.getByRole("heading", { level: 2, name: "Broker Profile" })).toBeVisible();
  });

  test("MLS-only entry workspace renders without MLS write integration", async ({ page }) => {
    const errs = attachConsoleCapture(page);
    const marker = `MLS QA ${Date.now()}`;
    await gotoApp(page, "/tc/mls-entry");
    await expect(page.getByRole("heading", { level: 2, name: "MLS entry jobs" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/No MLS write integration is enabled/i)).toBeVisible();
    await page.getByRole("link", { name: "Research notes" }).click();
    await expect(page).toHaveURL(/\/tc\/mls-entry\/research$/);
    await expect(page.getByText(/Do not implement MLS write submission yet/i)).toBeVisible();

    await gotoApp(page, "/tc/mls-entry/new");
    await expect(page.getByRole("heading", { level: 2, name: "New MLS entry job" })).toBeVisible();
    await expect(page.getByLabel("Requesting broker")).toBeVisible();
    await expect(page.getByLabel("Property address")).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Property type" })).toBeVisible();
    await expect(page.getByLabel("General notes")).toBeVisible();

    await page.getByLabel("Requesting broker").fill("Angela QA");
    await page.getByLabel("Property address").fill(marker);
    await page.getByRole("combobox", { name: "Property type" }).selectOption("Vacant Land");
    await page.getByLabel("General notes").fill("MLS-only smoke job; no write integration.");
    await page.getByRole("button", { name: "Create MLS entry job" }).click();
    await expect(page).toHaveURL(/\/tc\/mls-entry$/);
    await expect(page.getByText(marker)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/MLS-only/i).first()).toBeVisible();
    expect(errs).toEqual([]);
  });

  test("billing workspace creates an invoice without accounting sync", async ({ page }) => {
    const errs = attachConsoleCapture(page);
    const marker = `Billing QA ${Date.now()}`;
    await gotoApp(page, "/tc/billing");
    await expect(page.getByRole("heading", { level: 2, name: "Billing" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Accounting sync is scaffolded/i)).toBeVisible();
    await page.getByLabel("Broker / client to invoice").fill(marker);
    await page.getByLabel("Description").fill("MLS-only entry smoke invoice");
    await page.getByLabel("Quantity").fill("1");
    await page.getByLabel("Unit amount").fill("250.00");
    await page.getByRole("button", { name: "Create invoice" }).click();
    await expect(page).toHaveURL(/\/tc\/billing\/[a-f0-9-]+$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /CP-/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /edit/i })).toHaveAttribute("href", /\/tc\/billing\/[a-f0-9-]+\/edit$/);
    await expect(page.getByRole("link", { name: /download pdf/i })).toHaveAttribute(
      "href",
      /\/api\/billing\/invoices\/[a-f0-9-]+\/pdf$/,
    );
    await expect(page.getByRole("link", { name: /preview invoice/i })).toHaveAttribute(
      "href",
      /\/tc\/billing\/print\?ids=[a-f0-9-]+$/,
    );
    await gotoApp(page, "/tc/billing/invoices");
    await expect(page.getByRole("heading", { level: 2, name: "Invoices" })).toBeVisible();
    await page.getByPlaceholder("Broker, invoice, status, source, amount").fill(marker);
    await expect(page.getByText(marker)).toBeVisible({ timeout: 15_000 });
    await page.getByRole("combobox", { name: "Sort" }).selectOption("total_desc");
    await expect(page.getByText("$271.06").first()).toBeVisible();
    await expect(page.getByText(/Sync: not configured/i).first()).toBeVisible();
    await page.locator("li", { hasText: marker }).getByRole("link").first().click();
    await expect(page).toHaveURL(/\/tc\/billing\/[a-f0-9-]+$/);
    await expect(page.getByRole("heading", { name: /CP-/ })).toBeVisible();
    await expect(page.getByText(/Payable upon receipt/i)).toBeVisible();
    await gotoApp(page, "/tc/billing/invoices");
    await page.getByRole("checkbox", { name: /select all invoices/i }).check();
    const printLink = page.getByRole("link", { name: /print selected/i });
    await expect(printLink).toHaveAttribute("href", /\/tc\/billing\/print\?ids=/);
    await expect(page.getByRole("link", { name: /email selected/i })).toHaveAttribute("href", /^mailto:/);
    await gotoApp(page, "/tc/reports");
    await expect(page.getByRole("heading", { level: 2, name: "Reports" })).toBeVisible();
    await page.getByRole("link", { name: /Billing collections/i }).click();
    await expect(page).toHaveURL(/\/tc\/reports\/billing/);
    await expect(page.getByRole("heading", { level: 2, name: "Billing report" })).toBeVisible();
    await expect(page.getByText(/Total billed/i)).toBeVisible();
    await expect(page.getByText("Taxes on received", { exact: true })).toBeVisible();
    await expect(page.getByText(marker)).toBeVisible();
    expect(errs).toEqual([]);
  });

  test("document delete removes row without breaking transaction", async ({ page }) => {
    const id = UAT_TRANSACTION_ID;
    await gotoApp(page, `/tc/transactions/${id}/documents`);

    const firstDetailLink = page.locator(`a[href^="/tc/transactions/${id}/documents/"]`).first();
    await expect(firstDetailLink).toBeVisible({ timeout: 30_000 });
    const href = await firstDetailLink.getAttribute("href");
    expect(href).toMatch(new RegExp(`/tc/transactions/${id}/documents/[a-f0-9-]+$`));
    const documentId = href?.split("/").at(-1);
    expect(documentId).toBeTruthy();

    await firstDetailLink.click();
    await expect(page).toHaveURL(new RegExp(`/tc/transactions/${id}/documents/[a-f0-9-]+$`));
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete document" }).click();
    await expect(page).toHaveURL(new RegExp(`/tc/transactions/${id}/documents$`));
    await expect(page.locator(`a[href$="/${documentId}"]`)).toHaveCount(0);

    await gotoApp(page, `/tc/transactions/${id}`);
    await expect(page).toHaveURL(new RegExp(`/tc/transactions/${id}$`));
    await expect(page.getByRole("heading", { level: 3, name: "Documents" })).toBeVisible();
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

test.describe("Broker dashboard", () => {
  test.use({ storageState: "playwright/.auth/agent.json" });

  test("broker hub renders assigned-transactions workspace without console errors", async ({
    page,
  }) => {
    const errs = attachConsoleCapture(page);
    await gotoApp(page, "/agent");
    await expect(page.getByText(/Broker workspace/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", { name: /Assigned transactions/i }),
    ).toBeVisible();
    expect(errs).toEqual([]);
  });

  test("broker transaction workspace shows client-visible documents section", async ({
    page,
  }) => {
    const errs = attachConsoleCapture(page);
    await gotoApp(page, `/agent/${UAT_TRANSACTION_ID}`);
    await expect(page.getByText(/Client-visible documents/i)).toBeVisible({
      timeout: 30_000,
    });
    expect(errs).toEqual([]);
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

  test("buyer cannot delete contacts (forbidden)", async ({ page }) => {
    const csrfRes = await page.request.get("/api/csrf");
    expect(csrfRes.ok()).toBeTruthy();
    const csrf = (await csrfRes.json()) as { csrfToken?: string };
    expect(csrf.csrfToken).toBeTruthy();

    const res = await page.request.delete("/api/contacts/00000000-0000-4000-8000-000000000000", {
      headers: { "x-csrf-token": csrf.csrfToken ?? "" },
    });
    expect(res.status()).toBe(403);
  });
});
