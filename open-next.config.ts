import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Cut's pages are all dynamic (force-dynamic) and data lives in Upstash over
// HTTP, so there's nothing to cache at the edge — no R2/KV bindings needed.
// SSR routes work out of the box with an empty config.
export default defineCloudflareConfig({});
