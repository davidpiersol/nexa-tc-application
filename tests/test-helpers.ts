import type { Page } from "@playwright/test";

/**
 * Console-error patterns we already know about and intentionally ignore in browser
 * smoke. These are pre-existing application/runtime issues whose fixes are tracked
 * outside the test harness — keeping them filtered here lets the smoke focus on
 * regressions in actual user flows instead of failing on known noise.
 *
 * If you find yourself adding a new entry, also file a follow-up so we don't lose
 * sight of the underlying issue.
 */
const KNOWN_CONSOLE_NOISE: RegExp[] = [
  /favicon/i,
];

export function isKnownConsoleNoise(text: string): boolean {
  return KNOWN_CONSOLE_NOISE.some((re) => re.test(text));
}

/**
 * Capture only console errors / page errors that aren't on the known-noise list.
 * Use the returned array in test assertions: `expect(errs).toEqual([])`.
 */
export function attachConsoleCapture(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (isKnownConsoleNoise(text)) return;
    errors.push(text);
  });
  page.on("pageerror", (err) => {
    const text = String(err);
    if (isKnownConsoleNoise(text)) return;
    errors.push(text);
  });
  return errors;
}

/**
 * Wait for the RSC stream + client hydration to settle. `domcontentloaded` fires
 * before streamed content arrives, which produces flaky waits on TC routes that
 * suspend (loading.tsx) while server queries run.
 */
export async function gotoApp(
  page: Page,
  path: string,
  opts: { timeoutMs?: number } = {},
): Promise<void> {
  const timeout = opts.timeoutMs ?? 60_000;
  await page.goto(path, { waitUntil: "load", timeout });
  // networkidle catches the final RSC payload + cookie refresh round-trip.
  await page.waitForLoadState("networkidle", { timeout }).catch(() => undefined);
}

/**
 * Read the first transaction id available to the active session via the JSON API.
 * Tests use this instead of hardcoding seeded UAT ids so seeds can evolve without
 * silently breaking smoke.
 */
export async function firstTransactionId(page: Page): Promise<string> {
  const res = await page.request.get("/api/transactions");
  if (!res.ok()) {
    throw new Error(`GET /api/transactions failed: ${res.status()}`);
  }
  const body = (await res.json()) as { transactions?: Array<{ id?: string }> };
  const id = body.transactions?.[0]?.id;
  if (!id) {
    throw new Error("No transactions visible to current session — reseed UAT data");
  }
  return id;
}
