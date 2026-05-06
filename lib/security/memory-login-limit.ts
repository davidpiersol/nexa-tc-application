/**
 * Process-local sliding-window limit when Upstash Redis is not configured.
 * Used so login rate-limit UAT passes without cloud Redis (never sufficient for multi-instance prod).
 */
const buckets = new Map<string, number[]>();

export function memoryLoginAttemptAllowed(ip: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (buckets.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    buckets.set(ip, arr);
    return false;
  }
  arr.push(now);
  buckets.set(ip, arr);
  return true;
}
