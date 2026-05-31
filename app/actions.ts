"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { redis, LINKS_KEY, CLICKS_KEY } from "@/lib/redis";
import { isAuthed, signIn, signOut } from "@/lib/auth";

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

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const ok = await signIn(password);
  redirect(ok ? "/admin" : "/admin?error=invalid");
}

export async function logoutAction() {
  await signOut();
  redirect("/admin");
}

export async function createLinkAction(formData: FormData) {
  if (!(await isAuthed())) redirect("/admin");

  let url = String(formData.get("url") ?? "").trim();
  let slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();

  if (!url) redirect("/admin?error=url");
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try {
    new URL(url);
  } catch {
    redirect("/admin?error=url");
  }

  if (slug) {
    if (!/^[a-z0-9-]+$/.test(slug) || RESERVED.has(slug)) redirect("/admin?error=slug");
    if (await redis.hexists(LINKS_KEY, slug)) redirect("/admin?error=exists");
  } else {
    do {
      slug = randomSlug();
    } while (await redis.hexists(LINKS_KEY, slug));
  }

  await redis.hset(LINKS_KEY, { [slug]: url });
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteLinkAction(formData: FormData) {
  if (!(await isAuthed())) redirect("/admin");
  const slug = String(formData.get("slug") ?? "");
  if (slug) {
    await redis.hdel(LINKS_KEY, slug);
    await redis.hdel(CLICKS_KEY, slug);
  }
  revalidatePath("/admin");
  redirect("/admin");
}
