"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  getStore,
  getLink,
  getClicks,
  linkStatus,
  consumeClick,
  type LinkRecord,
} from "@/lib/store";
import { isAuthed, signIn, signOut, hashPassword } from "@/lib/auth";
import { allowLoginAttempt, allowUnlockAttempt } from "@/lib/ratelimit";
import { log } from "@/lib/log";

// Paths that must never be used as a slug (they are real routes).
const RESERVED = new Set(["admin", "api", "_next", "favicon.ico"]);

// Unambiguous base32-ish alphabet (no 0/1/o/l/i).
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz";

function randomSlug(len = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let slug = "";
  for (const b of bytes) slug += ALPHABET[b % ALPHABET.length];
  return slug;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "anonymous";
}

export async function loginAction(formData: FormData) {
  const ip = await clientIp();
  if (!(await allowLoginAttempt(ip))) {
    log.warn("login.ratelimited", { ip });
    redirect("/admin?error=ratelimited");
  }
  const password = String(formData.get("password") ?? "");
  const ok = await signIn(password);
  if (ok) log.info("login.success", { ip });
  else log.warn("login.failed", { ip });
  redirect(ok ? "/admin" : "/admin?error=invalid");
}

export async function logoutAction() {
  await signOut();
  log.info("logout", { ip: await clientIp() });
  redirect("/admin");
}

export type CreateState = {
  ok: boolean;
  slug?: string;
  error?: string;
};

export async function createLinkAction(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  if (!(await isAuthed())) {
    log.warn("link.create.denied", { ip: await clientIp() });
    return { ok: false, error: "Not signed in." };
  }

  let url = String(formData.get("url") ?? "").trim();
  let slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();

  if (!url) return { ok: false, error: "Enter a destination URL." };
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try {
    new URL(url);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }

  const store = await getStore();

  if (slug) {
    if (!/^[a-z0-9-]+$/.test(slug) || RESERVED.has(slug)) {
      return { ok: false, error: "Slug can only contain letters, numbers and dashes." };
    }
    if (await store.hasLink(slug)) {
      return { ok: false, error: `"${slug}" is already taken.` };
    }
  } else {
    do {
      slug = randomSlug();
    } while (await store.hasLink(slug));
  }

  const password = String(formData.get("password") ?? "").trim();
  const expiry = parseExpiry(formData);
  if ("error" in expiry) return { ok: false, error: expiry.error };
  const limit = parseMaxClicks(formData);
  if ("error" in limit) return { ok: false, error: limit.error };

  const record: LinkRecord = {
    url,
    createdAt: Date.now(),
    passwordHash: password ? hashPassword(password) : null,
    expiresAt: expiry.value,
    maxClicks: limit.value,
  };

  await store.putLink(slug, record);
  log.info("link.create", {
    slug,
    dest: safeHost(url),
    protected: Boolean(record.passwordHash),
    expires: Boolean(record.expiresAt),
    cap: record.maxClicks ?? undefined,
    ip: await clientIp(),
  });
  revalidatePath("/admin");
  return { ok: true, slug };
}

/** Host of a URL for logs (never the full path/query). "?" if unparseable. */
function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "?";
  }
}

// The client sends `expiresAt` as an absolute epoch (ms) so the value is
// timezone-correct regardless of the server's (UTC) clock.
function parseExpiry(formData: FormData): { value: number | null } | { error: string } {
  const raw = String(formData.get("expiresAt") ?? "").trim();
  if (!raw) return { value: null };
  const t = Number(raw);
  if (!Number.isFinite(t) || t <= 0) return { error: "Invalid expiration date." };
  if (t <= Date.now()) return { error: "Expiration must be in the future." };
  return { value: t };
}

function parseMaxClicks(formData: FormData): { value: number | null } | { error: string } {
  const raw = String(formData.get("maxClicks") ?? "").trim();
  if (!raw) return { value: null };
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return { error: "Click limit must be a positive whole number." };
  return { value: n };
}

