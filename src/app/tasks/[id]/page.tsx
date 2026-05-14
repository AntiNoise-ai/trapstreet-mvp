import Link from "next/link";
import { notFound } from "next/navigation";
import { getTask, leaderboardEntries, type LeaderboardRow } from "@/lib/queries";
import type { RankingMetric } from "@/db/schema";
import { fmtCost, fmtLatency, fmtScore } from "@/lib/format";
import { CopyableCode } from "@/components/copyable-code";

// Leaderboard tab. Header + tabs come from layout.tsx.
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

  // For tasks that ship a reference solution (echo, word-count),
  // construct a clone-and-run one-liner. The url shape is
  // `<owner>/<repo>/<...path...>/solution` — the first 2 segments are
  // the GitHub repo, the rest is the path within it.
  const oneLiner = task.reference_solution_ref
    ? makeOneLiner(task.reference_solution_ref, task.id)
    : null;

  return (
    <div>
      <section className="mb-10">
        {entries.length === 0 ? (
          <p className="text-[var(--muted)]">No scored runs yet.</p>
        ) : (
          <Leaderboard entries={entries} metric={task.ranking_metric} />
        )}
      </section>

      {oneLiner && (
        <section className="mb-10">
          <h2 className="mb-1 text-lg font-semibold">Try it</h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            Clone the reference solution, run it, and put your score on
            the board — one command:
          </p>
          <CopyableCode code={oneLiner} />
          <p className="mt-2 text-xs text-[var(--muted)]">
            Requires{" "}
            <Link href="/">
              <code className="text-[var(--foreground)]">tp</code> installed
              and <code className="text-[var(--foreground)]">tp login</code>
            </Link>{" "}
            done once.
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-1 text-lg font-semibold">Submit your own run</h2>
        <p className="mb-3 text-sm text-[var(--muted)]">
          Point a{" "}
          <code className="text-[var(--foreground)]">trap.yaml</code> at this
          task&apos;s traptask (
          <a
            href={`https://github.com/${task.traptask_ref}`}
            target="_blank"
            rel="noreferrer"
          >
            <code className="text-[var(--foreground)]">{task.traptask_ref}</code>
          </a>
          ) and from that solution dir:
        </p>
        <CopyableCode code={`tp run && tp submit ${task.id}`} />
        <p className="mt-2 text-xs text-[var(--muted)]">
          The local trap.yaml task name must match the trapstreet task_id
          (<code className="text-[var(--foreground)]">{task.id}</code>) so
          <code className="text-[var(--foreground)]"> tp submit</code>{" "}
          finds the right{" "}
          <code className="text-[var(--foreground)]">.trap/&lt;id&gt;/latest/report.json</code>.
        </p>
      </section>
    </div>
  );
}

// "AntiNoise-ai/trapstreet-mvp/cli/examples/word-count/solution"
//   → owner/repo = "AntiNoise-ai/trapstreet-mvp", subdir = "cli/examples/word-count/solution"
function makeOneLiner(refSolutionRef: string, taskId: string): string {
  const parts = refSolutionRef.split("/");
  if (parts.length < 3) {
    // Malformed — return a sensible fallback that at least clones the repo
    return `git clone --depth=1 https://github.com/${refSolutionRef}.git && tp run && tp submit ${taskId}`;
  }
  const repo = `${parts[0]}/${parts[1]}`;
  const subdir = parts.slice(2).join("/");
  const repoName = parts[1];
  return (
    `git clone --depth=1 https://github.com/${repo}.git && ` +
    `cd ${repoName}/${subdir} && ` +
    `tp run && tp submit`
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
