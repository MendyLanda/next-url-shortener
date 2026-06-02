import type { Child } from "hono/jsx";
import {
  ArrowRight,
  ArrowUpRight,
  Lock,
  Clock,
  Hash,
  Copy,
  ShieldCheck,
  KeyRound,
  Gauge,
  GitHubMark,
} from "./icons.js";
import {
  Vercel,
  Cloudflare,
  Railway,
  Render,
  Docker,
  Coolify,
  Dokploy,
} from "./logos.js";
import { Wordmark } from "./wordmark.js";
import { REPO_LINK } from "../../lib/constants.js";

export function HomePage() {
  return (
    <main class="flex flex-1 flex-col">
      <SiteHeader />
      <Hero />
      <DeployAnywhere />
      <Features />
      <SiteFooter />
    </main>
  );
}

/* ─────────────────────────── Header ─────────────────────────── */

function SiteHeader() {
  return (
    <header class="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
      <Wordmark />
      <nav class="flex items-center gap-1.5 sm:gap-3">
        <a
          href={REPO_LINK}
          class="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground sm:inline-flex"
        >
          <GitHubMark class="h-4 w-4" /> Source
        </a>
        <a
          href="/admin"
          class="rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-surface-2"
        >
          Admin
        </a>
      </nav>
    </header>
  );
}

/* ──────────────────────────── Hero ──────────────────────────── */

function Hero() {
  return (
    <section class="mx-auto grid w-full max-w-5xl flex-1 items-center gap-14 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-24">
      <div class="animate-rise">
        <p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          self-hosted · entirely yours
        </p>
        <h1 class="mt-5 font-display text-5xl italic leading-[1.02] tracking-tight sm:text-6xl">
          Cut your links
          <br />
          down to size.
        </h1>
        <p class="mt-6 max-w-md text-balance text-lg leading-relaxed text-muted">
          A tiny URL shortener you run yourself. Only the owner can add links,
          and every link can carry a password, an expiry, or a hard click limit.
        </p>

        <div class="mt-9 flex flex-wrap items-center gap-3">
          <a
            href="/admin"
            class="group inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.99]"
          >
            Manage links
            <ArrowRight
              size={16}
              class="transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </a>
          <a
            href={REPO_LINK}
            class="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            <GitHubMark class="h-4 w-4" /> View source
          </a>
        </div>

        <p class="mt-8 font-mono text-xs text-muted">
          MIT licensed · no trackers · your database
        </p>
      </div>

      <HeroDemo />
    </section>
  );
}

/** A polished mock of a shortened link — shows the product at a glance. */
function HeroDemo() {
  return (
    <div class="animate-rise [animation-delay:140ms]">
      <div class="animate-float relative overflow-hidden rounded-2xl border border-border bg-surface/80 p-5 shadow-2xl shadow-black/5 backdrop-blur-sm">
        {/* accent hairline + slow light sweep */}
        <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div
          aria-hidden="true"
          class="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 animate-sheen bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent"
        />

        <div class="flex items-center justify-between">
          <span class="font-mono text-xs text-muted">cut.example.com</span>
          <span class="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted">
            <Copy size={13} />
          </span>
        </div>

        <div class="mt-4 font-mono text-xl sm:text-2xl">
          <span class="text-muted">cut.example.com/</span>
          <span class="font-semibold text-accent">launch</span>
          <span class="ml-0.5 inline-block h-5 w-[2px] translate-y-0.5 animate-blink bg-accent align-middle" />
        </div>

        <p class="mt-2 truncate text-sm text-muted">
          → https://example.com/2026/posts/why-short-links-still-matter
        </p>

        <div class="mt-5 flex flex-wrap gap-2">
          <Chip icon={<Lock size={12} />}>password</Chip>
          <Chip icon={<Clock size={12} />}>7 days</Chip>
          <Chip icon={<Hash size={12} />}>250 cap</Chip>
        </div>

        <div class="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span class="font-mono text-xs text-muted">clicks</span>
          <span class="font-mono text-sm font-medium tabular-nums">1,204</span>
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, children }: { icon: Child; children: Child }) {
  return (
    <span class="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-2.5 py-1 font-mono text-xs text-muted">
      <span class="text-accent">{icon}</span>
      {children}
    </span>
  );
}

/* ───────────────────────── Deploy anywhere ──────────────────────── */

