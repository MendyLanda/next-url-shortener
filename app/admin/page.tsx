import { headers } from "next/headers";
import { ShieldAlert, LogOut, CircleAlert } from "lucide-react";
import { isAuthed, isConfigured } from "@/lib/auth";
import { listLinks } from "@/lib/store";
import { loginAction, logoutAction } from "../actions";
import { Wordmark } from "@/components/wordmark";
import { LinkForm } from "@/components/link-form";
import { LinkList } from "@/components/link-list";
import { PasswordField } from "@/components/password-field";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = isConfigured();
  const authed = await isAuthed();

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = `${proto}://${host}`;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <Wordmark />
        {authed && (
          <form action={logoutAction}>
            <button className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground cursor-pointer">
              <LogOut size={15} aria-hidden /> Sign out
            </button>
          </form>
        )}
      </header>

      <div className="mt-10">
        {!configured ? (
          <NotConfigured />
        ) : !authed ? (
          <Login error={error} />
        ) : (
          <Dashboard base={base} />
        )}
      </div>
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="animate-rise rounded-2xl border border-warning/40 bg-warning/10 p-6">
      <div className="flex items-center gap-2 font-semibold text-warning">
        <ShieldAlert size={18} aria-hidden /> Not configured yet
      </div>
      <p className="mt-2 text-sm text-muted">
        Set the{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">ADMIN_PASSWORD</code>{" "}
        environment variable in your Vercel project, then redeploy.
      </p>
    </div>
  );
}

function Login({ error }: { error?: string }) {
  return (
    <div className="mx-auto max-w-sm animate-rise">
      <h1 className="font-display text-2xl italic tracking-tight">Owner sign-in</h1>
      <p className="mt-1 text-sm text-muted">Only you can create links.</p>

      {error && (
        <p
          role="alert"
          className="mt-5 flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error === "ratelimited" ? <ShieldAlert size={15} /> : <CircleAlert size={15} />}
          {error === "ratelimited"
            ? "Too many attempts. Slow down and try again later."
            : "Wrong password."}
        </p>
      )}

      <form action={loginAction} className="mt-5 space-y-4">
        <PasswordField name="password" label="Password" autoFocus required />
        <button className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 cursor-pointer">
          Sign in
        </button>
      </form>
    </div>
  );
}

async function Dashboard({ base }: { base: string }) {
  const links = await listLinks();

  return (
    <div className="animate-rise space-y-10">
      <section>
        <h1 className="font-display text-2xl italic tracking-tight">New link</h1>
        <p className="mb-4 mt-1 text-sm text-muted">
          Paste a URL. Add a password, expiry, or click limit if you need them.
        </p>
        <LinkForm base={base} mode="create" />
      </section>

      <section>
        <h2 className="mb-3 flex items-baseline gap-2 text-sm font-medium text-muted">
          Your links
          <span className="font-mono tabular-nums">({links.length})</span>
        </h2>
        {links.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted">No links yet. Create your first one above.</p>
          </div>
        ) : (
          <LinkList links={links} base={base} />
        )}
      </section>
    </div>
  );
}
