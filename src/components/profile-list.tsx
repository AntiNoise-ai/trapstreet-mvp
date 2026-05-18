import Link from "next/link";
import type { LeaderboardRow } from "@/lib/queries";
import { fmtRelativeTime } from "@/lib/format";

// ProfileList — leaderboard-shaped table for no_ranking (classification /
// self-profile) tasks. Walks each row's grader_metrics jsonb, discovers
// the leaf keys across the union, and renders one sortable column per
// leaf. Zero task-specific code: a new classification task that emits
// any metric shape renders automatically.
//
// Server component. URL-driven sort (?sort=<leaf-path>&dir=<asc|desc>),
// fully client-side ordering applied after fetch (no_ranking sample sizes
// are small, so SQL sort would over-engineer).

export type Direction = "asc" | "desc";

interface Column {
  // Dot-separated leaf path inside grader_metrics, e.g.
  // "percentages.E_I.I" or "mbti_type".
  path: string;
  // Header label. Drops uninteresting namespace prefixes like
  // "percentages." for compactness.
  label: string;
  type: "string" | "number" | "number_percent" | "boolean";
}

// Keys that are either already shown as denormalized columns above, or
// are wire-format housekeeping the user doesn't need to see.
const SKIP_LEAVES = new Set([
  "score",
  "passed",
  "n_passed",
  "n_total",
  "n_scored",
  "n_skipped",
  "n_skipped_no_gold",
  "n_questions",
  "latency_ms_total",
  "latency_ms_median",
  "latency_ms_p95",
  "cost_usd_total",
  "tokens_total",
  "threshold",
  "by_category",
]);

// Top-level namespace prefixes to drop from labels (so
// "percentages.E_I.I" displays as "E_I.I", not the whole long path).
const SKIP_NAMESPACE = new Set([
  "percentages",
  "bias_stats",
  "metrics",
  "stats",
]);

const SCORED_AT: Column = { path: "scored_at", label: "submitted", type: "string" };

export function ProfileList({
  entries,
  taskId,
  sortKey,
  sortDir,
}: {
  entries: LeaderboardRow[];
  taskId: string;
  sortKey: string | null;
  sortDir: Direction;
}) {
  const columns = discoverColumns(entries);
  const sorted = applySort(entries, sortKey, sortDir);

  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>solution</th>
          {columns.map((col) => (
            <SortHeader
              key={col.path}
              col={col}
              activeSort={sortKey}
              activeDir={sortDir}
              taskId={taskId}
            />
          ))}
          <SortHeader
            col={SCORED_AT}
            activeSort={sortKey}
            activeDir={sortDir}
            taskId={taskId}
          />
        </tr>
      </thead>
      <tbody>
        {sorted.map((row, i) => (
          <tr key={row.run_id}>
            <td className="text-[var(--muted)]">{i + 1}</td>
            <td className="font-medium">
              <Link href={`/solutions/${row.solution_id}`}>
                {row.solution_name}
              </Link>
              <SolutionSubline e={row} />
            </td>
            {columns.map((col) => (
              <td key={col.path}>
                <MetricCell
                  value={getPath(row.grader_metrics, col.path)}
                  type={col.type}
                />
              </td>
            ))}
            <td className="text-[var(--muted)]">
              <Link href={`/runs/${row.run_id}`}>
                {fmtRelativeTime(row.scored_at)}
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// -- column discovery --------------------------------------------------------

function discoverColumns(entries: LeaderboardRow[]): Column[] {
  // Path → first non-null example value (for type inference).
  const paths = new Map<string, unknown>();
  for (const e of entries) {
    if (!e.grader_metrics) continue;
    walkLeaves(e.grader_metrics, "", (path, value) => {
      const leaf = path.split(".").pop()!;
      if (SKIP_LEAVES.has(leaf) || SKIP_LEAVES.has(path)) return;
      // Skip arrays — too big for a cell. (E.g. raw_responses: [32 ints].)
      if (Array.isArray(value)) return;
      // Keep the first non-null sample for type inference.
      const prev = paths.get(path);
      if (prev == null && value != null) {
        paths.set(path, value);
      } else if (!paths.has(path)) {
        paths.set(path, value);
      }
    });
  }
  return [...paths.entries()]
    .map(([path, example]) => ({
      path,
      label: shortenPath(path),
      type: inferType(path, example),
    }))
    .sort(byLabelGroup);
}

// Group columns: strings first, booleans last, numbers in between (more
// scannable that way — categorical lead, flags trail).
function byLabelGroup(a: Column, b: Column): number {
  const order = { string: 0, number_percent: 1, number: 2, boolean: 3 } as const;
  const ord = order[a.type] - order[b.type];
  if (ord !== 0) return ord;
  return a.label.localeCompare(b.label);
}

function walkLeaves(
  obj: unknown,
  prefix: string,
  cb: (path: string, value: unknown) => void,
): void {
  if (obj === null || obj === undefined) {
    cb(prefix, obj);
    return;
  }
  if (typeof obj !== "object" || Array.isArray(obj)) {
    cb(prefix, obj);
    return;
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    walkLeaves(v, prefix ? `${prefix}.${k}` : k, cb);
  }
}

function getPath(obj: Record<string, unknown> | null, path: string): unknown {
  if (!obj) return null;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[key];
    }
    return null;
  }, obj);
}

function shortenPath(path: string): string {
  const parts = path.split(".");
  if (parts.length > 1 && SKIP_NAMESPACE.has(parts[0])) {
    return parts.slice(1).join(".");
  }
  return path;
}

function inferType(path: string, value: unknown): Column["type"] {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") {
    // Path-based heuristic: numbers nested under a "percentages" namespace
    // (or with names like "pct_*" or "*_pct") are 0-100 percents and get
    // a mini bar. Everything else is a plain number.
    const lower = path.toLowerCase();
    if (
      lower.startsWith("percentages.") ||
      lower.includes(".pct_") ||
      lower.startsWith("pct_") ||
      lower.endsWith("_pct")
    ) {
      return "number_percent";
    }
    return "number";
  }
  return "string";
}

