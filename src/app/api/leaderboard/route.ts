import { NextRequest } from "next/server";
import { getTask, leaderboardEntries } from "@/lib/queries";
import { ok } from "@/lib/api";
import type { RankingDirection, RankingMetric } from "@/db/schema";

const ALLOWED_METRICS: RankingMetric[] = [
  "total_score",
  "latency_ms",
  "cost_usd",
  "cases_passed",
];

export async function GET(req: NextRequest) {
  const track = req.nextUrl.searchParams.get("track") ?? undefined;
  const task_id = req.nextUrl.searchParams.get("task_id") ?? undefined;

  // If filtering to a task, default to that task's ranking_metric.
  // Caller can still override via ?ranking_metric=... if they want.
  let ranking_metric: RankingMetric | undefined;
  let ranking_direction: RankingDirection | undefined;

  const metricParam = req.nextUrl.searchParams.get("ranking_metric");
  const directionParam = req.nextUrl.searchParams.get("ranking_direction");
  if (metricParam && ALLOWED_METRICS.includes(metricParam as RankingMetric)) {
    ranking_metric = metricParam as RankingMetric;
  }
  if (directionParam === "asc" || directionParam === "desc") {
    ranking_direction = directionParam;
  }

  if (task_id && !ranking_metric) {
    const task = await getTask(task_id);
    if (task) {
      ranking_metric = task.ranking_metric;
      ranking_direction = task.ranking_direction;
    }
  }

  const entries = await leaderboardEntries({
    track,
    task_id,
    ranking_metric,
    ranking_direction,
  });
  return ok({ entries, ranking_metric, ranking_direction });
}
