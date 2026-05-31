# Cut ✂️

**Cut** is a tiny, self-hosted URL shortener — short links that are entirely
yours. One-click deploy to Vercel, data in [Upstash Redis](https://upstash.com)
(via the Vercel Marketplace), and an owner-only admin protected by a single
password.

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
(`@opennextjs/cloudflare`) — configured in `wrangler.jsonc`, `open-next.config.ts`,
and the `deploy` script. There's no Marketplace database here, so set up Upstash
first:

1. Create a free database at [upstash.com](https://upstash.com) and copy its
   **REST URL** and **REST token**.
2. Click the button. Cloudflare reads `.dev.vars.example` and prompts you for the
   secrets — paste `ADMIN_PASSWORD`, `UPSTASH_REDIS_REST_URL`, and
   `UPSTASH_REDIS_REST_TOKEN` (`CRON_SECRET` is optional).
3. Cloudflare builds and deploys. Your links go live at
   `https://cut.<your-subdomain>.workers.dev` — add a custom domain from the
   Worker's **Settings → Domains & Routes**.

> **Keepalive on Cloudflare:** the `vercel.json` cron only runs on Vercel. Upstash
> still archives idle free databases on any host, so schedule a daily GET to
> `/api/keepalive` another way — e.g. a Cloudflare [Cron Trigger](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
> worker or a free pinger like [cron-job.org](https://cron-job.org). Set
> `CRON_SECRET` to lock the endpoint down.

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
  inactivity (and a PING doesn't count). `/api/keepalive` runs a real `SET` to
  keep it alive forever. On Vercel a daily [Cron](https://vercel.com/docs/cron-jobs)
  (`vercel.json`) hits it automatically; on other hosts schedule it yourself (see
  the Cloudflare deploy note above). Set the optional `CRON_SECRET` env var to
  lock the endpoint down.
- **Cloudflare** — runs through the [OpenNext adapter](https://opennext.js.org/cloudflare):
  `next build` output is repackaged into a Worker by `opennextjs-cloudflare`
  (see `wrangler.jsonc` + `open-next.config.ts`). All pages are dynamic and data
  is HTTP-only (Upstash REST), so no R2/KV bindings are needed.

That's the whole thing.

## License

[MIT](LICENSE) © Mendy Landa
