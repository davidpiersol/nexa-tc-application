import { Redis } from "@upstash/redis";

function client(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = client();

const inviteKey = (jti: string) => `nexa:invite:${jti}`;

/** Returns false if key already exists (replay). */
export async function claimInviteJti(jti: string): Promise<boolean> {
  if (!redis) {
    console.warn("invite replay check skipped: Upstash not configured");
    return true;
  }
  const ok = await redis.set(inviteKey(jti), "1", { nx: true, ex: 72 * 3600 });
  return ok === "OK";
}

/** Undo claim when downstream signup fails (allows retry). */
export async function releaseInviteJti(jti: string): Promise<void> {
  if (!redis) return;
  await redis.del(inviteKey(jti));
}
