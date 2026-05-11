import { notFound } from "next/navigation";
import { getTask } from "@/lib/queries";

export default async function TaskRulesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  if (!task.rules_md) {
    return (
      <p className="text-[var(--muted)]">
        No rules defined for this task yet.
      </p>
    );
  }

  return (
    <div className="rounded border border-[var(--border)] p-6">
      <RulesBlock md={task.rules_md} />
    </div>
  );
}

// Inline Markdown renderer — h2 / list / `code` / **bold** only.
// Keeps the dep list at zero.
function RulesBlock({ md }: { md: string }) {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let listBuf: string[] = [];

  const flushList = () => {
    if (listBuf.length === 0) return;
    out.push(
      <ul key={`ul-${out.length}`} className="mb-3 list-disc space-y-1 pl-5">
        {listBuf.map((item, i) => (
          <li key={i} className="text-sm">
            {renderInline(item)}
          </li>
        ))}
      </ul>,
    );
    listBuf = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("## ")) {
      flushList();
      out.push(
        <h2
          key={`h-${out.length}`}
          className="mb-2 mt-5 text-sm uppercase tracking-widest text-[var(--muted)] first:mt-0"
        >
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith("- ")) {
      listBuf.push(line.slice(2));
    } else if (line === "") {
      flushList();
    } else {
      flushList();
      out.push(
        <p key={`p-${out.length}`} className="mb-2 text-sm">
          {renderInline(line)}
        </p>,
      );
    }
  }
  flushList();
  return <div>{out}</div>;
}

function renderInline(s: string): React.ReactNode[] {
  const tokens = s.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return tokens.map((t, i) => {
    if (t.startsWith("`") && t.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-black/40 px-1 text-[var(--foreground)]"
        >
          {t.slice(1, -1)}
        </code>
      );
    }
    if (t.startsWith("**") && t.endsWith("**")) {
      return (
        <strong key={i} className="text-[var(--foreground)]">
          {t.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{t}</span>;
  });
}
