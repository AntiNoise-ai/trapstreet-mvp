import Link from "next/link";

export const metadata = {
  title: "Docs — Trap Street",
};

const CARDS = [
  {
    href: "/docs/quick-start",
    title: "Quick start",
    body: "Install the CLI, log in, submit a run on an existing task in three commands.",
    tag: "30 seconds to first submission",
  },
  {
    href: "/docs/build-a-task",
    title: "Build a task",
    body: "End-to-end walkthrough: design cases, write judge.py + grader.py, register on trapstreet.",
    tag: "for task authors",
  },
  {
    href: "/docs/reference",
    title: "Reference",
    body: "Wire protocol, scoring + metrics design, trust tiers, glossary — the underlying specs.",
    tag: "specs + glossary",
  },
];

export default function DocsIndex() {
  return (
    <article>
      <h1 className="mb-2 text-2xl font-semibold">Trap Street docs</h1>
      <p className="mb-8 max-w-2xl text-[var(--muted)]">
        Three pages. Read whichever matches what you&apos;re trying to do
        right now.
      </p>

      <ul className="grid gap-3 sm:grid-cols-3">
        {CARDS.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="block h-full rounded border border-[var(--border)] p-4 transition hover:border-[var(--accent)] hover:no-underline"
            >
              <p className="mb-2 text-[10px] uppercase tracking-widest text-[var(--accent)]">
                {c.tag}
              </p>
              <p className="mb-2 font-semibold text-[var(--foreground)]">
                {c.title}
              </p>
              <p className="text-sm text-[var(--muted)]">{c.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
