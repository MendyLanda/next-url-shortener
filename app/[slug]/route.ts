import { NextRequest, NextResponse } from "next/server";
import { redis, LINKS_KEY, CLICKS_KEY } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const url = await redis.hget<string>(LINKS_KEY, slug);

  if (!url) {
    return new NextResponse("Short link not found.", { status: 404 });
  }

  // Count the click without blocking the redirect.
  redis.hincrby(CLICKS_KEY, slug, 1).catch(() => {});

  return NextResponse.redirect(url, 307);
}
