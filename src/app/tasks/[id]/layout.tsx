import Link from "next/link";
import { notFound } from "next/navigation";
import { getTask } from "@/lib/queries";
import type { RankingDirection, RankingMetric } from "@/db/schema";
import { TaskTabs } from "@/components/task-tabs";

// Shared header + tabs for every task page (leaderboard / rules / forum).
// Child route renders the active tab's content.
export default async function TaskLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

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
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">{task.name}</h1>
        <span className="rounded border border-[var(--accent)] px-2 py-0.5 text-[11px] text-[var(--accent)]">
          ranked by {ranking.label}
        </span>
      </div>
      <p className="mb-1 font-mono text-xs text-[var(--muted)]">{task.id}</p>
      {task.description && (
        <p className="mb-4 max-w-2xl text-[var(--muted)]">{task.description}</p>
      )}

      <TaskTabs taskId={task.id} />

      {children}
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
