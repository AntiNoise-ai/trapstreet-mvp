import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import {
  getTask,
  getThread,
  listComments,
  userById,
} from "@/lib/queries";
import { fmtRelativeTime } from "@/lib/format";
import { MarkdownBlock } from "@/components/markdown";
import { DeleteButton } from "@/components/delete-button";
import ReplyForm from "./ReplyForm";

export default async function ThreadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await getThread(id);
  if (!thread) notFound();

  const [comments, author, session, taskOwnerCheck] = await Promise.all([
    listComments(id),
    userById(thread.author_id),
    auth(),
    // If the thread is attached to a task, fetch the task so we can
    // surface task-owner moderation permissions.
    thread.subject_type === "task" ? getTask(thread.subject_id) : null,
  ]);

  const viewerId = session?.user?.id ?? null;
  const isTaskOwner =
    !!viewerId &&
    !!taskOwnerCheck &&
    taskOwnerCheck.created_by === viewerId;
  const canModerateThread =
    !!viewerId &&
    (viewerId === thread.author_id || isTaskOwner);

  const subjectLink = subjectHref(thread.subject_type, thread.subject_id);

  return (
    <div className="max-w-3xl">
      <p className="mb-1 text-xs uppercase tracking-widest text-[var(--muted)]">
        thread on{" "}
        {subjectLink ? (
          <Link href={subjectLink}>
            {thread.subject_type}/{thread.subject_id}
          </Link>
        ) : (
          `${thread.subject_type}/${thread.subject_id}`
        )}
      </p>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold">{thread.title}</h1>
        {canModerateThread && (
          <DeleteButton
            endpoint={`/api/threads/${thread.id}`}
            confirm="Delete this thread and all its comments?"
            label="delete thread"
            redirectTo={subjectLink ?? "/threads"}
          />
        )}
      </div>
      <p className="mb-8 text-xs text-[var(--muted)]">
        opened by{" "}
        {author ? (
          <Link href={`/users/${author.id}`}>{author.name ?? author.id}</Link>
        ) : (
          thread.author_id
        )}{" "}
        · {fmtRelativeTime(thread.created_at)}
      </p>

      <ul className="mb-10 space-y-4">
        {comments.map((c) => {
          const canModerateThis =
            !!viewerId && (viewerId === c.author_id || isTaskOwner);
          return (
            <li
              key={c.id}
              className="rounded border border-[var(--border)] p-4"
            >
              <div className="mb-2 flex items-baseline justify-between text-xs text-[var(--muted)]">
                <span>
                  <Link
                    href={`/users/${c.author_id}`}
                    className="text-[var(--foreground)]"
                  >
                    {c.author_name ?? c.author_id}
                  </Link>{" "}
                  · {fmtRelativeTime(c.created_at)}
                </span>
                {canModerateThis && (
                  <DeleteButton
                    endpoint={`/api/comments/${c.id}`}
                    confirm="Delete this comment?"
                  />
                )}
              </div>
              <div className="text-sm">
                <MarkdownBlock md={c.body} />
              </div>
            </li>
          );
        })}
        {comments.length === 0 && (
          <li className="text-[var(--muted)]">No replies yet.</li>
        )}
      </ul>

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-widest text-[var(--muted)]">
          reply
        </h2>
        {session?.user ? (
          <ReplyForm threadId={thread.id} />
        ) : (
          <p className="text-sm text-[var(--muted)]">
            <Link href="/api/auth/signin">Sign in</Link> to reply.
          </p>
        )}
      </section>
    </div>
  );
}

function subjectHref(type: string, id: string): string | null {
  switch (type) {
    case "task":
      return `/tasks/${id}/forum`;
    case "run":
      return `/runs/${id}`;
    case "solution":
      return `/solutions/${id}`;
    case "track":
      return `/?track=${encodeURIComponent(id)}`;
    default:
      return null;
  }
}
