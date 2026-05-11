import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTask,
  leaderboardEntries,
  listThreadsForSubject,
  type LeaderboardRow,
} from "@/lib/queries";
import type { RankingDirection, RankingMetric } from "@/db/schema";
import { fmtCost, fmtLatency, fmtScore } from "@/lib/format";

// Task page — speedrun.com game-page analogue. Each task has its own
// ranking metric + rules, so the leaderboard sort and tiebreakers differ
// from one task to the next.
export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  const [entries, threads] = await Promise.all([
    leaderboardEntries({
      task_id: task.id,
      ranking_metric: task.ranking_metric,
      ranking_direction: task.ranking_direction,
    }),
    listThreadsForSubject("task", task.id),
  ]);

  const repoUrl = `https://github.com/${task.traptask_ref}`;
  const ranking = describeRanking(task.ranking_metric, task.ranking_direction);

  return (
    <div>
      <div className="mb-2 flex items-baseline gap-3">
        <Link
          href={`/?track=${encodeURIComponent(task.track)}`}
          className="text-[10px] uppercase tracking-widest text-[var(--muted)]"
        >
          ← {task.track}
        </Link>
      </div>
      <h1 className="mb-2 text-2xl font-semibold">{task.name}</h1>
      <p className="mb-1 font-mono text-xs text-[var(--muted)]">{task.id}</p>
      {task.description && (
        <p className="mb-6 max-w-2xl text-[var(--muted)]">{task.description}</p>
      )}

      <section className="mb-10">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Leaderboard</h2>
          <span className="rounded border border-[var(--accent)] px-2 py-0.5 text-[11px] text-[var(--accent)]">
            ranked by {ranking.label}
          </span>
        </div>
        {entries.length === 0 ? (
          <p className="text-[var(--muted)]">No scored runs yet.</p>
        ) : (
          <Leaderboard
            entries={entries}
            metric={task.ranking_metric}
          />
        )}
      </section>

      {task.rules_md && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Rules</h2>
          <div className="rounded border border-[var(--border)] p-5">
            <RulesBlock md={task.rules_md} />
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Submit a run</h2>
        <p className="mb-3 text-sm text-[var(--muted)]">
          From your solution dir (<code className="text-[var(--foreground)]">trap.yaml</code> pointing at{" "}
          <a href={repoUrl} target="_blank" rel="noreferrer">
            <code className="text-[var(--foreground)]">{task.traptask_ref}</code>
          </a>
          ):
        </p>
        <pre className="overflow-x-auto rounded border border-[var(--border)] bg-black/40 p-4 text-xs">
{`tp run && tp submit ${task.id}`}
        </pre>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Needs <code className="text-[var(--foreground)]">TRAPSTREET_API_KEY</code> set —
          see <Link href="/">quick start on home</Link> for installation. Returns a{" "}
          <code className="text-[var(--foreground)]">view_url</code> linking back to this
          task&apos;s leaderboard once the run is scored.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Discussion</h2>
          <Link
            href={`/threads?subject_type=task&subject_id=${task.id}`}
            className="text-xs"
          >
            see all →
          </Link>
        </div>
        {threads.length === 0 ? (
          <p className="text-[var(--muted)]">No discussion yet.</p>
        ) : (
          <ul className="space-y-1">
            {threads.map((t) => (
              <li key={t.id}>
                <Link href={`/threads/${t.id}`}>{t.title}</Link>{" "}
                <span className="text-[var(--muted)]">
                  · {t.comment_count} comments
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function describeRanking(
  metric: RankingMetric,
  direction: RankingDirection,
): { label: string } {
  const arrow = direction === "desc" ? "↓" : "↑";
  switch (metric) {
    case "total_score":
      return { label: `score ${arrow}` };
    case "latency_ms":
      return { label: `latency ${arrow}` };
    case "cost_usd":
      return { label: `cost ${arrow}` };
    case "cases_passed":
      return { label: `cases passed ${arrow}` };
  }
}

// Leaderboard with the ranking-metric column emphasised in accent color
// and put first (after runner). Other columns are dimmer.
function Leaderboard({
  entries,
  metric,
}: {
  entries: LeaderboardRow[];
  metric: RankingMetric;
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>runner</th>
          <th className={metric === "total_score" ? "text-[var(--accent)]" : ""}>
            score
          </th>
          <th>pass</th>
          <th>cases</th>
          <th className={metric === "latency_ms" ? "text-[var(--accent)]" : ""}>
            latency
          </th>
          <th className={metric === "cost_usd" ? "text-[var(--accent)]" : ""}>
            cost
          </th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.run_id}>
            <td className="text-[var(--muted)]">{e.rank}</td>
            <td className="font-medium">
              <Link href={`/runs/${e.run_id}`}>{e.runner_name}</Link>
            </td>
            <td
              className={
                metric === "total_score"
                  ? "font-medium text-[var(--accent)]"
                  : ""
              }
            >
              {fmtScore(e.total_score)}
            </td>
            <td>
              {e.passed === true ? (
                <span className="text-[var(--accent)]">✓</span>
              ) : e.passed === false ? (
                <span className="text-red-400">✗</span>
              ) : (
                <span className="text-[var(--muted)]">—</span>
              )}
            </td>
            <td className="text-[var(--muted)]">
              {e.cases_passed}
              <span className="text-[var(--border)]">
                /{e.cases_passed + e.cases_failed + e.cases_skipped}
              </span>
            </td>
            <td
              className={
                metric === "latency_ms" ? "font-medium text-[var(--accent)]" : ""
              }
            >
              {fmtLatency(e.latency_ms)}
            </td>
            <td
              className={
                metric === "cost_usd" ? "font-medium text-[var(--accent)]" : ""
              }
            >
              {fmtCost(e.cost_usd)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Render rules text with very basic Markdown — H2, list, code, bold —
// without pulling in a dependency. Anything fancier just falls through
// as preserved-whitespace text.
function RulesBlock({ md }: { md: string }) {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let listBuf: string[] = [];

  const flushList = () => {
    if (listBuf.length === 0) return;
    out.push(
      <ul key={`ul-${out.length}`} className="mb-3 list-disc space-y-1 pl-5">
        {listBuf.map((item, i) => (
          <li key={i} className="text-sm">
            {renderInline(item)}
          </li>
        ))}
      </ul>,
    );
    listBuf = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("## ")) {
      flushList();
      out.push(
        <h3
          key={`h-${out.length}`}
          className="mb-2 mt-4 text-sm uppercase tracking-widest text-[var(--muted)] first:mt-0"
        >
          {line.slice(3)}
        </h3>,
      );
    } else if (line.startsWith("- ")) {
      listBuf.push(line.slice(2));
    } else if (line === "") {
      flushList();
    } else {
      flushList();
      out.push(
        <p key={`p-${out.length}`} className="mb-2 text-sm">
          {renderInline(line)}
        </p>,
      );
    }
  }
  flushList();
  return <div>{out}</div>;
}

// Inline `code` and **bold** only. Keeps the parser tiny.
function renderInline(s: string): React.ReactNode[] {
  const tokens = s.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return tokens.map((t, i) => {
    if (t.startsWith("`") && t.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-black/40 px-1 text-[var(--foreground)]"
        >
          {t.slice(1, -1)}
        </code>
      );
    }
    if (t.startsWith("**") && t.endsWith("**")) {
      return (
        <strong key={i} className="text-[var(--foreground)]">
          {t.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{t}</span>;
  });
}
