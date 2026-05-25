import Link from "next/link";
import { auth } from "@/auth";
import { listThreads } from "@/lib/queries";
import { fmtRelativeTime } from "@/lib/format";
import NewThreadForFilter from "./NewThreadForFilter";

export default async function ThreadsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject_type?: string; subject_id?: string }>;
}) {
  const sp = await searchParams;
  const [threads, session] = await Promise.all([
    listThreads({
      subject_type: sp.subject_type,
      subject_id: sp.subject_id,
    }),
    auth(),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Threads</h1>
      <p className="mb-6 text-[var(--muted)]">
        Discussion attached to a task, run, or solution.
      </p>

      {(sp.subject_type || sp.subject_id) && (
        <p className="mb-4 text-xs">
          filter:{" "}
          <code>
            {sp.subject_type ?? "*"}/{sp.subject_id ?? "*"}
          </code>{" "}
          · <Link href="/threads">clear</Link>
        </p>
      )}

      {/* When the list is filtered to a specific subject AND the user
          is signed in, offer to start a new thread on it inline — same
          as the task forum tab does for tasks. */}
      {session?.user && sp.subject_type && sp.subject_id && (
        <div className="mb-6">
          <NewThreadForFilter
            subjectType={sp.subject_type}
            subjectId={sp.subject_id}
          />
        </div>
      )}

      {threads.length === 0 ? (
        <p className="text-[var(--muted)]">No threads.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>title</th>
              <th>on</th>
              <th>by</th>
              <th>comments</th>
              <th>last activity</th>
            </tr>
          </thead>
          <tbody>
            {threads.map((t) => (
              <tr key={t.id}>
                <td>
                  <Link href={`/threads/${t.id}`}>{t.title}</Link>
                </td>
                <td className="text-[var(--muted)]">
                  {t.subject_type}/{t.subject_id}
                </td>
                <td className="text-[var(--muted)]">
                  {t.author_name ? (
                    <Link href={`/users/${t.author_id}`}>{t.author_name}</Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{t.comment_count}</td>
                <td className="text-[var(--muted)]">
                  {fmtRelativeTime(t.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
