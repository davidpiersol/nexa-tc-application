/**
 * Minimal cookie jar for Node fetch → Next.js cookie sessions (CSRF + Supabase).
 */
export class CookieJar {
  private readonly map = new Map<string, string>();

  captureFrom(res: Response): void {
    const anyHeaders = res.headers as Headers & { getSetCookie?: () => string[] };
    const parts =
      typeof anyHeaders.getSetCookie === "function"
        ? anyHeaders.getSetCookie()
        : (res.headers.get("set-cookie")?.split(/,(?=\s*[^;=\s]+\=)/) ?? []);

    for (const line of parts) {
      if (!line?.trim()) continue;
      const first = line.split(";")[0]?.trim();
      const eq = first.indexOf("=");
      if (eq <= 0) continue;
      const name = first.slice(0, eq).trim();
      const value = first.slice(eq + 1).trim();
      if (name) this.map.set(name, value);
    }
  }

  header(): string {
    return [...this.map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

export async function fetchCsrfAndJar(
  baseUrl: string,
  jar: CookieJar,
): Promise<string> {
  const r = await fetch(`${baseUrl}/api/csrf`, { redirect: "manual" });
  jar.captureFrom(r);
  const j = (await r.json()) as { csrfToken?: string };
  if (!j.csrfToken) throw new Error("csrf_token_missing");
  return j.csrfToken;
}
