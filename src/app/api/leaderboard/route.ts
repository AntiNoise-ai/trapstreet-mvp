import { NextRequest } from "next/server";
import { getTask, leaderboardEntries, type SortKey } from "@/lib/queries";
import { ok } from "@/lib/api";
import type { RankingDirection } from "@/db/schema";

const ALLOWED_SORTS: SortKey[] = [
  "total_score",
  "latency_ms",
  "cost_usd",
  "cases_passed",
  "scored_at",
  "passed",
  "no_ranking",
];

export async function GET(req: NextRequest) {
  const track = req.nextUrl.searchParams.get("track") ?? undefined;
  const task_id = req.nextUrl.searchParams.get("task_id") ?? undefined;

  // ?sort=&dir= are the canonical names. We still accept the older
  // ?ranking_metric=&ranking_direction= for backward compat.
  const sortParam =
    req.nextUrl.searchParams.get("sort") ??
    req.nextUrl.searchParams.get("ranking_metric");
  const dirParam =
    req.nextUrl.searchParams.get("dir") ??
    req.nextUrl.searchParams.get("ranking_direction");

  let sort: SortKey | undefined;
  let direction: RankingDirection | undefined;
  if (sortParam && ALLOWED_SORTS.includes(sortParam as SortKey)) {
    sort = sortParam as SortKey;
  }
  if (dirParam === "asc" || dirParam === "desc") {
    direction = dirParam;
  }

  // If filtering to a single task, default to that task's official ranking.
  if (task_id && !sort) {
    const task = await getTask(task_id);
    if (task) {
      sort = task.ranking_metric;
      direction = task.ranking_direction;
    }
  }

  const entries = await leaderboardEntries({ track, task_id, sort, direction });
  return ok({ entries, sort, direction });
}