// -- sort --------------------------------------------------------------------

function applySort(
  entries: LeaderboardRow[],
  sortKey: string | null,
  sortDir: Direction,
): LeaderboardRow[] {
  const dirMul = sortDir === "asc" ? 1 : -1;
  // Default: newest first.
  if (!sortKey || sortKey === "scored_at") {
    return [...entries].sort((a, b) => {
      const at = new Date(a.scored_at).getTime();
      const bt = new Date(b.scored_at).getTime();
      // For chronological default, desc means newest first.
      const useDir = sortKey === "scored_at" ? dirMul : -1;
      return (at - bt) * useDir;
    });
  }
  return [...entries].sort((a, b) => {
    const av = getPath(a.grader_metrics, sortKey);
    const bv = getPath(b.grader_metrics, sortKey);
    if (av == null && bv == null) return 0;
    if (av == null) return 1; // nulls last regardless of direction
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * dirMul;
    }
    return String(av).localeCompare(String(bv)) * dirMul;
  });
}

// -- header cells ------------------------------------------------------------

function SortHeader({
  col,
  activeSort,
  activeDir,
  taskId,
}: {
  col: Column;
  activeSort: string | null;
  activeDir: Direction;
  taskId: string;
}) {
  const active = col.path === activeSort;
  // Natural default per type: numbers want desc (big first), strings want
  // asc (A→Z), submitted wants desc (newest first).
  const defaultDir: Direction =
    col.type === "string" && col.path !== "scored_at" ? "asc" : "desc";
  const nextDir: Direction = active
    ? activeDir === "desc"
      ? "asc"
      : "desc"
    : defaultDir;
  // Clicking the active column back to its default state clears the URL.
  const goingBackToDefault =
    active && col.path === "scored_at" && nextDir === "desc";
  const href = goingBackToDefault
    ? `/tasks/${taskId}`
    : `/tasks/${taskId}?sort=${encodeURIComponent(col.path)}&dir=${nextDir}`;
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

// -- value cells -------------------------------------------------------------

function MetricCell({
  value,
  type,
}: {
  value: unknown;
  type: Column["type"];
}) {
  if (value === null || value === undefined) {
    return <span className="text-[var(--muted)]">—</span>;
  }
  switch (type) {
    case "string":
      return (
        <span className="font-mono text-xs uppercase">{String(value)}</span>
      );
    case "number_percent":
      return <NumberWithBar value={Number(value)} />;
    case "number":
      return (
        <span>
          {typeof value === "number"
            ? Number.isInteger(value)
              ? value
              : value.toFixed(1)
            : String(value)}
        </span>
      );
    case "boolean":
      return value ? (
        <span className="text-yellow-400" title="flag set">
          ⚠
        </span>
      ) : (
        <span className="text-[var(--muted)]">—</span>
      );
  }
}

function NumberWithBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
      <span className="inline-block w-6 text-right tabular-nums">
        {Math.round(value)}
      </span>
      <span className="relative inline-block h-1 w-10 overflow-hidden rounded bg-[var(--border)]">
        <span
          className="absolute inset-y-0 left-0 bg-[var(--accent)]"
          style={{ width: `${clamped}%` }}
        />
      </span>
    </span>
  );
}

// -- solution subline (mirrors leaderboard page) -----------------------------

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

function extractRepo(
  metadata: Record<string, unknown> | null,
): { url: string; label: string } | null {
  if (!metadata) return null;
  const raw = metadata.repo ?? metadata.source ?? metadata.repo_url;
  if (typeof raw !== "string" || !raw.trim()) return null;
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    const parts = trimmed
      .replace(/^https?:\/\//i, "")
      .split("/")
      .filter(Boolean);
    const label = parts.slice(1, 3).join("/") || "source";
    return { url: trimmed, label };
  }
  const stripped = trimmed.replace(/^github\.com\//i, "");
  const parts = stripped.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const ownerRepo = parts.slice(0, 2).join("/");
  return { url: `https://github.com/${ownerRepo}`, label: ownerRepo };
}
