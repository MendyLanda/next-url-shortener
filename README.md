# next-url-shortener

The simplest possible URL shortener. One-click deploy to Vercel, data in
[Upstash Redis](https://upstash.com) (via the Vercel Marketplace), and an
owner-only admin page protected by a single password.

- `/[slug]` → 307 redirect to the destination (and counts the click)
- `/admin` → password-protected page to add and delete links
- `/` → minimal landing page

## One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMendyLanda%2Fnext-url-shortener&project-name=next-url-shortener&repository-name=next-url-shortener&env=ADMIN_PASSWORD&envDescription=Password%20to%20protect%20the%20admin%20page&envLink=https%3A%2F%2Fgithub.com%2FMendyLanda%2Fnext-url-shortener%23local-development&products=%7B%22integrationSlug%22%3A%22upstash%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22protocol%22%3A%22storage%22%7D)

During the deploy flow Vercel will:

1. Ask you for `ADMIN_PASSWORD` — choose a strong value.
2. Let you add **Upstash Redis** from the Marketplace. Accept it and Vercel
   injects the REST URL + token for you (typically as `KV_REST_API_URL` /
   `KV_REST_API_TOKEN`, since the Marketplace Redis product descends from the
   legacy Vercel KV slug). `lib/redis.ts` reads both the `UPSTASH_*` and `KV_*`
   names, so either set works with no code changes.

If the storage step doesn't appear, just open your project → **Storage** →
**Add → Upstash → Redis** after the first deploy, then redeploy.

## Local development

```bash
pnpm install
cp .env.example .env.local   # fill in ADMIN_PASSWORD + Upstash credentials
pnpm dev
```

Pull the Upstash credentials from your Vercel project with `vercel env pull
.env.local`, or copy the REST URL/token from the Upstash console.

Open <http://localhost:3000/admin>, sign in with `ADMIN_PASSWORD`, and add a link.

## How it works

- **Storage** — a single Redis hash `links` maps `slug → url`; a `clicks` hash
  tracks per-slug click counts. See `lib/redis.ts`.
- **Auth** — `ADMIN_PASSWORD` only. Signing in sets an httpOnly cookie holding a
  SHA-256 hash of the password (never the password itself). See `lib/auth.ts`.
- **Actions** — add/delete/login/logout are Next.js Server Actions in
  `app/actions.ts`; no API routes to wire up.

That's the whole thing.