const HOSTS: { name: string; store: string; icon: Child }[] = [
  { name: "Vercel", store: "Upstash Redis", icon: <Vercel size={14} /> },
  { name: "Cloudflare", store: "Workers KV", icon: <Cloudflare size={18} /> },
  { name: "Railway", store: "Managed Redis", icon: <Railway size={18} /> },
  { name: "Render", store: "Key Value", icon: <Render size={16} /> },
  { name: "Coolify", store: "Bundled Redis", icon: <Coolify size={15} /> },
  { name: "Dokploy", store: "Bundled Redis", icon: <Dokploy size={18} /> },
  { name: "Docker / VPS", store: "Any Redis", icon: <Docker size={18} /> },
];

function DeployAnywhere() {
  return (
    <section class="mx-auto w-full max-w-5xl px-6 py-16 lg:py-20">
      <SectionHeading eyebrow="deploy" title="Run it anywhere." />
      <p class="mt-4 max-w-xl text-balance text-muted">
        One codebase, and each host uses its <span class="text-foreground">native</span>{" "}
        storage — so there&apos;s nothing extra to wire up. From a one-click button
        to <code class="font-mono text-sm text-accent">docker compose up</code>.
      </p>

      <ul class="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {HOSTS.map((h) => (
          <li class="group flex items-center gap-3 rounded-xl border border-border bg-surface/50 p-4 transition-colors hover:border-accent/40 hover:bg-surface">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              {h.icon}
            </span>
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium">{h.name}</span>
              <span class="block truncate font-mono text-xs text-muted">{h.store}</span>
            </span>
          </li>
        ))}
        <li class="flex items-center justify-center rounded-xl border border-dashed border-border p-4 font-mono text-xs text-muted">
          + your own
        </li>
      </ul>
    </section>
  );
}

/* ─────────────────────────── Features ───────────────────────── */

function Features() {
  return (
    <section class="mx-auto w-full max-w-5xl px-6 py-16 lg:py-20">
      <SectionHeading eyebrow="per-link control" title="Small, sharp, and yours." />

      <ul class="mt-9 grid gap-3 sm:grid-cols-3">
        <Feature icon={<Lock size={18} />} title="Password gate">
          Lock any link behind a password. Visitors enter it before the redirect
          fires — guesses are rate-limited.
        </Feature>
        <Feature icon={<Clock size={18} />} title="Expiration">
          Auto-disable a link at a chosen date and time. After that it&apos;s a
          dead end, not a redirect.
        </Feature>
        <Feature icon={<Hash size={18} />} title="Click limits">
          Cap total clicks. The counter is exact, and the link dies the moment it
          hits the cap.
        </Feature>
      </ul>

      <div class="mt-3 grid gap-3 rounded-2xl border border-border bg-surface/50 p-5 sm:grid-cols-3 sm:gap-6">
        <Assurance icon={<ShieldCheck size={16} />} title="Rate-limited sign-in">
          Layered windows per IP throttle owner sign-in and link-password guesses.
        </Assurance>
        <Assurance icon={<KeyRound size={16} />} title="Hashed, never stored">
          Owner and per-link passwords live only as SHA-256 hashes.
        </Assurance>
        <Assurance icon={<Gauge size={16} />} title="Atomic counts">
          Click caps and limiters are exact on Redis — no double-spend.
        </Assurance>
      </div>
    </section>
  );
}

function Feature({ icon, title, children }: { icon: Child; title: string; children: Child }) {
  return (
    <li class="rounded-2xl border border-border bg-surface/50 p-5 backdrop-blur-sm">
      <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
        {icon}
      </div>
      <h3 class="mt-4 font-medium">{title}</h3>
      <p class="mt-1.5 text-sm leading-relaxed text-muted">{children}</p>
    </li>
  );
}

function Assurance({ icon, title, children }: { icon: Child; title: string; children: Child }) {
  return (
    <div>
      <div class="flex items-center gap-2 text-sm font-medium">
        <span class="text-accent">{icon}</span>
        {title}
      </div>
      <p class="mt-1.5 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}

/* ──────────────────────────── Footer ────────────────────────── */

function SiteFooter() {
  return (
    <footer class="mt-auto border-t border-border">
      <div class="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <Wordmark />
        <div class="flex items-center gap-5 text-sm text-muted">
          <a href="/admin" class="transition-colors hover:text-foreground">
            Admin
          </a>
          <a
            href={REPO_LINK}
            class="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <GitHubMark class="h-4 w-4" /> Source
            <ArrowUpRight size={13} />
          </a>
        </div>
        <p class="font-mono text-xs text-muted">MIT © Mendy Landa</p>
      </div>
    </footer>
  );
}

/* ─────────────────────────── Shared ─────────────────────────── */

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <h2 class="mt-3 font-display text-3xl italic tracking-tight sm:text-4xl">{title}</h2>
    </>
  );
}
