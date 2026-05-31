import { headers } from "next/headers";
import { isAuthed, isConfigured } from "@/lib/auth";
import { redis, LINKS_KEY, CLICKS_KEY, type Links, type Clicks } from "@/lib/redis";
import { loginAction, logoutAction, createLinkAction, deleteLinkAction } from "../actions";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  invalid: "Wrong password.",
  url: "Enter a valid URL.",
  slug: "Slug can only contain letters, numbers and dashes.",
  exists: "That slug is already taken.",
};

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
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        {authed && (
          <form action={logoutAction}>
            <button className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
              Sign out
            </button>
          </form>
        )}
      </div>

      {error && ERRORS[error] && (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {ERRORS[error]}
        </p>
      )}

      {!configured ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-medium">Not configured yet.</p>
          <p className="mt-1">
            Set the <code className="font-mono">ADMIN_PASSWORD</code> environment variable, then
            redeploy.
          </p>
        </div>
      ) : !authed ? (
        <LoginForm />
      ) : (
        <Dashboard base={base} />
      )}
    </main>
  );
}

function LoginForm() {
  return (
    <form action={loginAction} className="space-y-4">
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Owner password
        <input
          type="password"
          name="password"
          autoFocus
          required
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
        />
      </label>
      <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
        Sign in
      </button>
    </form>
  );
}

async function Dashboard({ base }: { base: string }) {
  const links = ((await redis.hgetall<Links>(LINKS_KEY)) ?? {}) as Links;
  const clicks = ((await redis.hgetall<Clicks>(CLICKS_KEY)) ?? {}) as Clicks;
  const slugs = Object.keys(links).sort();

  return (
    <div className="space-y-10">
      <form action={createLinkAction} className="space-y-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Destination URL
          </label>
          <input
            name="url"
            placeholder="https://example.com/some/long/page"
            required
            className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Custom slug <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-zinc-400">{base}/</span>
            <input
              name="slug"
              placeholder="auto-generated"
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
            />
          </div>
        </div>
        <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
          Create short link
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-500">
          {slugs.length} {slugs.length === 1 ? "link" : "links"}
        </h2>
        {slugs.length === 0 ? (
          <p className="text-sm text-zinc-400">No links yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {slugs.map((slug) => (
              <li key={slug} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <a
                    href={`/${slug}`}
                    className="font-mono text-sm font-medium hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    /{slug}
                  </a>
                  <p className="truncate text-xs text-zinc-400">{links[slug]}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="text-xs tabular-nums text-zinc-400">
                    {Number(clicks[slug] ?? 0)} clicks
                  </span>
                  <form action={deleteLinkAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <button className="text-xs text-zinc-400 hover:text-red-600">Delete</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
