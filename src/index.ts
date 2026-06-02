// Vercel entry. Vercel's zero-config Hono preset detects a `hono`-importing file
// at src/index.{ts} and turns the default-exported app into a Fluid-compute
// Function (public/** is served by Vercel's CDN — no api/ dir, adapter, or
// rewrites). The actual app lives in ./app, shared with the Node (src/node.ts)
// and Cloudflare (src/worker.ts) entries.
//
// Why re-export from a pre-built bundle instead of `./app.js` directly:
// Vercel's builder does NOT bundle — it transpiles each file and traces imports
// with @vercel/nft, which resolves a `.js` specifier to a `.ts` sibling but NOT
// to a `.tsx` one. Our app graph is ~14 `.tsx` files, so tracing `./app.js`
// silently drops the whole graph and the Function crashes at runtime with
// ERR_MODULE_NOT_FOUND (vercel/vercel#14058). Instead, `vercel-build` esbuild-
// bundles the app into a single self-contained `_bundle.js` (npm deps stay
// external and resolve from node_modules); nft only has to follow this one real
// `.js` file. Verified by replicating Vercel's per-file no-bundle + nft model.
import "hono";

export { default } from "./_bundle.js";
