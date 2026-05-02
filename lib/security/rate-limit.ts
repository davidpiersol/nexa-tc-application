import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function redis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redisClient = redis();

/** Login / signup: 10 requests / 15 min per IP */
export const loginRateLimit = redisClient
  ? new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(10, "15 m"),
      prefix: "nexa:ratelimit:login",
    })
  : null;

/** API routes: 100 requests / minute per key (user id or IP) */
export const apiRateLimit = redisClient
  ? new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      prefix: "nexa:ratelimit:api",
    })
  : null;

export async function limitOrThrow(
  limiter: Ratelimit | null,
  key: string,
): Promise<{ ok: boolean }> {
  if (!limiter) return { ok: true };
  const { success } = await limiter.limit(key);
  return { ok: success };
}
