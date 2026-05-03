/**
 * Fetch wrapper: exponential backoff on **429** and **5xx** (max **3** retries after first attempt).
 */

async function delay(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

const DEFAULT_MAX_RETRIES = 3;

export type FetchWithRetryOptions = {
  maxRetries?: number;
  /** Called before each retry (attempt is 1-based after initial failure). */
  onRetry?: (info: { attempt: number; status: number; url: string }) => void;
};

export async function fetchWithRetry(
  url: string | URL,
  init: RequestInit,
  opts?: FetchWithRetryOptions,
): Promise<Response> {
  const maxRetries = opts?.maxRetries ?? DEFAULT_MAX_RETRIES;
  let lastResponse: Response | undefined;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, init);
      lastResponse = res;
      if (res.status === 429 || res.status >= 500) {
        if (attempt < maxRetries) {
          opts?.onRetry?.({
            attempt: attempt + 1,
            status: res.status,
            url: String(url),
          });
          await delay(Math.pow(2, attempt) * 250);
          continue;
        }
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt < maxRetries) {
        opts?.onRetry?.({
          attempt: attempt + 1,
          status: 0,
          url: String(url),
        });
        await delay(Math.pow(2, attempt) * 250);
        continue;
      }
      throw e;
    }
  }

  if (lastResponse) return lastResponse;
  throw lastErr ?? new Error("fetch_with_retry_failed");
}
