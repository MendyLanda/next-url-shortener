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
  &nbsp;
  <a href="https://render.com/deploy?repo=https://github.com/MendyLanda/cut"><img alt="Deploy to Render" src="https://render.com/images/deploy-to-render-button.svg" height="32"></a>
</p>

</div>

Each host uses its **native** storage, so there's nothing extra to wire up —
**[Upstash Redis](https://upstash.com)** on Vercel, **[Workers KV](https://developers.cloudflare.com/kv/)**
on Cloudflare, a **managed [Redis](https://redis.io)** on Railway and Render, and
a **bundled Redis** when you self-host with Docker (Coolify, Dokploy, or plain
Compose) — or any host you point a `REDIS_URL` at.

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
- Click caps and rate-limit counters are atomic/exact on Redis (Vercel,
  Railway, Render, self-hosted), and best-effort on Cloudflare KV (eventually
  consistent, no atomic increment) — plenty for a personal shortener, just not
  exact under heavy concurrency.

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

Click **Deploy to Cloudflare** above. Cut is a native [Hono](https://hono.dev)
Worker (no adapter) and stores data in native **Workers KV** — no external
database to set up:

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
   pnpm, so there's no Dockerfile; `pnpm build` bundles the Hono server and
   `pnpm start` listens on `$PORT`.
2. **A Redis database** is provisioned alongside it. Its connection string is
   handed to the app as a `REDIS_URL` reference variable, and Cut auto-selects
   its Redis-over-TCP backend (`lib/store/redis.ts`) whenever `REDIS_URL` is set.
3. **Set one variable** — a strong `ADMIN_PASSWORD` (prompted during deploy).
   That's it: no external accounts, and no `CRON_SECRET`, because self-hosted
   Redis doesn't archive so there's no keepalive cron here.

Your links go live at `https://<service>.up.railway.app`. The same `REDIS_URL`
wiring works on **Fly.io** or a plain VPS — point it at any Redis.

</details>

<details>
<summary><b>▸ Render</b> &nbsp;·&nbsp; storage: managed Key Value (provisioned with the app)</summary>

<br>

Click **Deploy to Render** above. Render reads [`render.yaml`](render.yaml) and
spins up two services from this repo, wired together for you:

1. **The Cut app** builds with pnpm (detected from `package.json`) — no
   Dockerfile — and `pnpm start` runs the bundled Hono server on `$PORT`.
2. **A Key Value store** (Valkey 8, Redis-compatible) is provisioned alongside
   it. Its private connection string is injected as `REDIS_URL`, so Cut
   auto-selects its Redis-over-TCP backend (`lib/store/redis.ts`). It's locked to
   the private network (`ipAllowList: []`) and set to `noeviction`, so it acts as
   a durable datastore rather than a cache that drops your links.
3. **Set one variable** — a strong `ADMIN_PASSWORD` (prompted during deploy).
   That's it: no external accounts, and no `CRON_SECRET`, because self-hosted
   Redis doesn't archive so there's no keepalive cron here.

Your links go live at `https://<service>.onrender.com`.

> **Free tier:** Render spins down idle free web services after ~15 minutes, so
> the first request after a lull takes a few seconds to wake. The links
> themselves stay put — they live in the Key Value store, not the web service.

</details>

<details>
<summary><b>▸ Coolify / Dokploy / Docker</b> &nbsp;·&nbsp; storage: bundled Redis (self-hosted)</summary>

<br>

Run the whole stack on your own server. Cut ships as a prebuilt image,
[`ghcr.io/mendylanda/cut`](https://github.com/MendyLanda/cut/pkgs/container/cut),
and each option below pairs it with a private, persistent Redis — no external
accounts, and no `CRON_SECRET` (self-hosted Redis doesn't archive).

**[Coolify](https://coolify.io)** — add **Cut** from the service catalog. Coolify
generates the domain and a strong `ADMIN_PASSWORD` (find it under the service's
environment variables) and wires the bundled Redis in as `REDIS_URL`. Template
source: [`deploy/coolify/`](deploy/coolify).

**[Dokploy](https://dokploy.com)** — pick **Cut** from **Templates**. Dokploy
generates the domain + `ADMIN_PASSWORD` and provisions the Redis for you.
Template source: [`deploy/dokploy/`](deploy/dokploy).

**Plain Docker Compose / VPS** — no PaaS required:

```yaml
services:
  cut:
    image: ghcr.io/mendylanda/cut:latest
    environment:
      - ADMIN_PASSWORD=change-me
      - REDIS_URL=redis://redis:6379
    ports: ["3000:3000"]
    depends_on: [redis]
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory-policy noeviction
    volumes: ["cut-redis-data:/data"]
volumes:
  cut-redis-data:
```

`docker compose up -d`, then open `http://<host>:3000/admin`. Put it behind your
reverse proxy (Caddy / Traefik / nginx) for HTTPS — Cut reads the request host,
so there's no base-URL to configure.

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
cp .env.example .env   # fill in ADMIN_PASSWORD + a store (Upstash or REDIS_URL)
pnpm dev               # loads .env automatically, serves on http://localhost:3000
```

`pnpm dev` builds the CSS once and runs the server with live reload. Editing
component classes? Run `pnpm dev:css` in a second terminal to rebuild Tailwind on
change.

Pull the Upstash credentials from your Vercel project with
`vercel env pull .env`, or copy the REST URL/token from the Upstash console.
Prefer a local server instead? Run Redis (`docker run -p 6379:6379 redis`) and set
`REDIS_URL=redis://localhost:6379` in `.env` — Cut uses it whenever it's present.
Then open <http://localhost:3000/admin>, sign in with `ADMIN_PASSWORD`, and add a link.

To exercise the **Cloudflare Workers** build locally, copy `.dev.vars.example` to
`.dev.vars`, fill it in, and run `pnpm preview` — it builds the CSS and serves the
Worker on `workerd` via `wrangler dev` (with a local KV namespace).

## How it works

<details>
<summary>Architecture in a nutshell</summary>

<br>

- **Storage** — the app talks to one `Store` interface (`lib/store/`) with a
  backend chosen per host at runtime: native **Cloudflare KV** on Workers,
  **Redis over TCP** when `REDIS_URL` is set (Railway / Render / Coolify /
  Dokploy / Docker / VPS), and **Upstash Redis** over REST otherwise. Each keeps
  links and click counts under its own key layout; adding another host is just a
  new file implementing the same interface — nothing else changes.
- **Auth** — `ADMIN_PASSWORD` only. Signing in sets an httpOnly cookie holding a
  SHA-256 hash of the password (never the password itself). See `lib/auth.ts`.
- **Rate limiting** — a small layered fixed-window limiter (`lib/ratelimit.ts`)
  built on the store's `incr` primitive, so it works on both Redis and KV. It
  throttles owner sign-in and per-link password guesses, failing open if the
  store is unreachable.
- **App** — a single [Hono](https://hono.dev) app (`src/app.tsx`) renders
  server-side with hono/jsx and handles every route. Create/edit/delete/login/
  logout/unlock are plain form `POST`s (`src/routes/`); a small progressive-
  enhancement script (`public/app.js`) adds copy, show-password, and clipboard
  niceties. One app runs on all hosts via thin entrypoints: `src/worker.ts`
  (Cloudflare), `src/node.ts` (Node/Docker), `src/index.ts` (Vercel — detected
  by Vercel's zero-config Hono preset, which turns the app into a Function).
- **Cloudflare** — runs natively as a Worker (`src/worker.ts`, `wrangler.jsonc`);
  the `CUT_KV` binding is read off the request `env` via Hono's context storage
  (`hono/context-storage`), so `lib/store` stays the same across hosts.
- **Docker** — the `Dockerfile` esbuild-bundles the Hono server to
  `dist/server.mjs` and publishes a minimal multi-arch image to
  `ghcr.io/mendylanda/cut` via a GitHub Action. The self-hosted catalog
  templates under `deploy/` run that image next to a bundled Redis.
- **Keepalive** — `/api/keepalive` does a real write so idle Upstash free
  databases aren't archived (~14 days; a PING doesn't count). On Vercel a daily
  [Cron](https://vercel.com/docs/cron-jobs) hits it; on Cloudflare KV and
  self-hosted Redis it's a harmless no-op (neither archives).

</details>

## License

[MIT](LICENSE) © Mendy Landa
