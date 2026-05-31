import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">URL Shortener</h1>
      <p className="mt-3 max-w-md text-zinc-500">
        A tiny, self-hosted link shortener running on Next.js + Upstash Redis.
      </p>
      <Link
        href="/admin"
        className="mt-8 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Manage links
      </Link>
    </main>
  );
}
