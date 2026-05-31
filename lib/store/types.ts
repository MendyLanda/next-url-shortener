import type { LinkRecord, LinkWithMeta } from "../links";

export type StoreKind = "cloudflare-kv" | "upstash" | "redis";

/**
 * Storage backend contract. Cut talks to this interface only, so the same app
 * runs on any host with a native store:
 *   - Cloudflare Workers       → native KV           (lib/store/cloudflare-kv.ts)
 *   - Vercel / Node            → Upstash Redis (REST) (lib/store/upstash.ts)
 *   - Railway / Render / Fly   → Redis over TCP       (lib/store/redis.ts)
 *
 * Two operations are inherently backend-sensitive:
 *   - `consumeClick` is exact (atomic) on Redis; best-effort on KV (no atomic
 *     increment), so click caps may be off by a hair under heavy concurrency.
 *   - `incr` powers rate limiting; same atomicity caveat on KV.
 */
export interface Store {
  /**
   * Which backend this is. `cloudflare-kv` is eventually consistent, so the
   * admin UI warns that a just-made change may take a moment to appear.
   */
  readonly kind: StoreKind;

  getLink(slug: string): Promise<LinkRecord | null>;
  hasLink(slug: string): Promise<boolean>;
  listLinks(): Promise<LinkWithMeta[]>;
  putLink(slug: string, rec: LinkRecord): Promise<void>;
  /** Removes the link record and its click counter together. */
  deleteLink(slug: string): Promise<void>;

  getClicks(slug: string): Promise<number>;
  setClicks(slug: string, n: number): Promise<void>;
  resetClicks(slug: string): Promise<void>;
  /** Counts a click, rejecting (returns false) if it would exceed maxClicks. */
  consumeClick(slug: string, rec: LinkRecord): Promise<boolean>;

  /**
   * Increments a counter and returns the new value, setting a TTL on first hit.
   * Used by the rate limiter. Window is always >= 60s (KV's minimum TTL).
   */
  incr(key: string, ttlSeconds: number): Promise<number>;

  /**
   * A real write used to keep idle Upstash free databases from being archived.
   * No-op-ish elsewhere (Cloudflare KV doesn't archive on inactivity).
   */
  touch(): Promise<void>;
}
