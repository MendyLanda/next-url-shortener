// Type stub for the esbuild-generated `_bundle.js` (produced by `vercel-build`,
// gitignored). Only `src/index.ts` imports it — and only on Vercel, whose
// no-bundle builder needs the app pre-bundled into one file. At runtime the real
// `_bundle.js` is loaded; this declaration just satisfies the type-checker.
import type { Hono } from "hono";

declare const app: Hono;
export default app;
