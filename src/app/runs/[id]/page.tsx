import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getRun,
  getRunnerById,
  getTask,
  listCasesForRun,
} from "@/lib/queries";
import { fmtCost, fmtDate, fmtLatency, fmtScore } from "@/lib/format";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) notFound();

  const [task, runner, cases] = await Promise.all([
    getTask(run.task_id),
    getRunnerById(run.runner_id),
    listCasesForRun(run.id),
  ]);

  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-widest text-[var(--muted)]">
        run · <span className="font-mono">{run.id}</span>
      </p>
      <h1 className="mb-1 text-2xl font-semibold">
        {runner?.name ?? run.runner_id}
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        on{" "}
        <Link href={`/tasks/${run.task_id}`}>
          {task ? task.name : run.task_id}
        </Link>
      </p>

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <Stat label="status">
          <StatusPill status={run.status} passed={run.passed} />
        </Stat>
        <Stat label="total score">
          <span className="text-xl text-[var(--accent)]">
            {fmtScore(run.total_score)}
          </span>
        </Stat>
        <Stat label="cases">
          <span className="text-[var(--accent)]">{run.cases_passed}</span>
          <span className="text-[var(--muted)]"> passed</span>
          {run.cases_failed > 0 && (
            <>
              {" · "}
              <span className="text-red-400">{run.cases_failed}</span>
              <span className="text-[var(--muted)]"> failed</span>
            </>
          )}
          {run.cases_skipped > 0 && (
            <>
              {" · "}
              <span>{run.cases_skipped}</span>
              <span className="text-[var(--muted)]"> skipped</span>
            </>
          )}
        </Stat>
        <Stat label="latency">{fmtLatency(run.latency_ms)}</Stat>
        <Stat label="cost">{fmtCost(run.cost_usd)}</Stat>
        <Stat label="tokens">
          {run.token_count !== null ? run.token_count.toLocaleString() : "—"}
        </Stat>
        <Stat label="scored">{fmtDate(run.scored_at)}</Stat>
        <Stat label="duration">
          {run.started_at && run.finished_at
            ? `${Math.round(
                (run.finished_at.getTime() - run.started_at.getTime()) / 1000,
              )}s`
            : "—"}
        </Stat>
      </section>

      {run.error_message && (
        <section className="mb-8 rounded border border-red-500 p-4">
          <p className="mb-1 text-xs uppercase tracking-widest text-red-400">
            error
          </p>
          <p className="font-mono text-sm">{run.error_message}</p>
        </section>
      )}

      {hasContent(run.grader_metrics) && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Run summary</h2>
          <div className="rounded border border-[var(--border)] p-4">
            <GraderMetrics m={run.grader_metrics as Record<string, unknown>} />
          </div>
        </section>
      )}

      {hasContent(run.metadata) && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Solution metadata</h2>
          <p className="mb-3 text-xs text-[var(--muted)]">
            Self-reported by the runner. Not validated.
          </p>
          <div className="rounded border border-[var(--border)] p-4">
            <KeyValueGrid kv={run.metadata as Record<string, unknown>} />
          </div>
        </section>
      )}

      {cases.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Per-case results</h2>
          <table>
            <thead>
              <tr>
                <th>case</th>
                <th>exit</th>
                <th>duration</th>
                <th>metrics</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.case_id}</td>
                  <td className="text-[var(--muted)]">
                    {c.skipped
                      ? "skip"
                      : c.exit_code === 0
                        ? "0"
                        : c.exit_code !== null
                          ? (
                              <span className="text-red-400">{c.exit_code}</span>
                            )
                          : "—"}
                  </td>
                  <td className="text-[var(--muted)]">
                    {c.duration_ms !== null
                      ? `${c.duration_ms} ms`
                      : "—"}
                  </td>
                  <td>
                    <MetricsBadges metrics={c.metrics} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-widest text-[var(--muted)]">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function StatusPill({
  status,
  passed,
}: {
  status: string;
  passed: boolean | null;
}) {
  if (status === "scored") {
    return passed ? (
      <span className="rounded border border-[var(--accent)] px-2 py-0.5 text-xs text-[var(--accent)]">
        scored · passed
      </span>
    ) : (
      <span className="rounded border border-red-500 px-2 py-0.5 text-xs text-red-400">
        scored · failed
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="rounded border border-red-500 px-2 py-0.5 text-xs text-red-400">
        failed
      </span>
    );
  }
  return (
    <span className="rounded border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted)]">
      {status}
    </span>
  );
}

