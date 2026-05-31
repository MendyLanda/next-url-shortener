import { type LinkRecord, type LinkWithMeta } from "../links";
import type { Store } from "./types";

// Minimal structural type for a Cloudflare KV namespace — just the bits we use.
// Avoids a hard dependency on @cloudflare/workers-types.
export interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: {
    prefix?: string;
    cursor?: string;
  }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>;
}

// One namespace, two key spaces: `l:<slug>` = link JSON, `c:<slug>` = click count.
const L = "l:";
const C = "c:";

/**
 * Cloudflare Workers KV backend.
 *
 * KV is eventually consistent and has no atomic increment, so click counting and
 * rate limiting are best-effort (read-modify-write) — fine for a personal
 * shortener, where exact-to-the-click caps under concurrency aren't a goal.
 */
export class KvStore implements Store {
  constructor(private kv: KVNamespaceLike) {}

  async getLink(slug: string): Promise<LinkRecord | null> {
    const raw = await this.kv.get(L + slug);
    return raw == null ? null : (JSON.parse(raw) as LinkRecord);
  }

  async hasLink(slug: string): Promise<boolean> {
    return (await this.kv.get(L + slug)) != null;
  }

  async listLinks(): Promise<LinkWithMeta[]> {
    const slugs: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await this.kv.list({ prefix: L, cursor });
      for (const k of page.keys) slugs.push(k.name.slice(L.length));
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);

    const out = await Promise.all(
      slugs.map(async (slug) => {
        const [rec, clicks] = await Promise.all([this.getLink(slug), this.getClicks(slug)]);
        return rec ? { slug, clicks, ...rec } : null;
      }),
    );
    return out
      .filter((x): x is LinkWithMeta => x !== null)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }

  async putLink(slug: string, rec: LinkRecord): Promise<void> {
    await this.kv.put(L + slug, JSON.stringify(rec));
  }

  async deleteLink(slug: string): Promise<void> {
    await Promise.all([this.kv.delete(L + slug), this.kv.delete(C + slug)]);
  }

  async getClicks(slug: string): Promise<number> {
    return Number((await this.kv.get(C + slug)) ?? 0) || 0;
  }

  async setClicks(slug: string, n: number): Promise<void> {
    await this.kv.put(C + slug, String(n));
  }

  async resetClicks(slug: string): Promise<void> {
    await this.kv.delete(C + slug);
  }

  async consumeClick(slug: string, rec: LinkRecord): Promise<boolean> {
    const next = (await this.getClicks(slug)) + 1;
    if (rec.maxClicks && next > rec.maxClicks) return false; // cap reached
    await this.setClicks(slug, next);
    return true;
  }

  async incr(key: string, ttlSeconds: number): Promise<number> {
    const n = (Number(await this.kv.get(key)) || 0) + 1;
    // KV's minimum expirationTtl is 60s; our smallest window is exactly 60s.
    await this.kv.put(key, String(n), { expirationTtl: Math.max(60, ttlSeconds) });
    return n;
  }

  async touch(): Promise<void> {
    // KV doesn't archive idle namespaces, so this is just a harmless heartbeat.
    await this.kv.put("__keepalive", new Date().toISOString());
  }
}
