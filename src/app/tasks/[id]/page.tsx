import Link from "next/link";
import { notFound } from "next/navigation";
import { getTask, leaderboardEntries, type LeaderboardRow } from "@/lib/queries";
import type { RankingMetric } from "@/db/schema";
import { fmtCost, fmtLatency, fmtRelativeTime, fmtScore } from "@/lib/format";

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

      <p className="mb-2 text-xs text-[var(--muted)]">
        {task.ranking_metric === "no_ranking"
          ? "Classification task — submissions shown newest first, not ranked."
          : "Each row is a runner's best run on this task. Click a runner to see their full submission history."}
      </p>

      <p className="text-xs text-[var(--muted)]">
        How to run this task → <Link href="/docs">docs</Link>
        {" · "}
        traptask source →{" "}
        <a href={traptaskHref(task.traptask_ref)} target="_blank" rel="noreferrer">
          <code className="text-[var(--foreground)]">{task.traptask_ref}</code>
        </a>
      </p>
    </div>
  );
}

// GitHub needs `/tree/<branch>/` to navigate into a subdirectory — without
// it, `github.com/<owner>/<repo>/<path>` 404s. We store traptask_ref as the
// compact `owner/repo/path` shape, so insert the missing segment here.
// Default branch = main; covers ~all public repos we care about.
function traptaskHref(ref: string): string {
  const parts = ref.split("/").filter(Boolean);
  if (parts.length <= 2) return `https://github.com/${ref}`;
  const [owner, repo, ...rest] = parts;
  return `https://github.com/${owner}/${repo}/tree/main/${rest.join("/")}`;
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
          <th>solution</th>
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
          <th>submitted</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.run_id}>
            <td className="text-[var(--muted)]">{e.rank}</td>
            <td className="font-medium">
              {/* Solution (runner.name) is the primary id; the human's
                  display name appears as a secondary line below. */}
              <Link href={`/runners/${e.runner_id}`}>{e.runner_name}</Link>
              {e.user_name && (
                <div className="text-[11px] font-normal text-[var(--muted)]">
                  by {e.user_name}
                </div>
              )}
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
            <td className="text-[var(--muted)]">
              <Link href={`/runs/${e.run_id}`}>{fmtRelativeTime(e.scored_at)}</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
