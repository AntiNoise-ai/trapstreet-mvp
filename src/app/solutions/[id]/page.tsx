import Link from "next/link";
import { notFound } from "next/navigation";
import { getSolutionById, listRunsBySolution } from "@/lib/queries";
import {
  fmtCost,
  fmtLatency,
  fmtRelativeTime,
  fmtScore,
} from "@/lib/format";

export default async function SolutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const solution = await getSolutionById(id);
  if (!solution) notFound();

  const runs = await listRunsBySolution(solution.id);

  // Best run per task (for the summary cards above the history table).
  // Same logic as leaderboard dedup — sort by score desc, latency asc,
  // first per task_id wins.
  const sortedForBest = [...runs]
    .filter((r) => r.status === "scored")
    .sort(
      (a, b) =>
        (b.total_score ?? 0) - (a.total_score ?? 0) ||
        (a.latency_ms ?? Infinity) - (b.latency_ms ?? Infinity),
    );
  const bestPerTask = new Map<string, (typeof runs)[number]>();
  for (const r of sortedForBest) {
    if (!bestPerTask.has(r.task_id)) bestPerTask.set(r.task_id, r);
  }

  const totalRuns = runs.length;
  const scoredRuns = runs.filter((r) => r.status === "scored").length;

  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-widest text-[var(--muted)]">
        solution
      </p>
      <h1 className="mb-2 text-2xl font-semibold">{solution.name}</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        {totalRuns} total run{totalRuns === 1 ? "" : "s"} · {scoredRuns}{" "}
        scored · joined {fmtRelativeTime(solution.created_at)}
      </p>

      {bestPerTask.size > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Best per task</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[...bestPerTask.values()].map((r) => (
              <li
                key={r.task_id}
                className="rounded border border-[var(--border)] p-4"
              >
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <Link href={`/tasks/${r.task_id}`} className="font-semibold">
                    {r.task_name}
                  </Link>
                  <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
                    {r.task_id}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span>
                    score{" "}
                    <span className="text-[var(--accent)]">
                      {fmtScore(r.total_score)}
                    </span>
                  </span>
                  <Link
                    href={`/runs/${r.run_id}`}
                    className="text-[var(--muted)]"
                  >
                    {fmtRelativeTime(r.scored_at)} →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">All submissions</h2>
        {runs.length === 0 ? (
          <p className="text-[var(--muted)]">No submissions yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>task</th>
                <th>status</th>
                <th>score</th>
                <th>cases</th>
                <th>latency</th>
                <th>cost</th>
                <th>submitted</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.run_id}>
                  <td>
                    <Link href={`/tasks/${r.task_id}`}>{r.task_name}</Link>
                  </td>
                  <td>
                    {r.status === "scored" ? (
                      r.passed ? (
                        <span className="text-[var(--accent)]">✓ scored</span>
                      ) : (
                        <span className="text-red-400">✗ scored</span>
                      )
                    ) : r.status === "failed" ? (
                      <span className="text-red-400">failed</span>
                    ) : (
                      <span className="text-[var(--muted)]">{r.status}</span>
                    )}
                  </td>
                  <td className="font-medium text-[var(--accent)]">
                    {r.status === "scored" ? fmtScore(r.total_score) : "—"}
                  </td>
                  <td className="text-[var(--muted)]">
                    {r.status === "scored"
                      ? `${r.cases_passed}/${r.cases_passed + r.cases_failed + r.cases_skipped}`
                      : "—"}
                  </td>
                  <td>{fmtLatency(r.latency_ms)}</td>
                  <td>{fmtCost(r.cost_usd)}</td>
                  <td className="text-[var(--muted)]">
                    <Link href={`/runs/${r.run_id}`}>
                      {fmtRelativeTime(r.scored_at ?? r.created_at)}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
