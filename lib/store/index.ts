import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Store } from "./types";
import type { KVNamespaceLike } from "./cloudflare-kv";
import { KvStore } from "./cloudflare-kv";
import { UpstashStore } from "./upstash";

// Re-export the shared link types/helpers so callers get everything from one
// place: import { getLink, linkStatus, type LinkRecord } from "@/lib/store".
export * from "../links";
export type { Store } from "./types";

// The binding name declared in wrangler.jsonc (kv_namespaces[].binding).
const KV_BINDING = "CUT_KV";

const upstash = new UpstashStore(); // singleton; its Redis client is lazy

/**
 * Picks the storage backend for the current host. On Cloudflare Workers the
 * native KV binding is present, so we use it; everywhere else (Vercel, Node,
 * local dev) we fall back to Upstash Redis.
 */
export async function getStore(): Promise<Store> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const kv = (env as Record<string, unknown> | undefined)?.[KV_BINDING];
    if (kv) return new KvStore(kv as KVNamespaceLike);
  } catch {
    // getCloudflareContext throws when not running on Cloudflare — use Upstash.
  }
  return upstash;
}

// Thin convenience wrappers so read-side callers stay terse.
export async function getLink(slug: string) {
  return (await getStore()).getLink(slug);
}
export async function getClicks(slug: string) {
  return (await getStore()).getClicks(slug);
}
export async function listLinks() {
  return (await getStore()).listLinks();
}
export async function consumeClick(
  ...args: Parameters<Store["consumeClick"]>
) {
  return (await getStore()).consumeClick(...args);
}