function parseUrl(formData: FormData): { value: string } | { error: string } {
  let url = String(formData.get("url") ?? "").trim();
  if (!url) return { error: "Enter a destination URL." };
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try {
    new URL(url);
  } catch {
    return { error: "That doesn't look like a valid URL." };
  }
  return { value: url };
}

export async function editLinkAction(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  if (!(await isAuthed())) {
    log.warn("link.edit.denied", { ip: await clientIp() });
    return { ok: false, error: "Not signed in." };
  }

  const originalSlug = String(formData.get("originalSlug") ?? "").trim();
  const rec = originalSlug ? await getLink(originalSlug) : null;
  if (!rec) return { ok: false, error: "This link no longer exists." };

  const parsedUrl = parseUrl(formData);
  if ("error" in parsedUrl) return { ok: false, error: parsedUrl.error };

  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  if (!slug) return { ok: false, error: "Slug can't be empty." };
  if (!/^[a-z0-9-]+$/.test(slug) || RESERVED.has(slug)) {
    return { ok: false, error: "Slug can only contain letters, numbers and dashes." };
  }
  const store = await getStore();
  const renamed = slug !== originalSlug;
  if (renamed && (await store.hasLink(slug))) {
    return { ok: false, error: `"${slug}" is already taken.` };
  }

  const expiry = parseExpiry(formData);
  if ("error" in expiry) return { ok: false, error: expiry.error };
  const limit = parseMaxClicks(formData);
  if ("error" in limit) return { ok: false, error: limit.error };

  // Password: blank keeps the current one; "remove" clears it; otherwise set new.
  const removePassword = formData.get("removePassword") != null;
  const password = String(formData.get("password") ?? "").trim();
  let passwordHash = rec.passwordHash ?? null;
  if (removePassword) passwordHash = null;
  else if (password) passwordHash = hashPassword(password);

  const resetClicks = formData.get("resetClicks") != null;

  const next: LinkRecord = {
    url: parsedUrl.value,
    createdAt: rec.createdAt ?? Date.now(),
    passwordHash,
    expiresAt: expiry.value,
    maxClicks: limit.value,
  };

  await store.putLink(slug, next);

  if (renamed) {
    const carried = resetClicks ? 0 : await store.getClicks(originalSlug);
    await store.deleteLink(originalSlug); // removes old record + its clicks
    if (carried > 0) await store.setClicks(slug, carried);
  } else if (resetClicks) {
    await store.resetClicks(slug);
  }

  log.info("link.edit", { slug, from: renamed ? originalSlug : undefined, dest: safeHost(parsedUrl.value) });
  revalidatePath("/admin");
  return { ok: true, slug };
}

export async function deleteLinkAction(slug: string) {
  if (!(await isAuthed())) {
    log.warn("link.delete.denied", { slug, ip: await clientIp() });
    return;
  }
  if (slug) {
    await (await getStore()).deleteLink(slug);
    log.info("link.delete", { slug });
  }
  // Revalidate but don't redirect: the caller hides the row optimistically so
  // the deletion is visible immediately even on eventually-consistent KV, where
  // an immediate re-read could still return the just-deleted link.
  revalidatePath("/admin");
}

/** Verify a per-link password, then count the click and redirect. */
export async function unlockAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const password = String(formData.get("password") ?? "");
  const ip = await clientIp();

  if (!(await allowUnlockAttempt(ip, slug))) {
    log.warn("unlock.ratelimited", { slug, ip });
    redirect(`/${slug}?error=ratelimited`);
  }

  const rec = await getLink(slug);
  if (!rec) redirect(`/${slug}`);

  if (linkStatus(rec, await getClicks(slug)) !== "active") redirect(`/${slug}`);

  if (!rec.passwordHash || rec.passwordHash !== hashPassword(password)) {
    log.warn("unlock.failed", { slug, ip });
    redirect(`/${slug}?error=invalid`);
  }

  if (!(await consumeClick(slug, rec))) redirect(`/${slug}`);
  log.info("unlock.success", { slug, ip });
  redirect(rec.url);
}
