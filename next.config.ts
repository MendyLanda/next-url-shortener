import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Lets `next dev` read the Cloudflare env/bindings from wrangler.jsonc. It's a
// no-op outside `next dev`, so it stays safe for Vercel/Node builds too.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
