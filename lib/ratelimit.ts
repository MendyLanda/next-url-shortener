import { getStore } from "./store";

// Layered fixed-window limits: an attempt must pass EVERY tier. Owner sign-in is
// strictest (2/min, 5/hour, 10/day); per-link password guesses get 2× those.
// Counters live in the store (Redis or KV), so limits hold across all instances.
type Tier = { limit: number; window: number; prefix: string };

const MIN = 60;
const HOUR = 60 * 60;
const DAY = 60 * 60 * 24;

const loginTiers: Tier[] = [
  { limit: 2, window: MIN, prefix: "rl:login:m" },
  { limit: 5, window: HOUR, prefix: "rl:login:h" },
  { limit: 10, window: DAY, prefix: "rl:login:d" },
];

const unlockTiers: Tier[] = [
  { limit: 4, window: MIN, prefix: "rl:unlock:m" },
  { limit: 10, window: HOUR, prefix: "rl:unlock:h" },
  { limit: 20, window: DAY, prefix: "rl:unlock:d" },
];

async function allowAll(tiers: Tier[], id: string): Promise<boolean> {
  try {
    const store = await getStore();
    // Check tightest window first; stop on the first block so a burst doesn't
    // needlessly drain the wider tiers' budgets.
    for (const t of tiers) {
      const count = await store.incr(`${t.prefix}:${id}`, t.window);
      if (count > t.limit) return false;
    }
    return true;
  } catch {
    // Fail open if the store is unreachable — a blip shouldn't lock anyone out,
    // and a correct password is still required regardless.
    return true;
  }
}

export const allowLoginAttempt = (ip: string) => allowAll(loginTiers, ip);
export const allowUnlockAttempt = (ip: string, slug: string) =>
  allowAll(unlockTiers, `${ip}:${slug}`);
