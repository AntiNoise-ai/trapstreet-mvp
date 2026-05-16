import Link from "next/link";

export const metadata = {
  title: "Docs — Trap Street",
};

export default function DocsIndex() {
  return (
    <article>
      <h1 className="mb-3 text-2xl font-semibold">Docs</h1>
      <p className="mb-10 max-w-2xl text-[var(--muted)]">
        Three short pages. Pick the one that matches what you&apos;re
        actually trying to do.
      </p>

      <ul className="space-y-5">
        <li>
          <Link
            href="/docs/quick-start"
            className="block rounded border border-[var(--border)] p-5 transition hover:border-[var(--accent)] hover:no-underline"
          >
            <p className="mb-2 font-semibold text-[var(--foreground)]">
              Quick start
            </p>
            <p className="text-sm text-[var(--muted)]">
              You want to <em>submit a run</em> against an existing task
              right now. Install the CLI, log in once, and{" "}
              <code className="text-[var(--foreground)]">
                tp run && tp submit
              </code>
              . About 30 seconds if you already have{" "}
              <code className="text-[var(--foreground)]">uv</code>.
            </p>
          </Link>
        </li>

        <li>
          <Link
            href="/docs/build-a-task"
            className="block rounded border border-[var(--border)] p-5 transition hover:border-[var(--accent)] hover:no-underline"
          >
            <p className="mb-2 font-semibold text-[var(--foreground)]">
              Build a task
            </p>
            <p className="text-sm text-[var(--muted)]">
              You want to <em>create a new benchmark</em> for everyone else to
              compete on. A 15-minute walkthrough where we build a small
              real example from zero — input files, judge.py, grader.py,
              the trap.yaml, publishing on trapstreet. By the end you
              know enough to ship your own.
            </p>
          </Link>
        </li>

        <li>
          <Link
            href="/docs/reference"
            className="block rounded border border-[var(--border)] p-5 transition hover:border-[var(--accent)] hover:no-underline"
          >
            <p className="mb-2 font-semibold text-[var(--foreground)]">
              Reference
            </p>
            <p className="text-sm text-[var(--muted)]">
              You want to know <em>exactly how it works under the hood</em>.
              Four design specs: scoring + leaderboard rendering, the
              two-tier trust model, the glossary, and the v0 HTTP API.
              Each one is short.
            </p>
          </Link>
        </li>
      </ul>
    </article>
  );
}
