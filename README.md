<div align="center">

<img src="public/logo.svg" alt="Cut logo" width="76" height="76" />

<h1>Cut</h1>

<p><strong>A tiny, self-hosted URL shortener — short links that are entirely yours.</strong><br/>
Owner-only admin, protected by a single password. Deploy it anywhere in one click:</p>

<p>
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMendyLanda%2Fcut&project-name=cut&repository-name=cut&env=ADMIN_PASSWORD&envDescription=Password%20to%20protect%20the%20admin%20page&envLink=https%3A%2F%2Fgithub.com%2FMendyLanda%2Fcut%23local-development&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22upstash%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22protocol%22%3A%22storage%22%7D%5D"><img alt="Deploy with Vercel" src="https://vercel.com/button" height="32"></a>
  &nbsp;
  <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/MendyLanda/cut"><img alt="Deploy to Cloudflare" src="https://deploy.workers.cloudflare.com/button" height="32"></a>
  &nbsp;
  <a href="https://railway.com/deploy/PZZYdc?referralCode=IeJ9uX&utm_medium=integration&utm_source=template&utm_campaign=generic"><img alt="Deploy on Railway" src="https://railway.com/button.svg" height="32"></a>
</p>

</div>

Each host uses its **native** storage, so there's nothing extra to wire up —
**[Upstash Redis](https://upstash.com)** on Vercel, **[Workers KV](https://developers.cloudflare.com/kv/)**
on Cloudflare, and a **managed [Redis](https://redis.io)** on Railway (or any
host you point a `REDIS_URL` at).

## What you get

- `/[slug]` → redirect to the destination (and count the click)
- `/admin` → password-protected dashboard to add, copy, edit, and delete links
- `/` → landing page

**Per-link controls**

- **Password protection** — gate a link behind a password (visitors enter it before redirecting)
- **Expiration** — auto-disable a link after a chosen date/time
- **Click limit** — cap total clicks; the link dies once it's reached

**Security**

- Owner sign-in is **rate-limited** with layered windows (2/min, 5/hour, 10/day
  per IP); link-password guesses get 2× those limits (4/min, 10/hour, 20/day).
- Passwords (owner + per-link) are stored only as SHA-256 hashes, never plaintext.
- Click caps and rate-limit counters are atomic/exact on Redis (Vercel +
  Railway), and best-effort on Cloudflare KV (eventually consistent, no atomic
  increment) — plenty for a personal shortener, just not exact under heavy concurrency.

## Deploy

One click, then a couple of prompts. Pick your host for the details:

<details>
<summary><b>▸ Vercel</b> &nbsp;·&nbsp; storage: Upstash Redis (from the Marketplace)</summary>

<br>

Click **Deploy with Vercel** above. During the flow Vercel will:

1. **Ask for `ADMIN_PASSWORD`** — choose a strong value. It protects `/admin`.
2. **Offer Upstash Redis** from the Marketplace. Accept it and Vercel injects the
   REST URL + token for you (usually as `KV_REST_API_URL` / `KV_REST_API_TOKEN`,
   since the Marketplace Redis product descends from the legacy Vercel KV slug).
   Cut reads both the `UPSTASH_*` and `KV_*` names, so either set works with no
   code changes.

If the storage step doesn't appear, open your project → **Storage** →
**Add → Upstash → Redis** after the first deploy, then redeploy.

> **Keepalive:** Upstash archives idle free databases after ~14 days. A daily
> [Vercel Cron](https://vercel.com/docs/cron-jobs) (`vercel.json`) pings
> `/api/keepalive` to keep it warm. Set the optional `CRON_SECRET` to lock that
> endpoint down.

</details>

<details>
<summary><b>▸ Cloudflare Workers</b> &nbsp;·&nbsp; storage: native KV (auto-created)</summary>

<br>

Click **Deploy to Cloudflare** above. Cut builds with the
[OpenNext adapter](https://opennext.js.org/cloudflare) and stores data in native
**Workers KV** — no external database to set up:

1. **KV is auto-provisioned.** Cloudflare reads `wrangler.jsonc` and creates the
   `CUT_KV` namespace for you (the binding has no `id`, so a fresh one is made on
   deploy).
2. **Set one secret** — a strong `ADMIN_PASSWORD` (prompted from
   `.dev.vars.example`). That's it: no database creds, and no `CRON_SECRET`,
   because KV never archives so there's no keepalive cron here.
3. **Done.** Your links go live at `https://cut.<your-subdomain>.workers.dev`.

</details>

<details>
<summary><b>▸ Railway</b> &nbsp;·&nbsp; storage: managed Redis (provisioned with the app)</summary>

<br>

Click **Deploy on Railway** above. The template spins up two services, wired
together for you:

1. **The Cut app** builds straight from this repo — Railway's Nixpacks detects
   Next.js + pnpm, so there's no Dockerfile, and `next start` listens on `$PORT`.
2. **A Redis database** is provisioned alongside it. Its connection string is
   handed to the app as a `REDIS_URL` reference variable, and Cut auto-selects
   its Redis-over-TCP backend (`lib/store/redis.ts`) whenever `REDIS_URL` is set.
3. **Set one variable** — a strong `ADMIN_PASSWORD` (prompted during deploy).
   That's it: no external accounts, and no `CRON_SECRET`, because self-hosted
   Redis doesn't archive so there's no keepalive cron here.

Your links go live at `https://<service>.up.railway.app`. The same `REDIS_URL`
wiring works on **Render**, **Fly.io**, or a plain VPS — point it at any Redis.

</details>

<details>
<summary><b>▸ Custom domain</b> &nbsp;·&nbsp; any host</summary>

<br>

A shortener is nicer on a tidy domain like `s.example.com`. Cut reads the request
host at runtime, so once you point a domain at your deployment the admin
dashboard and copy buttons start using it with **no redeploy or config change**.

1. Add the domain in your host's dashboard — Vercel: **Settings → Domains**;
   Cloudflare: the Worker's **Settings → Domains & Routes**.
2. Create the DNS record it shows you — usually a **CNAME** for a subdomain, or
   an **A**/apex record for a root domain. HTTPS is provisioned automatically.
3. Your links now live at `https://s.example.com/<slug>`.

</details>

## Local development

```bash
pnpm install
cp .env.example .env.local   # fill in ADMIN_PASSWORD + Upstash credentials
pnpm dev
```

Pull the Upstash credentials from your Vercel project with
`vercel env pull .env.local`, or copy the REST URL/token from the Upstash console.
Prefer a local server instead? Run Redis (`docker run -p 6379:6379 redis`) and set
`REDIS_URL=redis://localhost:6379` — Cut uses it whenever it's present. Then open
<http://localhost:3000/admin>, sign in with `ADMIN_PASSWORD`, and add a link.

To exercise the **Cloudflare Workers** build locally, copy `.dev.vars.example` to
`.dev.vars`, fill it in, and run `pnpm preview` (builds with OpenNext and serves
it on `workerd`).

## How it works

<details>
<summary>Architecture in a nutshell</summary>

<br>

- **Storage** — the app talks to one `Store` interface (`lib/store/`) with a
  backend chosen per host at runtime: native **Cloudflare KV** on Workers,
  **Redis over TCP** when `REDIS_URL` is set (Railway / Render / Fly / VPS), and
  **Upstash Redis** over REST otherwise. Each keeps links and click counts under
  its own key layout; adding another host is just a new file implementing the
  same interface — nothing else changes.
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
- **Keepalive** — `/api/keepalive` does a real write so idle Upstash free
  databases aren't archived (~14 days; a PING doesn't count). On Vercel a daily
  [Cron](https://vercel.com/docs/cron-jobs) hits it; on Cloudflare KV and
  self-hosted Redis it's a harmless no-op (neither archives).

</details>

## License

[MIT](LICENSE) © Mendy Landa
