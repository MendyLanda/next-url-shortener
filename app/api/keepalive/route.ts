import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * Keeps the Upstash free-tier database from being archived.
 *
 * Upstash archives free databases after ~14 days of inactivity, and a PING does
 * NOT count — only real data commands do. So we run an actual SET. Invoked daily
 * by a Vercel Cron (see vercel.json); also hittable manually for testing.
 */
export async function GET(req: Request) {
  // When CRON_SECRET is set, Vercel attaches it as a Bearer token to cron
  // requests. Require it if present; otherwise stay open (still harmless).
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const ranAt = new Date().toISOString();
  await redis.set("__keepalive", ranAt); // a real write — counts as activity

  return Response.json({ ok: true, ranAt });
}
