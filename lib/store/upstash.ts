import { Redis } from "@upstash/redis";
import { type LinkRecord, type LinkWithMeta } from "../links";
import type { Store } from "./types";

// `links` holds slug -> LinkRecord (stored as JSON; @upstash/redis serializes
// objects automatically). `clicks` is a separate counter hash so we can
// HINCRBY atomically for click limits.
const LINKS_KEY = "links";
const CLICKS_KEY = "clicks";

function parseRecord(raw: LinkRecord | string): LinkRecord {
  // Older versions stored a bare URL string; treat those as un-gated links.
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as LinkRecord;
    } catch {
      return { url: raw, createdAt: 0 };
    }
  }
  return raw;
}

/** Upstash Redis backend (Vercel Marketplace, or any Upstash REST database). */
export class UpstashStore implements Store {
  // Lazily created so this module is harmless to import on hosts without
  // Upstash env vars (e.g. Cloudflare), where it's never actually used.
  #redis?: Redis;

  private get redis(): Redis {
    if (!this.#redis) {
      // The Upstash integration injects UPSTASH_REDIS_REST_*; we also accept the
      // legacy KV_REST_API_* names in case the store was connected under the
      // older Vercel KV slug.
      this.#redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "",
        token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "",
      });
    }
    return this.#redis;
  }

  async getLink(slug: string): Promise<LinkRecord | null> {
    const raw = await this.redis.hget<LinkRecord | string>(LINKS_KEY, slug);
    return raw == null ? null : parseRecord(raw);
  }

  async hasLink(slug: string): Promise<boolean> {
    return (await this.redis.hexists(LINKS_KEY, slug)) === 1;
  }

  async listLinks(): Promise<LinkWithMeta[]> {
    const [links, clicks] = await Promise.all([
      this.redis.hgetall<Record<string, LinkRecord | string>>(LINKS_KEY),
      this.redis.hgetall<Record<string, number>>(CLICKS_KEY),
    ]);
    if (!links) return [];
    return Object.entries(links)
      .map(([slug, raw]) => {
        const rec = parseRecord(raw);
        return { slug, clicks: Number(clicks?.[slug] ?? 0), ...rec };
      })
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }

  async putLink(slug: string, rec: LinkRecord): Promise<void> {
    await this.redis.hset(LINKS_KEY, { [slug]: rec });
  }

  async deleteLink(slug: string): Promise<void> {
    await Promise.all([
      this.redis.hdel(LINKS_KEY, slug),
      this.redis.hdel(CLICKS_KEY, slug),
    ]);
  }

  async getClicks(slug: string): Promise<number> {
    return Number((await this.redis.hget<number>(CLICKS_KEY, slug)) ?? 0);
  }

  async setClicks(slug: string, n: number): Promise<void> {
    await this.redis.hset(CLICKS_KEY, { [slug]: n });
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
