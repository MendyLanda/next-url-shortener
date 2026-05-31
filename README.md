# Cut ✂️

**Cut** is a tiny, self-hosted URL shortener — short links that are entirely
yours. One-click deploy to **Vercel** or **Cloudflare**, an owner-only admin
protected by a single password, and storage that's native to whichever host you
pick: **Cloudflare KV** on Cloudflare, **[Upstash Redis](https://upstash.com)**
on Vercel.

- `/[slug]` → redirect to the destination (and counts the click)
- `/admin` → password-protected dashboard to add, copy, edit, and delete links
- `/` → landing page

### Per-link controls

- **Password protection** — gate a link behind a password (visitors enter it before redirecting)
- **Expiration** — auto-disable a link after a chosen date/time
- **Click limit** — cap total clicks; the link dies once it's reached

### Security

- Owner sign-in is **rate-limited** with layered windows (2/min, 5/hour, 10/day per IP);
  link-password guesses get 2× those limits (4/min, 10/hour, 20/day)
- Passwords (owner + per-link) are stored only as SHA-256 hashes, never plaintext
- On Redis (Vercel), click caps and rate-limit counters are atomic/exact. On
  Cloudflare KV (eventually consistent, no atomic increment) they're best-effort
  — plenty for a personal shortener, just not exact under heavy concurrency.

## Deploy

Cut is a standard Next.js app, so it runs anywhere Next.js does. Pick a host:

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMendyLanda%2Fnext-url-shortener&project-name=next-url-shortener&repository-name=next-url-shortener&env=ADMIN_PASSWORD&envDescription=Password%20to%20protect%20the%20admin%20page&envLink=https%3A%2F%2Fgithub.com%2FMendyLanda%2Fnext-url-shortener%23local-development&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22upstash%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22protocol%22%3A%22storage%22%7D%5D)

During the deploy flow Vercel will:

1. Ask you for `ADMIN_PASSWORD` — choose a strong value.
2. Let you add **Upstash Redis** from the Marketplace. Accept it and Vercel
   injects the REST URL + token for you (typically as `KV_REST_API_URL` /
   `KV_REST_API_TOKEN`, since the Marketplace Redis product descends from the
   legacy Vercel KV slug). `lib/redis.ts` reads both the `UPSTASH_*` and `KV_*`
   names, so either set works with no code changes.

If the storage step doesn't appear, just open your project → **Storage** →
**Add → Upstash → Redis** after the first deploy, then redeploy.

### Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/MendyLanda/next-url-shortener)

Cloudflare builds Cut with the [OpenNext adapter](https://opennext.js.org/cloudflare)
(`@opennextjs/cloudflare`) and stores data in **native [Workers KV](https://developers.cloudflare.com/kv/)** —
no external database to set up:

1. Click the button. Cloudflare reads `wrangler.jsonc` and **auto-provisions the
   `CUT_KV` namespace** for you (the binding has no `id`, so a fresh one is
   created on deploy).
2. It prompts for the one secret in `.dev.vars.example` — a strong
   `ADMIN_PASSWORD`. (No database creds, no cron secret: KV is a native binding
   and never archives, so there's no keepalive cron on Cloudflare.)
3. Cloudflare builds and deploys. Your links go live at
   `https://cut.<your-subdomain>.workers.dev` — add a custom domain from the
   Worker's **Settings → Domains & Routes**.

No keepalive cron is needed on Cloudflare — KV doesn't archive idle namespaces
(that's an Upstash free-tier concern, handled by `vercel.json` on Vercel).

### Custom domain (any host)

A shortener is nicer on a tidy domain like `s.example.com`. Cut reads the request
host at runtime, so once you point a domain at your deployment the admin dashboard
and copy buttons start using it with **no redeploy or config change**. Add the
domain in your host's dashboard (Vercel: **Settings → Domains**; Cloudflare:
**Settings → Domains & Routes**) and create the DNS record it shows you — usually
a **CNAME** for a subdomain, or an **A**/apex record for a root domain. HTTPS is
provisioned automatically.

## Local development

```bash
pnpm install
cp .env.example .env.local   # fill in ADMIN_PASSWORD + Upstash credentials
pnpm dev
```

Pull the Upstash credentials from your Vercel project with `vercel env pull
.env.local`, or copy the REST URL/token from the Upstash console.

Open <http://localhost:3000/admin>, sign in with `ADMIN_PASSWORD`, and add a link.

To exercise the **Cloudflare Workers** build locally, copy `.dev.vars.example` to
`.dev.vars`, fill it in, and run `pnpm preview` (builds with OpenNext and serves
it on `workerd`).

## How it works

- **Storage** — the app talks to one `Store` interface (`lib/store/`) with a
  backend per host, picked at runtime: native **Cloudflare KV** on Workers,
  **Upstash Redis** everywhere else. Links live at `l:<slug>` (JSON) and click
  counts at `c:<slug>`. Adding a host later (e.g. a Redis-over-TCP backend for
  Railway) is a new file implementing the same interface — nothing else changes.
- **Auth** — `ADMIN_PASSWORD` only. Signing in sets an httpOnly cookie holding a
  SHA-256 hash of the password (never the password itself). See `lib/auth.ts`.
- **Rate limiting** — a small layered fixed-window limiter (`lib/ratelimit.ts`)
  built on the store's `incr` primitive, so it works on both Redis and KV. It
  throttles owner sign-in and per-link password guesses, failing open if the
  store is unreachable.
- **Actions** — create/delete/login/logout/unlock are Next.js Server Actions in
  `app/actions.ts`; no API routes to wire up.
- **Cloudflare** — runs through the [OpenNext adapter](https://opennext.js.org/cloudflare):
  `next build` output is repackaged into a Worker by `opennextjs-cloudflare`
  (see `wrangler.jsonc` + `open-next.config.ts`), reading the `CUT_KV` binding
  via `getCloudflareContext`.
- **Keepalive** — Upstash archives free-tier databases after ~14 days of
  inactivity (a PING doesn't count), so `/api/keepalive` does a real write. On
  Vercel a daily [Cron](https://vercel.com/docs/cron-jobs) (`vercel.json`) hits
  it automatically. Cloudflare KV doesn't archive, so it's a harmless no-op
  there. Set the optional `CRON_SECRET` env var to lock the endpoint down.

That's the whole thing.

## License

[MIT](LICENSE) © Mendy Landa
