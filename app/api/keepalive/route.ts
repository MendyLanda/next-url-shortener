import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Keeps the storage backend warm. Upstash archives free databases after ~14
 * days of inactivity (and a PING doesn't count), so we run a real write. On
 * Vercel a daily Cron hits this (see vercel.json). Cloudflare KV doesn't archive
 * on inactivity, so this is just a harmless heartbeat there.
 */
export async function GET(req: Request) {
  // When CRON_SECRET is set, Vercel attaches it as a Bearer token to cron
  // requests. Require it if present; otherwise stay open (still harmless).
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  await (await getStore()).touch(); // a real write — counts as activity
  return Response.json({ ok: true });
}
