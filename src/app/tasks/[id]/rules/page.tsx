import { notFound } from "next/navigation";
import { getTask } from "@/lib/queries";
import { MarkdownBlock } from "@/components/markdown";

export default async function TaskRulesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  if (!task.rules_md && !task.io_md) {
    return (
      <p className="text-[var(--muted)]">
        No rules or contract defined for this task yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {task.rules_md && (
        <section>
          <p className="mb-2 text-[10px] uppercase tracking-widest text-[var(--muted)]">
            rules
          </p>
          <div className="rounded border border-[var(--border)] p-6">
            <MarkdownBlock md={task.rules_md} />
          </div>
        </section>
      )}

      {task.io_md && (
        <section>
          <p className="mb-2 text-[10px] uppercase tracking-widest text-[var(--muted)]">
            inputs · outputs · scoring
          </p>
          <div className="rounded border border-[var(--border)] p-6">
            <MarkdownBlock md={task.io_md} />
          </div>
        </section>
      )}
    </div>
  );
}
