import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// Throttle login attempts per IP: 5 tries per minute (sliding window).
// Shared across serverless instances because the counter lives in Redis.
const loginRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "ratelimit:login",
  analytics: false,
});

/**
 * Returns true if this IP is allowed another login attempt.
 * Fails open if Redis is unreachable — a blip shouldn't lock the owner out,
 * and a correct password is still required regardless.
 */
export async function allowLoginAttempt(ip: string): Promise<boolean> {
  try {
    const { success } = await loginRatelimit.limit(ip);
    return success;
  } catch {
    return true;
  }
}
