import { notFound, redirect } from "next/navigation";
import { Lock, Clock, Ban, ShieldAlert } from "lucide-react";
import { getLink, getClicks, linkStatus, consumeClick } from "@/lib/store";
import { Wordmark } from "@/components/wordmark";
import { UnlockForm } from "@/components/unlock-form";

export const dynamic = "force-dynamic";

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm animate-rise">
        <div className="mb-8 flex justify-center">
          <Wordmark />
        </div>
        {children}
      </div>
    </main>
  );
}

function Card({
  icon,
  tone,
  title,
  children,
}: {
  icon: React.ReactNode;
  tone: "danger" | "warning" | "neutral";
  title: string;
  children?: React.ReactNode;
}) {
  const ring =
    tone === "danger"
      ? "text-danger bg-danger/10"
      : tone === "warning"
        ? "text-warning bg-warning/10"
        : "text-accent bg-accent-soft";
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-8 text-center backdrop-blur-sm">
      <div className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${ring}`}>
        {icon}
      </div>
      <h1 className="text-lg font-semibold">{title}</h1>
      {children}
    </div>
  );
}

export default async function SlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;

  const rec = await getLink(slug);
  if (!rec) notFound();

  const status = linkStatus(rec, await getClicks(slug));

  if (status === "expired") {
    return (
      <Centered>
        <Card icon={<Clock size={22} aria-hidden />} tone="warning" title="This link has expired">
          <p className="mt-2 text-sm text-muted">
            The owner set it to stop working after a certain date.
          </p>
        </Card>
      </Centered>
    );
  }

  if (status === "maxed") {
    return (
      <Centered>
        <Card icon={<Ban size={22} aria-hidden />} tone="danger" title="This link is no longer active">
          <p className="mt-2 text-sm text-muted">It reached its maximum number of clicks.</p>
        </Card>
      </Centered>
    );
  }

  // Password-gated: render the unlock form instead of redirecting.
  if (rec.passwordHash) {
    return (
      <Centered>
        <Card
          icon={<Lock size={22} aria-hidden />}
          tone="neutral"
          title="This link is protected"
        >
          <p className="mb-5 mt-2 text-sm text-muted">
            Enter the password to continue to your destination.
          </p>
          {error === "ratelimited" ? (
            <p
              role="alert"
              className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              <ShieldAlert size={15} aria-hidden /> Too many attempts. Wait a minute.
            </p>
          ) : (
            error === "invalid" && (
              <p
                role="alert"
                className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                Incorrect password. Try again.
              </p>
            )
          )}
          <UnlockForm slug={slug} />
        </Card>
      </Centered>
    );
  }

  // Open link: count the click and send them on their way.
  if (!(await consumeClick(slug, rec))) {
    return (
      <Centered>
        <Card icon={<Ban size={22} aria-hidden />} tone="danger" title="This link is no longer active">
          <p className="mt-2 text-sm text-muted">It reached its maximum number of clicks.</p>
        </Card>
      </Centered>
    );
  }

  redirect(rec.url);
}
