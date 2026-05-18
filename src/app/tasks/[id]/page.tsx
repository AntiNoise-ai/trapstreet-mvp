import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTask,
  leaderboardEntries,
  type LeaderboardRow,
  type SortKey,
} from "@/lib/queries";
import type { RankingDirection } from "@/db/schema";
import { fmtCost, fmtLatency, fmtRelativeTime, fmtScore } from "@/lib/format";
import { ProfileList, type Direction } from "@/components/profile-list";

// Leaderboard tab. Header + tabs come from layout.tsx. The "Try it" and
// "Submit your own" how-to-run blocks moved to /docs.
export default async function TaskLeaderboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const task = await getTask(id);
  if (!task) notFound();

  // For no_ranking (classification / self-profile) tasks, we always
  // fetch newest-first in SQL and let ProfileList do client-side sort
  // on whatever leaf in grader_metrics the URL points at. The sort key
  // there can be any path like "mbti_type" or "percentages.E_I.I" —
  // outside the SQL SortKey vocabulary.
  if (task.ranking_metric === "no_ranking") {
    const entries = await leaderboardEntries({
      task_id: task.id,
      sort: "no_ranking",
    });
    const sortKey = sp.sort?.trim() || null;
    const sortDir: Direction = sp.dir === "asc" ? "asc" : "desc";
    return (
      <ProfilesView
        entries={entries}
        taskId={task.id}
        sortKey={sortKey}
        sortDir={sortDir}
        traptaskRef={task.traptask_ref}
      />
    );
  }

  // Resolve effective sort: URL params override, otherwise fall back to
  // the task's official ranking_metric / direction.
  const sort = parseSort(sp.sort) ?? task.ranking_metric;
  const direction =
    parseDir(sp.dir) ??
    (sp.sort ? defaultDir(sort) : task.ranking_direction);
  const isDefaultSort =
    sort === task.ranking_metric && direction === task.ranking_direction;

  const entries = await leaderboardEntries({
    task_id: task.id,
    sort,
    direction,
  });

  return (
    <div>
      <section className="mb-6">
        {entries.length === 0 ? (
          <p className="text-[var(--muted)]">No scored runs yet.</p>
        ) : (
          <Leaderboard
            entries={entries}
            taskId={task.id}
            sort={sort}
            direction={direction}
            isDefaultSort={isDefaultSort}
          />
        )}
      </section>

      <p className="mb-2 text-xs text-[var(--muted)]">
        Each row is a solution&apos;s best run on this task. Click a column
        header to re-sort. Click a solution to see their full submission
        history.
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

function ProfilesView({
  entries,
  taskId,
  sortKey,
  sortDir,
  traptaskRef,
}: {
  entries: LeaderboardRow[];
  taskId: string;
  sortKey: string | null;
  sortDir: Direction;
  traptaskRef: string;
}) {
  return (
    <div>
      <p className="mb-4 text-xs text-[var(--muted)]">
        {entries.length}{" "}
        {entries.length === 1 ? "submission" : "submissions"}
      </p>
      <section className="mb-6">
        {entries.length === 0 ? (
          <p className="text-[var(--muted)]">No submissions yet.</p>
        ) : (
          <ProfileList
            entries={entries}
            taskId={taskId}
            sortKey={sortKey}
            sortDir={sortDir}
          />
        )}
      </section>

      <p className="mb-2 text-xs text-[var(--muted)]">
        Classification / self-profile task — not ranked. Columns are
        auto-derived from each submission&apos;s grader.py output; click
        any column header to re-sort. Click a solution to see their
        submission history.
      </p>

      <p className="text-xs text-[var(--muted)]">
        How to run this task → <Link href="/docs">docs</Link>
        {" · "}
        traptask source →{" "}
        <a href={traptaskHref(traptaskRef)} target="_blank" rel="noreferrer">
          <code className="text-[var(--foreground)]">{traptaskRef}</code>
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

const SORT_KEYS = new Set<SortKey>([
  "total_score",
  "latency_ms",
  "cost_usd",
  "cases_passed",
  "scored_at",
  "passed",
  "no_ranking",
]);

function parseSort(s: string | undefined): SortKey | null {
  if (!s) return null;
  return SORT_KEYS.has(s as SortKey) ? (s as SortKey) : null;
}

function parseDir(s: string | undefined): RankingDirection | null {
  return s === "asc" || s === "desc" ? s : null;
}

// Sensible default direction per column when a user first clicks it.
// "higher is better" columns default to desc, "lower is better" to asc.
function defaultDir(sort: SortKey): RankingDirection {
  switch (sort) {
    case "latency_ms":
    case "cost_usd":
      return "asc";
    default:
      return "desc";
  }
}

interface SortableColumn {
  label: string;
  key: SortKey;
}

const COLUMNS: SortableColumn[] = [
  { label: "score", key: "total_score" },
  { label: "pass", key: "passed" },
  { label: "cases", key: "cases_passed" },
  { label: "latency", key: "latency_ms" },
  { label: "cost", key: "cost_usd" },
  { label: "submitted", key: "scored_at" },
];

function Leaderboard({
  entries,
  taskId,
  sort,
  direction,
  isDefaultSort,
}: {
  entries: LeaderboardRow[];
  taskId: string;
  sort: SortKey;
  direction: RankingDirection;
  isDefaultSort: boolean;
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>solution</th>
          {COLUMNS.map((col) => (
            <SortHeader
              key={col.key}
              col={col}
              activeSort={sort}
              activeDir={direction}
              taskId={taskId}
              isDefaultSort={isDefaultSort}
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.run_id}>
            <td className="text-[var(--muted)]">{e.rank}</td>
            <td className="font-medium">
              {/* Solution (solution.name) is the primary id; the human's
                  display name and the source-repo link sit below. */}
              <Link href={`/solutions/${e.solution_id}`}>{e.solution_name}</Link>
              <SolutionSubline e={e} />
            </td>
            <td
              className={
                sort === "total_score" ? "font-medium text-[var(--accent)]" : ""
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
                sort === "latency_ms" ? "font-medium text-[var(--accent)]" : ""
              }
            >
              {fmtLatency(e.latency_ms)}
            </td>
            <td
              className={
                sort === "cost_usd" ? "font-medium text-[var(--accent)]" : ""
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

function SortHeader({
  col,
  activeSort,
  activeDir,
  taskId,
  isDefaultSort,
}: {
  col: SortableColumn;
  activeSort: SortKey;
  activeDir: RankingDirection;
  taskId: string;
  isDefaultSort: boolean;
}) {
  const active = col.key === activeSort;
  // When clicking the active column, flip direction. When clicking a
  // new column, use that column's natural default direction.
  const nextDir: RankingDirection = active
    ? activeDir === "desc"
      ? "asc"
      : "desc"
    : defaultDir(col.key);
  // Clicking the active column while already in its default state =
  // clear the override so we go back to the task's official ranking.
  const goingBackToDefault =
    active && isDefaultSort && nextDir === defaultDir(col.key);
  const href = goingBackToDefault
    ? `/tasks/${taskId}`
    : `/tasks/${taskId}?sort=${col.key}&dir=${nextDir}`;

  const arrow = active ? (activeDir === "desc" ? " ↓" : " ↑") : "";
  return (
    <th>
      <Link
        href={href}
        className={
          "hover:no-underline " +
          (active
            ? "text-[var(--accent)]"
            : "text-[var(--muted)] hover:text-[var(--foreground)]")
        }
      >
        {col.label}
        {arrow}
      </Link>
    </th>
  );
}

function SolutionSubline({ e }: { e: LeaderboardRow }) {
  const repo = extractRepo(e.metadata);
  if (!e.user_name && !repo) return null;
  return (
    <div className="text-[11px] font-normal text-[var(--muted)]">
      {e.user_name && <>by {e.user_name}</>}
      {e.user_name && repo && <span className="px-1">·</span>}
      {repo && (
        <a
          href={repo.url}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--accent)] underline-offset-2 hover:underline"
        >
          {repo.label} ↗
        </a>
      )}
    </div>
  );
}

// Pull a github repo URL out of self-reported run metadata. Accepts the
// common shapes: full URL, owner/repo, github.com/owner/repo. Returns a
// display label + canonical https URL.
function extractRepo(
  metadata: Record<string, unknown> | null,
): { url: string; label: string } | null {
  if (!metadata) return null;
  const raw = metadata.repo ?? metadata.source ?? metadata.repo_url;
  if (typeof raw !== "string" || !raw.trim()) return null;
  const trimmed = raw.trim();

  // Full URL — use as-is, label = last path segment.
  if (/^https?:\/\//i.test(trimmed)) {
    const parts = trimmed.replace(/^https?:\/\//i, "").split("/").filter(Boolean);
    const label = parts.slice(1, 3).join("/") || "source";
    return { url: trimmed, label };
  }
  // github.com/owner/repo or owner/repo
  const stripped = trimmed.replace(/^github\.com\//i, "");
  const parts = stripped.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const ownerRepo = parts.slice(0, 2).join("/");
  return {
    url: `https://github.com/${ownerRepo}`,
    label: ownerRepo,
  };
}
