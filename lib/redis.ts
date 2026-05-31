import { Redis } from "@upstash/redis";

// The Upstash Redis integration from the Vercel Marketplace injects
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. We also fall back to the
// KV_REST_API_* names in case the store was connected under the legacy KV slug.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "",
});

// One hash holds every slug -> url mapping; another tracks click counts.
export const LINKS_KEY = "links";
export const CLICKS_KEY = "clicks";

export type Links = Record<string, string>;
export type Clicks = Record<string, number>;
