import Link from "next/link";
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
  Database,
  Cloud,
  Container,
} from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { REPO_LINK } from "@/lib/constants";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
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
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
      <Wordmark />
      <nav className="flex items-center gap-1.5 sm:gap-3">
        <a
          href={REPO_LINK}
          className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground sm:inline-flex"
        >
          <GitHubMark className="h-4 w-4" /> Source
        </a>
        <Link
          href="/admin"
          className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-surface-2"
        >
          Admin
        </Link>
      </nav>
    </header>
  );
}

/* ──────────────────────────── Hero ──────────────────────────── */

function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-14 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-24">
      <div className="animate-rise">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          self-hosted · entirely yours
        </p>
        <h1 className="mt-5 font-display text-5xl italic leading-[1.02] tracking-tight sm:text-6xl">
          Cut your links
          <br />
          down to size.
        </h1>
        <p className="mt-6 max-w-md text-balance text-lg leading-relaxed text-muted">
          A tiny URL shortener you run yourself. Only the owner can add links,
          and every link can carry a password, an expiry, or a hard click limit.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/admin"
            className="group inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.99]"
          >
            Manage links
            <ArrowRight
              size={16}
              aria-hidden
              className="transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </Link>
          <a
            href={REPO_LINK}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            <GitHubMark className="h-4 w-4" /> View source
          </a>
        </div>

        <p className="mt-8 font-mono text-xs text-muted">
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
    <div className="animate-rise [animation-delay:140ms]">
      <div className="animate-float relative overflow-hidden rounded-2xl border border-border bg-surface/80 p-5 shadow-2xl shadow-black/5 backdrop-blur-sm">
        {/* accent hairline + slow light sweep */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 animate-sheen bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent"
        />

        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-muted">cut.example.com</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted">
            <Copy size={13} aria-hidden />
          </span>
        </div>

        <div className="mt-4 font-mono text-xl sm:text-2xl">
          <span className="text-muted">cut.example.com/</span>
          <span className="font-semibold text-accent">launch</span>
          <span className="ml-0.5 inline-block h-5 w-[2px] translate-y-0.5 animate-blink bg-accent align-middle" />
        </div>

        <p className="mt-2 truncate text-sm text-muted">
          → https://example.com/2026/posts/why-short-links-still-matter
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Chip icon={<Lock size={12} aria-hidden />}>password</Chip>
          <Chip icon={<Clock size={12} aria-hidden />}>7 days</Chip>
          <Chip icon={<Hash size={12} aria-hidden />}>250 cap</Chip>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="font-mono text-xs text-muted">clicks</span>
          <span className="font-mono text-sm font-medium tabular-nums">1,204</span>
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-2.5 py-1 font-mono text-xs text-muted">
      <span className="text-accent">{icon}</span>
      {children}
    </span>
  );
}

/* ───────────────────────── Deploy anywhere ──────────────────────── */

const HOSTS: { name: string; store: string; icon: React.ReactNode }[] = [
  { name: "Vercel", store: "Upstash Redis", icon: <Database size={15} aria-hidden /> },
  { name: "Cloudflare", store: "Workers KV", icon: <Cloud size={15} aria-hidden /> },
  { name: "Railway", store: "Managed Redis", icon: <Database size={15} aria-hidden /> },
  { name: "Render", store: "Key Value", icon: <Database size={15} aria-hidden /> },
  { name: "Coolify", store: "Bundled Redis", icon: <Container size={15} aria-hidden /> },
  { name: "Dokploy", store: "Bundled Redis", icon: <Container size={15} aria-hidden /> },
  { name: "Docker / VPS", store: "Any Redis", icon: <Container size={15} aria-hidden /> },
];

