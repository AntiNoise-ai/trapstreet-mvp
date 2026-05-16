import { MarkdownBlock } from "@/components/markdown";
import { BUILD_A_TASK_MD } from "@/app/docs/content";

export const metadata = {
  title: "Build a task — Trap Street docs",
};

export default function BuildATaskPage() {
  return (
    <article>
      <h1 className="mb-2 text-2xl font-semibold">Build a task</h1>
      <p className="mb-8 max-w-2xl text-[var(--muted)]">
        End-to-end: design a task, write the solution, run it locally,
        register it on trapstreet, submit.
      </p>
      <MarkdownBlock md={BUILD_A_TASK_MD} />
    </article>
  );
}
