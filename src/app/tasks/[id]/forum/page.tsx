import Link from "next/link";
import { notFound } from "next/navigation";
import { getTask, listThreadsForSubject } from "@/lib/queries";
import { fmtDate } from "@/lib/format";

export default async function TaskForumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  const threads = await listThreadsForSubject("task", task.id);

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-sm text-[var(--muted)]">
          {threads.length} thread{threads.length === 1 ? "" : "s"} on this
          task.
        </p>
        <Link
          href={`/threads?subject_type=task&subject_id=${task.id}`}
          className="text-xs"
        >
          all threads →
        </Link>
      </div>

      {threads.length === 0 ? (
        <div className="rounded border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">
          <p className="mb-2">No discussion yet.</p>
          <p className="text-xs">
            Open one via{" "}
            <code className="text-[var(--foreground)]">
              POST /api/threads
            </code>{" "}
            — UI for posting from the browser lands next.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {threads.map((t) => (
            <li
              key={t.id}
              className="rounded border border-[var(--border)] p-4 hover:border-[var(--accent)]"
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
                  {fmtDate(t.updated_at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
