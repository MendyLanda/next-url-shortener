# next-url-shortener

A tiny, self-hosted URL shortener. One-click deploy to Vercel, data in
[Upstash Redis](https://upstash.com) (via the Vercel Marketplace), and an
owner-only admin page protected by a single password.

- `/[slug]` → redirect to the destination (and counts the click)
- `/admin` → password-protected dashboard to add, copy, and delete links
- `/` → landing page

### Per-link controls

- **Password protection** — gate a link behind a password (visitors enter it before redirecting)
- **Expiration** — auto-disable a link after a chosen date/time
- **Click limit** — cap total clicks; the link dies once it's reached

### Security

- Owner sign-in is **rate-limited** (5 attempts/min per IP); link-password guesses too (10/min)
- Passwords (owner + per-link) are stored only as SHA-256 hashes, never plaintext

## One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMendyLanda%2Fnext-url-shortener&project-name=next-url-shortener&repository-name=next-url-shortener&env=ADMIN_PASSWORD&envDescription=Password%20to%20protect%20the%20admin%20page&envLink=https%3A%2F%2Fgithub.com%2FMendyLanda%2Fnext-url-shortener%23local-development&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22upstash%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22protocol%22%3A%22storage%22%7D%5D)

During the deploy flow Vercel will:

1. Ask you for `ADMIN_PASSWORD` — choose a strong value.
2. Let you add **Upstash Redis** from the Marketplace. Accept it and Vercel
   injects the REST URL + token for you (typically as `KV_REST_API_URL` /
   `KV_REST_API_TOKEN`, since the Marketplace Redis product descends from the
   legacy Vercel KV slug). `lib/redis.ts` reads both the `UPSTASH_*` and `KV_*`
   names, so either set works with no code changes.
3. **(Optional) Link a custom short domain.** A shortener is nicer on a tidy
   domain like `s.example.com`. After the first deploy:
   1. Open your project → **Settings → Domains → Add**, and enter the domain
      (e.g. `s.example.com`).
   2. Add the DNS record Vercel shows you at your registrar — usually a
      **CNAME** for a subdomain (`s` → `cname.vercel-dns.com`), or an **A**
      record for an apex/root domain. Vercel provisions HTTPS automatically.
   3. Once it verifies, your links live at `https://s.example.com/<slug>`. The
      app reads the request host at runtime, so the admin dashboard and copy
      buttons start using the new domain with **no redeploy or config change**.

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

- **Storage** — a Redis hash `links` maps `slug → {url, password, expiry, click
  limit, …}` (JSON); a `clicks` hash tracks per-slug counts via atomic `HINCRBY`
  so click limits are race-safe. See `lib/redis.ts`.
- **Auth** — `ADMIN_PASSWORD` only. Signing in sets an httpOnly cookie holding a
  SHA-256 hash of the password (never the password itself). See `lib/auth.ts`.
- **Rate limiting** — `@upstash/ratelimit` throttles owner sign-in and per-link
  password guesses, failing open if Redis is unreachable. See `lib/ratelimit.ts`.
- **Actions** — create/delete/login/logout/unlock are Next.js Server Actions in
  `app/actions.ts`; no API routes to wire up.
- **Keepalive** — Upstash archives free-tier databases after ~14 days of
  inactivity (and a PING doesn't count). A daily [Vercel Cron](https://vercel.com/docs/cron-jobs)
  (`vercel.json`) hits `/api/keepalive`, which runs a real `SET` to keep it
  alive forever. Set the optional `CRON_SECRET` env var to lock the endpoint
  down. Note: Vercel Cron only runs on **production** deployments, and the
  Hobby plan runs crons once per day — which is well under the 14-day window.

That's the whole thing.
