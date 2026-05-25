import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTask,
  listThreadsForSubject,
  taskForumStats,
} from "@/lib/queries";
import { auth } from "@/auth";
import { fmtRelativeTime } from "@/lib/format";
import NewThreadForm from "./NewThreadForm";

export default async function TaskForumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [task, threads, stats, session] = await Promise.all([
    getTask(id),
    listThreadsForSubject("task", id),
    taskForumStats(id),
    auth(),
  ]);
  if (!task) notFound();

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          <span className="text-[var(--foreground)]">{stats.thread_count}</span>{" "}
          {stats.thread_count === 1 ? "thread" : "threads"} ·{" "}
          <span className="text-[var(--foreground)]">{stats.comment_total}</span>{" "}
          {stats.comment_total === 1 ? "comment" : "comments"}
        </p>
        <Link
          href={`/threads?subject_type=task&subject_id=${task.id}`}
          className="text-xs"
        >
          all threads →
        </Link>
      </div>

      <div className="mb-6">
        {session?.user ? (
          <NewThreadForm taskId={task.id} />
        ) : (
          <p className="text-xs text-[var(--muted)]">
            <Link href="/api/auth/signin">Sign in</Link> to open a thread.
          </p>
        )}
      </div>

      {threads.length === 0 ? (
        <div className="rounded border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">
          <p className="mb-1">No discussion yet.</p>
          <p className="text-xs">Be the first.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {threads.map((t) => (
            <li
              key={t.id}
              className="rounded border border-[var(--border)] p-4 transition hover:border-[var(--accent)]"
            >
              <Link
                href={`/threads/${t.id}`}
                className="block hover:no-underline"
              >
                <p className="mb-1 font-semibold text-[var(--foreground)]">
                  {t.title}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {t.comment_count} comment
                  {t.comment_count === 1 ? "" : "s"} · last activity{" "}
                  {fmtRelativeTime(t.updated_at)}{" "}
                  {t.author_name && <> · by {t.author_name}</>}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
