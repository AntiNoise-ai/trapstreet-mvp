export const metadata = {
  title: "Reference — Trap Street docs",
};

export default function ReferencePage() {
  return (
    <article className="space-y-10">
      <header>
        <h1 className="mb-2 text-2xl font-semibold">Reference</h1>
        <p className="max-w-2xl text-[var(--muted)]">
          The four design docs that decide how Trap Street works under
          the hood. Most days you won&apos;t need these. They&apos;re here for
          when you do.
        </p>
      </header>

      <Spec
        title="Scoring and metrics"
        href="https://github.com/AntiNoise-ai/trapstreet/blob/main/docs/scoring-and-metrics.md"
      >
        How a task gets scored and what the leaderboard shows. The
        short version: your{" "}
        <Code>grader.py</Code> prints a JSON object with{" "}
        <Code>{"{passed, score, ...}"}</Code>, server picks up
        well-known keys (<Code>cost_usd_total</Code>,{" "}
        <Code>latency_ms_total</Code>,{" "}
        <Code>by_category</Code>, …) and renders columns. No
        configuration needed for 90% of tasks. The doc covers the
        full key list, the wire format the CLI uploads, and the
        opt-in <Code>dashboard:</Code> block for tasks that need
        custom columns.
      </Spec>

      <Spec
        title="Trust tiers"
        href="https://github.com/AntiNoise-ai/trapstreet/blob/main/docs/trust-tiers.md"
      >
        Two tiers, one axis: who runs the eval. <strong>Self-reported</strong>{" "}
        (free, default today) — you run on your machine, we record
        what you upload. <strong>Verified</strong> (paid, post-MVP) —
        we run in a sandbox with held-out inputs and an LLM-API proxy
        so the numbers are ground truth, not self-report. The doc
        explains the economics (~50× cost reduction vs all-we-run)
        and the cheating mitigations.
      </Spec>

      <Spec
        title="Glossary"
        href="https://github.com/AntiNoise-ai/trapstreet/blob/main/docs/glossary.md"
      >
        Every word in trapstreet, defined once. Solution, task, run,
        case, metric, judge, grader, leaderboard, solution. Two
        pages. Useful when a term in the UI doesn&apos;t mean what
        you&apos;d guess (especially <Code>passed</Code> — it&apos;s
        whatever the grader decides, not exit-code-based).
      </Spec>

      <Spec
        title="API v0"
        href="https://github.com/AntiNoise-ai/trapstreet/blob/main/docs/api-v0.md"
      >
        Every HTTP endpoint, request/response shape, status state
        machine. The CLI talks to this; if you build a custom uploader
        or a CI integration, this is the contract. Stable —
        breaking changes get a v1.
      </Spec>

      <Repos />
    </article>
  );
}

function Spec({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <p className="mb-3 text-sm text-[var(--muted)]">{children}</p>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-xs"
      >
        Full spec on GitHub →
      </a>
    </section>
  );
}

function Repos() {
  return (
    <section>
      <h2 className="mb-3 text-sm uppercase tracking-widest text-[var(--muted)]">
        repos
      </h2>
      <ul className="space-y-2 text-sm">
        <li>
          <a
            href="https://github.com/AntiNoise-ai/trapstreet-mvp"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--foreground)]"
          >
            trapstreet-mvp
          </a>{" "}
          <span className="text-[var(--muted)]">
            — this site (web + CLI monorepo)
          </span>
        </li>
        <li>
          <a
            href="https://github.com/AntiNoise-ai/trapstreet-tasks"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--foreground)]"
          >
            trapstreet-tasks
          </a>{" "}
          <span className="text-[var(--muted)]">
            — community task definitions
          </span>
        </li>
        <li>
          <a
            href="https://pypi.org/project/trapstreet-cli/"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--foreground)]"
          >
            trapstreet-cli on PyPI
          </a>{" "}
          <span className="text-[var(--muted)]">
            — the <Code>tp</Code> command
          </span>
        </li>
      </ul>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-black/40 px-1 text-[var(--foreground)]">
      {children}
    </code>
  );
}
