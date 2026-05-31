import Link from "next/link";
import { ArrowRight, Lock, Clock, Hash } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { REPO_LINK } from "@/lib/constants";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
        <Wordmark />
        <Link
          href="/admin"
          className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-surface-2"
        >
          Admin
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="animate-rise">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            self-hosted · entirely yours
          </p>
          <h1 className="mt-4 font-display text-5xl italic leading-[1.05] tracking-tight sm:text-6xl">
            Cut your links
            <br />
            down to size.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-balance text-muted">
            A tiny URL shortener that&apos;s entirely yours — only the owner can add links,
            and every link can carry a password, an expiry, or a click limit.
          </p>
          <Link
            href="/admin"
            className="group mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.99]"
          >
            Manage links
            <ArrowRight
              size={16}
              aria-hidden
              className="transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <ul className="mt-16 grid w-full gap-3 text-left sm:grid-cols-3">
          <Feature icon={<Lock size={16} aria-hidden />} title="Password gate">
            Lock any link behind a password.
          </Feature>
          <Feature icon={<Clock size={16} aria-hidden />} title="Expiration">
            Auto-disable after a chosen date.
          </Feature>
          <Feature icon={<Hash size={16} aria-hidden />} title="Click limits">
            Cap total clicks, then it dies.
          </Feature>
        </ul>
      </section>

      <footer className="px-6 py-10 text-center">
        <p className="text-xs text-muted">
          Generated with <span className="text-danger">&#9829;</span> by{" "}
          <a
            href={REPO_LINK}
            className="font-medium underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Mendy Landa
          </a>
        </p>
      </footer>
    </main>
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
    <li className="rounded-xl border border-border bg-surface/50 p-4 backdrop-blur-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-0.5 text-xs text-muted">{children}</p>
    </li>
  );
}