function MetricsBadges({ metrics }: { metrics: unknown }) {
  if (!metrics || typeof metrics !== "object") {
    return <span className="text-[var(--muted)]">—</span>;
  }
  const entries = Object.entries(metrics as Record<string, unknown>);
  return (
    <span className="flex flex-wrap gap-1">
      {entries.map(([k, v]) => (
        <span
          key={k}
          className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[11px]"
        >
          <span className="text-[var(--muted)]">{k}=</span>
          <span
            className={
              v === true
                ? "text-[var(--accent)]"
                : v === false
                  ? "text-red-400"
                  : "text-[var(--foreground)]"
            }
          >
            {String(v)}
          </span>
        </span>
      ))}
    </span>
  );
}

function hasContent(v: unknown): boolean {
  return !!v && typeof v === "object" && Object.keys(v).length > 0;
}

// Renders runs.grader_metrics — well-known keys with friendly labels,
// then anything else as a key=value badge. `by_category` gets a small
// inline breakdown.
const FRIENDLY_LABELS: Record<string, string> = {
  passed: "passed",
  score: "score",
  n_passed: "passed cases",
  n_total: "total cases",
  n_skipped: "skipped cases",
  latency_ms_total: "latency total",
  latency_ms_median: "latency median",
  latency_ms_p95: "latency p95",
  cost_usd_total: "cost total",
  tokens_total: "tokens total",
  threshold: "pass threshold",
};

function GraderMetrics({ m }: { m: Record<string, unknown> }) {
  const wellKnown = Object.entries(m).filter(
    ([k]) => k in FRIENDLY_LABELS,
  );
  const byCategory =
    m.by_category && typeof m.by_category === "object"
      ? (m.by_category as Record<string, number>)
      : null;
  const others = Object.entries(m).filter(
    ([k]) => !(k in FRIENDLY_LABELS) && k !== "by_category",
  );

  return (
    <div className="space-y-3">
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {wellKnown.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-[var(--border)] py-1">
            <dt className="text-[var(--muted)]">{FRIENDLY_LABELS[k]}</dt>
            <dd>{renderMetricValue(k, v)}</dd>
          </div>
        ))}
      </dl>

      {byCategory && Object.keys(byCategory).length > 0 && (
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-widest text-[var(--muted)]">
            score by category
          </p>
          <div className="space-y-1">
            {Object.entries(byCategory).map(([cat, pct]) => (
              <div key={cat} className="flex items-center gap-3 text-xs">
                <span className="w-32 text-[var(--muted)]">{cat}</span>
                <div className="h-2 flex-1 overflow-hidden rounded bg-[var(--border)]">
                  <div
                    className="h-full bg-[var(--accent)]"
                    style={{ width: `${Math.round(pct * 100)}%` }}
                  />
                </div>
                <span className="w-12 text-right">
                  {(pct * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-widest text-[var(--muted)]">
            extras
          </p>
          <MetricsBadges metrics={Object.fromEntries(others)} />
        </div>
      )}
    </div>
  );
}

function renderMetricValue(key: string, v: unknown): React.ReactNode {
  if (typeof v === "boolean") {
    return v ? (
      <span className="text-[var(--accent)]">✓</span>
    ) : (
      <span className="text-red-400">✗</span>
    );
  }
  if (typeof v === "number") {
    if (key.startsWith("latency_ms")) {
      return v < 1000 ? `${v} ms` : `${(v / 1000).toFixed(2)} s`;
    }
    if (key.startsWith("cost_usd")) {
      return `$${v < 0.01 ? v.toFixed(4) : v.toFixed(3)}`;
    }
    if (key === "score" || key === "threshold") {
      return v.toFixed(3);
    }
    return v.toLocaleString();
  }
  return String(v);
}

function KeyValueGrid({ kv }: { kv: Record<string, unknown> }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {Object.entries(kv).map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3 border-b border-[var(--border)] py-1">
          <dt className="text-[var(--muted)]">{k}</dt>
          <dd className="break-all text-right text-[var(--foreground)]">
            {typeof v === "object" ? JSON.stringify(v) : String(v)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
