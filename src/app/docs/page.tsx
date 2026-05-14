import { MarkdownBlock } from "@/components/markdown";
import { BUILD_A_TASK_MD } from "./content";

export const metadata = {
  title: "Docs · build a task — Trap Street",
};

export default function DocsPage() {
  return (
    <article className="max-w-3xl">
      <p className="mb-1 text-[10px] uppercase tracking-widest text-[var(--muted)]">
        docs
      </p>
      <h1 className="mb-2 text-2xl font-semibold">Build a task</h1>
      <p className="mb-8 text-[var(--muted)]">
        End-to-end walkthrough: design a task, write the solution, run it
        locally, register it on trapstreet, submit. Read this once and the{" "}
        <code className="text-[var(--foreground)]">tp</code> CLI stops
        feeling magical.
      </p>
      <MarkdownBlock md={BUILD_A_TASK_MD} />
    </article>
  );
}
