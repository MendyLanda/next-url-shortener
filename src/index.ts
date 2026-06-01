// Vercel entry. Vercel's zero-config Hono preset detects a `hono`-importing file
// at src/index.{ts} and turns the default-exported app into a Fluid-compute
// Function (no api/ directory, no adapter, no rewrites). Static files in public/
// are served by Vercel's CDN. The actual app lives in ./app, shared with the
// Node (src/node.ts) and Cloudflare (src/worker.ts) entries.
import "hono";
import app from "./app";

export default app;
