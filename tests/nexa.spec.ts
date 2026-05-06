import { expect, test, type Page } from "@playwright/test";
import { UAT_TRANSACTION_ID } from "../scripts/uat-constants";

function attachConsoleCapture(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

test.describe("Guest · login", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login page renders and rejects bad password without crash", async ({ page }) => {
    const errs = attachConsoleCapture(page);
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await page.getByLabel("Email").fill("nobody@nexa.test");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });
    expect(errs.filter((e) => !e.includes("favicon"))).toEqual([]);
  });
});

test.describe("TC dashboard", () => {
  test.use({ storageState: "playwright/.auth/tc.json" });

  test("overview shows a transaction card for seeded property", async ({ page }) => {
    const errs = attachConsoleCapture(page);
    await page.goto("/tc");
    await expect(page.getByText(/Desert Willow/i)).toBeVisible({ timeout: 30_000 });
    expect(errs.filter((e) => !e.includes("favicon"))).toEqual([]);
  });

  test("transaction detail has Documents + First Pass actions", async ({ page }) => {
    const errs = attachConsoleCapture(page);
    await page.goto(`/tc/transactions/${UAT_TRANSACTION_ID}`);
    await expect(
      page.getByRole("link", { name: "Documents" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("link", { name: "First Pass" })).toBeVisible();
    expect(errs.filter((e) => !e.includes("favicon"))).toEqual([]);
  });

  test("help panel opens from floating button", async ({ page }) => {
    await page.goto("/tc");
    await page.getByRole("button", { name: /open help/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
  });

  test("no broken http(s) images on TC routes", async ({ page }) => {
    for (const path of ["/tc", `/tc/transactions/${UAT_TRANSACTION_ID}`]) {
      await page.goto(path);
      const srcs = await page.locator("img[src]").evaluateAll((els) =>
        els.map((e) => (e as HTMLImageElement).getAttribute("src")),
      );
      for (const src of srcs) {
        if (!src || src.startsWith("data:")) continue;
        const res = await page.request.get(src);
        expect(res.ok(), `img ${src} should load`).toBeTruthy();
      }
    }
  });
});

test.describe("Buyer timeline", () => {
  test.use({ storageState: "playwright/.auth/buyer.json" });

  test("buyer workspace renders timeline copy", async ({ page }) => {
    const errs = attachConsoleCapture(page);
    await page.goto(`/buyer/${UAT_TRANSACTION_ID}`);
    await expect(page.getByText(/Your home purchase/i)).toBeVisible({
      timeout: 30_000,
    });
    expect(errs.filter((e) => !e.includes("favicon"))).toEqual([]);
  });
});
