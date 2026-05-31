import { cookies, headers } from "next/headers";
import { createHash } from "node:crypto";

const COOKIE = "auth";

// True when the request reached us over HTTPS — directly or via a TLS-terminating
// reverse proxy (Traefik/nginx/Caddy), which forward the original scheme in
// `x-forwarded-proto`. We can't key the cookie's Secure flag off NODE_ENV: a
// production image served over plain HTTP (common for self-hosted/LAN setups)
// would set Secure, and the browser would silently drop the cookie — so sign-in
// would never stick.
async function isHttps(): Promise<boolean> {
  const proto = (await headers()).get("x-forwarded-proto");
  return proto?.split(",")[0].trim() === "https";
}

// The cookie never stores the password itself — only a hash of it. On every
// request we recompute the hash from ADMIN_PASSWORD and compare.
function token(): string {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(pw).digest("hex");
}

/** True only when ADMIN_PASSWORD is set and the request carries a valid cookie. */
export async function isAuthed(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  const store = await cookies();
  return store.get(COOKIE)?.value === token();
}

/** Returns true and sets the auth cookie when the password matches. */
export async function signIn(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) return false;
  const store = await cookies();
  store.set(COOKIE, token(), {
    httpOnly: true,
    secure: await isHttps(),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return true;
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Whether the app is configured at all (password set). */
export function isConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** Hash used for per-link passwords (never stores the plaintext). */
export function hashPassword(pw: string): string {
  return createHash("sha256").update(pw).digest("hex");
}
