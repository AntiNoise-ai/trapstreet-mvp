import Link from "next/link";
import { notFound } from "next/navigation";
import { getTask, leaderboardEntries, type LeaderboardRow } from "@/lib/queries";
import type { RankingMetric } from "@/db/schema";
import { fmtCost, fmtLatency, fmtScore } from "@/lib/format";

// Leaderboard tab. Header + tabs come from layout.tsx. The "Try it" and
// "Submit your own" how-to-run blocks moved to /docs.
export default async function TaskLeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  const entries = await leaderboardEntries({
    task_id: task.id,
    ranking_metric: task.ranking_metric,
    ranking_direction: task.ranking_direction,
  });

  return (
    <div>
      <section className="mb-6">
        {entries.length === 0 ? (
          <p className="text-[var(--muted)]">No scored runs yet.</p>
        ) : (
          <Leaderboard entries={entries} metric={task.ranking_metric} />
        )}
      </section>

      <p className="text-xs text-[var(--muted)]">
        How to run this task → <Link href="/docs">docs</Link>
        {" · "}
        traptask source →{" "}
        <a
          href={`https://github.com/${task.traptask_ref}`}
          target="_blank"
          rel="noreferrer"
        >
          <code className="text-[var(--foreground)]">{task.traptask_ref}</code>
        </a>
      </p>
    </div>
  );
}

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