function DeployAnywhere() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16 lg:py-20">
      <SectionHeading eyebrow="deploy" title="Run it anywhere." />
      <p className="mt-4 max-w-xl text-balance text-muted">
        One codebase, and each host uses its <span className="text-foreground">native</span>{" "}
        storage — so there&apos;s nothing extra to wire up. From a one-click button
        to <code className="font-mono text-sm text-accent">docker compose up</code>.
      </p>

      <ul className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {HOSTS.map((h) => (
          <li
            key={h.name}
            className="group flex items-center gap-3 rounded-xl border border-border bg-surface/50 p-4 transition-colors hover:border-accent/40 hover:bg-surface"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              {h.icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{h.name}</span>
              <span className="block truncate font-mono text-xs text-muted">{h.store}</span>
            </span>
          </li>
        ))}
        <li className="flex items-center justify-center rounded-xl border border-dashed border-border p-4 font-mono text-xs text-muted">
          + your own
        </li>
      </ul>
    </section>
  );
}

/* ─────────────────────────── Features ───────────────────────── */

function Features() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16 lg:py-20">
      <SectionHeading eyebrow="per-link control" title="Small, sharp, and yours." />

      <ul className="mt-9 grid gap-3 sm:grid-cols-3">
        <Feature icon={<Lock size={18} aria-hidden />} title="Password gate">
          Lock any link behind a password. Visitors enter it before the redirect
          fires — guesses are rate-limited.
        </Feature>
        <Feature icon={<Clock size={18} aria-hidden />} title="Expiration">
          Auto-disable a link at a chosen date and time. After that it&apos;s a
          dead end, not a redirect.
        </Feature>
        <Feature icon={<Hash size={18} aria-hidden />} title="Click limits">
          Cap total clicks. The counter is exact, and the link dies the moment it
          hits the cap.
        </Feature>
      </ul>

      <div className="mt-3 grid gap-3 rounded-2xl border border-border bg-surface/50 p-5 sm:grid-cols-3 sm:gap-6">
        <Assurance icon={<ShieldCheck size={16} aria-hidden />} title="Rate-limited sign-in">
          Layered windows per IP throttle owner sign-in and link-password guesses.
        </Assurance>
        <Assurance icon={<KeyRound size={16} aria-hidden />} title="Hashed, never stored">
          Owner and per-link passwords live only as SHA-256 hashes.
        </Assurance>
        <Assurance icon={<Gauge size={16} aria-hidden />} title="Atomic counts">
          Click caps and limiters are exact on Redis — no double-spend.
        </Assurance>
      </div>
    </section>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-2xl border border-border bg-surface/50 p-5 backdrop-blur-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
        {icon}
      </div>
      <h3 className="mt-4 font-medium">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{children}</p>
    </li>
  );
}

function Assurance({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-accent">{icon}</span>
        {title}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}

/* ──────────────────────────── Footer ────────────────────────── */

function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <Wordmark />
        <div className="flex items-center gap-5 text-sm text-muted">
          <Link href="/admin" className="transition-colors hover:text-foreground">
            Admin
          </Link>
          <a
            href={REPO_LINK}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <GitHubMark className="h-4 w-4" /> Source
            <ArrowUpRight size={13} aria-hidden />
          </a>
        </div>
        <p className="font-mono text-xs text-muted">
          MIT © Mendy Landa
        </p>
      </div>
    </footer>
  );
}

/* ─────────────────────────── Shared ─────────────────────────── */

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl italic tracking-tight sm:text-4xl">{title}</h2>
    </>
  );
}

/** GitHub mark — lucide doesn't ship one, so inline the official glyph. */
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.6 8.21 11.16.6.11.82-.25.82-.56 0-.28-.01-1.02-.02-2-3.34.71-4.04-1.58-4.04-1.58-.55-1.37-1.34-1.74-1.34-1.74-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.21 1.84 1.21 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.67-.3-5.47-1.31-5.47-5.84 0-1.29.47-2.34 1.24-3.17-.12-.3-.54-1.52.12-3.16 0 0 1.01-.32 3.3 1.21a11.5 11.5 0 0 1 6 0c2.29-1.53 3.3-1.21 3.3-1.21.66 1.64.24 2.86.12 3.16.77.83 1.24 1.88 1.24 3.17 0 4.54-2.81 5.54-5.49 5.83.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .31.21.68.83.56A12.04 12.04 0 0 0 24 12.29C24 5.78 18.63.5 12 .5Z" />
    </svg>
  );
}
