import { Redis } from "ioredis";
import { type LinkRecord, type LinkWithMeta } from "../links";
import type { Store } from "./types";

// Same key layout as the Upstash backend so the two are wire-compatible: `links`
// holds slug -> LinkRecord JSON, `clicks` is a separate counter hash we can
// HINCRBY atomically for click limits.
const LINKS_KEY = "links";
const CLICKS_KEY = "clicks";

function parseRecord(raw: string): LinkRecord {
  // Tolerate a bare URL string (older data) by treating it as an un-gated link.
  try {
    return JSON.parse(raw) as LinkRecord;
  } catch {
    return { url: raw, createdAt: 0 };
  }
}

/**
 * Redis-over-TCP backend for self-hosted / container hosts (Railway, Render,
 * Fly, a plain VPS). Selected whenever `REDIS_URL` is set. Unlike Upstash this
 * speaks the binary protocol over a long-lived socket, which is ideal on a
 * persistent Node server but wrong for per-request serverless — hence it's only
 * picked on hosts that run `next start`.
 */
export class RedisStore implements Store {
  readonly kind = "redis" as const;

  // Lazily created so importing this module is harmless on hosts without a
  // REDIS_URL (e.g. Cloudflare), where it's never actually used.
  #redis?: Redis;

  private get redis(): Redis {
    if (!this.#redis) {
      this.#redis = new Redis(process.env.REDIS_URL ?? "", {
        // Railway's private network is IPv6-only; family 0 lets the DNS lookup
        // resolve both v6 (railway.internal) and v4 (a normal VPS/Render/Fly).
        family: 0,
        // Connect on first command, not on construct, so a bad/unreachable URL
        // doesn't throw at import time.
        lazyConnect: true,
        // Fail a request fast rather than hanging if Redis is down — the rate
        // limiter fails open on error, so this degrades gracefully.
        maxRetriesPerRequest: 3,
      });
    }
    return this.#redis;
  }

  async getLink(slug: string): Promise<LinkRecord | null> {
    const raw = await this.redis.hget(LINKS_KEY, slug);
    return raw == null ? null : parseRecord(raw);
  }

  async hasLink(slug: string): Promise<boolean> {
    return (await this.redis.hexists(LINKS_KEY, slug)) === 1;
  }

  async listLinks(): Promise<LinkWithMeta[]> {
    const [links, clicks] = await Promise.all([
      this.redis.hgetall(LINKS_KEY),
      this.redis.hgetall(CLICKS_KEY),
    ]);
    return Object.entries(links)
      .map(([slug, raw]) => {
        const rec = parseRecord(raw);
        return { slug, clicks: Number(clicks?.[slug] ?? 0), ...rec };
      })
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }

  async putLink(slug: string, rec: LinkRecord): Promise<void> {
    await this.redis.hset(LINKS_KEY, slug, JSON.stringify(rec));
  }

  async deleteLink(slug: string): Promise<void> {
    await Promise.all([
      this.redis.hdel(LINKS_KEY, slug),
      this.redis.hdel(CLICKS_KEY, slug),
    ]);
  }

  async getClicks(slug: string): Promise<number> {
    return Number((await this.redis.hget(CLICKS_KEY, slug)) ?? 0);
  }

  async setClicks(slug: string, n: number): Promise<void> {
    await this.redis.hset(CLICKS_KEY, slug, String(n));
  }

  async resetClicks(slug: string): Promise<void> {
    await this.redis.hdel(CLICKS_KEY, slug);
  }

  async consumeClick(slug: string, rec: LinkRecord): Promise<boolean> {
    const newCount = await this.redis.hincrby(CLICKS_KEY, slug, 1);
    if (rec.maxClicks && newCount > rec.maxClicks) {
      await this.redis.hincrby(CLICKS_KEY, slug, -1); // roll back, cap reached
      return false;
    }
    return true;
  }

  async incr(key: string, ttlSeconds: number): Promise<number> {
    const n = await this.redis.incr(key);
    if (n === 1) await this.redis.expire(key, ttlSeconds);
    return n;
  }

  async touch(): Promise<void> {
    await this.redis.set("__keepalive", new Date().toISOString());
  }
}
