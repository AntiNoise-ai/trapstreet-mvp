export const metadata = {
  title: "Reference — Trap Street docs",
};

const SPECS = [
  {
    title: "Scoring and metrics",
    href: "https://github.com/AntiNoise-ai/trapstreet/blob/main/docs/scoring-and-metrics.md",
    body: "How a task gets scored, what report.json carries on the wire, how the leaderboard picks columns. Zero-config defaults + custom dashboard escape hatch.",
  },
  {
    title: "Trust tiers",
    href: "https://github.com/AntiNoise-ai/trapstreet/blob/main/docs/trust-tiers.md",
    body: "Two tiers: self-reported (free, MVP today) and verified (paid, post-MVP). Cheating mitigations, revenue surface, cost model.",
  },
  {
    title: "Glossary",
    href: "https://github.com/AntiNoise-ai/trapstreet/blob/main/docs/glossary.md",
    body: "Every word in trapstreet, defined once — runner, task, run, case, metric, solution, score, judge, grader, leaderboard.",
  },
  {
    title: "API v0",
    href: "https://github.com/AntiNoise-ai/trapstreet/blob/main/docs/api-v0.md",
    body: "Every HTTP endpoint, request/response shape, status state machine. Stable contract.",
  },
];

const REPOS = [
  {
    title: "Trapstreet MVP (web + CLI monorepo)",
    href: "https://github.com/AntiNoise-ai/trapstreet-mvp",
    body: "This site's source. Web in /, CLI in /cli.",
  },
  {
    title: "Trapstreet tasks",
    href: "https://github.com/AntiNoise-ai/trapstreet-tasks",
    body: "Community task definitions — traptask.yaml + judge.py + grader.py + cases. Add yours via /tasks/new.",
  },
  {
    title: "trapstreet-cli on PyPI",
    href: "https://pypi.org/project/trapstreet-cli/",
    body: "The tp command. uv tool install trapstreet-cli.",
  },
];

export default function ReferencePage() {
  return (
    <article>
      <h1 className="mb-2 text-2xl font-semibold">Reference</h1>
      <p className="mb-8 max-w-2xl text-[var(--muted)]">
        The specs the platform is built on. Each is a single Markdown
        document in the <code className="text-[var(--foreground)]">trapstreet</code>{" "}
        design repo.
      </p>

      <section className="mb-10">
        <h2 className="mb-3 text-sm uppercase tracking-widest text-[var(--muted)]">
          design docs
        </h2>
        <ul className="space-y-3">
          {SPECS.map((s) => (
            <li
              key={s.href}
              className="rounded border border-[var(--border)] p-4"
            >
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="mb-1 block font-semibold text-[var(--foreground)] hover:text-[var(--accent)] hover:no-underline"
              >
                {s.title} ↗
              </a>
              <p className="text-sm text-[var(--muted)]">{s.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-widest text-[var(--muted)]">
          repos
        </h2>
        <ul className="space-y-3">
          {REPOS.map((r) => (
            <li
              key={r.href}
              className="rounded border border-[var(--border)] p-4"
            >
              <a
                href={r.href}
                target="_blank"
                rel="noreferrer"
                className="mb-1 block font-semibold text-[var(--foreground)] hover:text-[var(--accent)] hover:no-underline"
              >
                {r.title} ↗
              </a>
              <p className="text-sm text-[var(--muted)]">{r.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
