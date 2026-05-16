import { notFound } from "next/navigation";
import { getTask } from "@/lib/queries";
import {
  fetchRaw,
  fetchTaskTree,
  ghFileUrl,
  isTextFile,
  parseTraptaskCases,
  prettyJson,
  type TaskCase,
  type TreeEntry,
} from "@/lib/github-task";

// Don't fetch insanely large text files inline — at some point you're
// better off clicking through to GitHub.
const MAX_INLINE_BYTES = 64 * 1024; // 64 KB

interface CaseFile {
  name: string;
  // Path inside the task root, e.g. "inputs/foo/question.txt"
  fullPath: string;
  size?: number;
  // null when binary, too large, or fetch failed.
  content: string | null;
}

interface CaseRender extends TaskCase {
  inputs: CaseFile[];
  expected: CaseFile[];
}

export default async function TaskCasesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  let yaml: string | null = null;
  let tree: TreeEntry[] = [];
  let fetchError: string | null = null;

  try {
    [yaml, tree] = await Promise.all([
      fetchRaw(task.traptask_ref, "traptask.yaml"),
      fetchTaskTree(task.traptask_ref),
    ]);
  } catch (e) {
    fetchError = e instanceof Error ? e.message : String(e);
  }

  const taskGhHref = traptaskGithubHref(task.traptask_ref);

  if (fetchError) {
    return (
      <NoCases>
        Couldn&apos;t fetch from GitHub ({fetchError}). View the source
        on <Anchor href={taskGhHref}>GitHub</Anchor> directly.
      </NoCases>
    );
  }
  if (!yaml) {
    return (
      <NoCases>
        No <code>traptask.yaml</code> at{" "}
        <Anchor href={taskGhHref}>{task.traptask_ref}</Anchor>.
      </NoCases>
    );
  }

  const cases = parseTraptaskCases(yaml);
  if (cases.length === 0) {
    return (
      <NoCases>
        Found <code>traptask.yaml</code> but couldn&apos;t parse any cases
        out of it. <Anchor href={taskGhHref}>View source</Anchor>.
      </NoCases>
    );
  }

  // Fetch all case files + scoring sources in parallel. raw.github
  // doesn't share the api rate-limit quota; cached 5 min.
  const [rendered, judgePy, graderPy] = await Promise.all([
    Promise.all(cases.map((c) => hydrateCase(c, tree, task.traptask_ref))),
    fetchRaw(task.traptask_ref, "judge.py"),
    fetchRaw(task.traptask_ref, "grader.py"),
  ]);

  return (
    <div className="space-y-8">
      <Header
        total={cases.length}
        taskGhHref={taskGhHref}
        traptaskYamlHref={ghFileUrl(task.traptask_ref, "traptask.yaml")}
        hasGrader={graderPy !== null}
      />

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-widest text-[var(--muted)]">
          cases ({cases.length})
        </h2>
        <div className="space-y-2">
          {rendered.map((c) => (
            <CaseRow key={c.id} c={c} taskRef={task.traptask_ref} />
          ))}
        </div>
      </section>

      <ScoringLogic
        judgePy={judgePy}
        graderPy={graderPy}
        taskRef={task.traptask_ref}
      />
    </div>
  );
}

async function hydrateCase(
  c: TaskCase,
  tree: TreeEntry[],
  taskRef: string,
): Promise<CaseRender> {
  const collect = async (dir: "inputs" | "expected"): Promise<CaseFile[]> => {
    const blobs = tree.filter(
      (t) => t.type === "blob" && t.path.startsWith(`${dir}/${c.id}/`),
    );
    return Promise.all(
      blobs.map(async (b) => {
        const name = b.path.slice(`${dir}/${c.id}/`.length);
        // Skip content fetch for binaries and oversized files.
        if (!isTextFile(name)) {
          return { name, fullPath: b.path, size: b.size, content: null };
        }
        if (b.size !== undefined && b.size > MAX_INLINE_BYTES) {
          return { name, fullPath: b.path, size: b.size, content: null };
        }
        const raw = await fetchRaw(taskRef, b.path);
        const content =
          raw && name.toLowerCase().endsWith(".json") ? prettyJson(raw) : raw;
        return { name, fullPath: b.path, size: b.size, content };
      }),
    );
  };

  const [inputs, expected] = await Promise.all([
    collect("inputs"),
    collect("expected"),
  ]);
  return { ...c, inputs, expected };
}

function Header({
  total,
  taskGhHref,
  traptaskYamlHref,
  hasGrader,
}: {
  total: number;
  taskGhHref: string;
  traptaskYamlHref: string;
  hasGrader: boolean;
}) {
  return (
    <section className="rounded border border-[var(--border)] p-5">
      <p className="mb-2 text-2xl">
        <strong className="text-[var(--foreground)]">{total}</strong>{" "}
        <span className="text-[var(--muted)]">
          {total === 1 ? "case" : "cases"}
        </span>
      </p>
      <p className="text-sm text-[var(--muted)]">
        Each case feeds files from{" "}
        <code className="text-[var(--foreground)]">inputs/&lt;id&gt;/</code>{" "}
        to the runner, expects files in{" "}
        <code className="text-[var(--foreground)]">expected/&lt;id&gt;/</code>,
        and is scored by{" "}
        <code className="text-[var(--foreground)]">judge.py</code>
        {hasGrader ? (
          <>
            {" "}then aggregated by{" "}
            <code className="text-[var(--foreground)]">grader.py</code>
          </>
        ) : null}
        .
      </p>
      <p className="mt-3 text-xs text-[var(--muted)]">
        <Anchor href={traptaskYamlHref}>traptask.yaml</Anchor>
        {" · "}
        <Anchor href={taskGhHref}>source on GitHub</Anchor>
      </p>
    </section>
  );
}

function CaseRow({ c, taskRef }: { c: CaseRender; taskRef: string }) {
  return (
    <details className="group rounded border border-[var(--border)]">
      <summary className="flex cursor-pointer list-none items-baseline gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="text-[var(--muted)] group-open:rotate-90 inline-block transition-transform">
          ▸
        </span>
        <code className="font-mono text-sm text-[var(--foreground)]">
          {c.id}
        </code>
        {c.description && (
          <span className="line-clamp-1 flex-1 text-xs text-[var(--muted)]">
            {c.description}
          </span>
        )}
      </summary>
      <div className="space-y-5 border-t border-[var(--border)] p-4">
        <FileGroup title="input" files={c.inputs} kind="inputs" caseId={c.id} taskRef={taskRef} />
        <FileGroup title="expected output" files={c.expected} kind="expected" caseId={c.id} taskRef={taskRef} />
        <p className="text-xs text-[var(--muted)]">
          Scored by{" "}
          <Anchor href={ghFileUrl(taskRef, "judge.py")}>judge.py</Anchor>{" "}
          — see Scoring logic below for the full rule.
        </p>
      </div>
    </details>
  );
}

function FileGroup({
  title,
  files,
  kind,
  caseId,
  taskRef,
}: {
  title: string;
  files: CaseFile[];
  kind: "inputs" | "expected";
  caseId: string;
  taskRef: string;
}) {
  if (files.length === 0) {
    return (
      <p className="text-xs text-[var(--muted)]">
        No <code>{kind}/{caseId}/</code> files.
      </p>
    );
  }
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-widest text-[var(--accent)]">
        {title}
      </p>
      <div className="space-y-3">
        {files.map((f) => (
          <FileBlock key={f.name} f={f} taskRef={taskRef} />
        ))}
      </div>
    </div>
  );
}

function FileBlock({ f, taskRef }: { f: CaseFile; taskRef: string }) {
  if (f.content === null) {
    return (
      <div className="flex items-baseline gap-2 text-xs text-[var(--muted)]">
        <code className="text-[var(--foreground)]">{f.name}</code>
        <span>
          {isTextFile(f.name) ? "too large to inline" : "binary"}
          {f.size !== undefined ? ` · ${formatBytes(f.size)}` : ""}
        </span>
        <Anchor href={ghFileUrl(taskRef, f.fullPath)}>view on GitHub</Anchor>
      </div>
    );
  }
  return (
    <div>
      <p className="mb-1 font-mono text-[11px] text-[var(--muted)]">{f.name}</p>
      <pre className="overflow-x-auto rounded border border-[var(--border)] bg-black/40 p-3 text-xs">
        <code>{f.content}</code>
      </pre>
    </div>
  );
}

function ScoringLogic({
  judgePy,
  graderPy,
  taskRef,
}: {
  judgePy: string | null;
  graderPy: string | null;
  taskRef: string;
}) {
  if (!judgePy && !graderPy) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm uppercase tracking-widest text-[var(--muted)]">
        scoring logic
      </h2>
      <p className="mb-4 text-sm text-[var(--muted)]">
        <code className="text-[var(--foreground)]">judge.py</code> runs once
        per case and prints a score per case.
        {graderPy && (
          <>
            {" "}
            <code className="text-[var(--foreground)]">grader.py</code> runs
            once at the end and folds case scores into a run-level summary.
          </>
        )}{" "}
        Without <code>grader.py</code>, the server averages case scores and
        marks the run passed at 0.8+.
      </p>
      {judgePy && (
        <SourceBlock name="judge.py" code={judgePy} taskRef={taskRef} />
      )}
      {graderPy && (
        <SourceBlock name="grader.py" code={graderPy} taskRef={taskRef} />
      )}
    </section>
  );
}

function SourceBlock({
  name,
  code,
  taskRef,
}: {
  name: string;
  code: string;
  taskRef: string;
}) {
  const lineCount = code.split("\n").length;
  return (
    <details className="mb-3 rounded border border-[var(--border)]">
      <summary className="flex cursor-pointer list-none items-baseline gap-3 p-3 [&::-webkit-details-marker]:hidden">
        <span className="text-[var(--muted)]">▸</span>
        <code className="font-mono text-sm text-[var(--foreground)]">
          {name}
        </code>
        <span className="text-xs text-[var(--muted)]">
          {lineCount} lines · <Anchor href={ghFileUrl(taskRef, name)}>view on GitHub</Anchor>
        </span>
      </summary>
      <pre className="overflow-x-auto border-t border-[var(--border)] bg-black/40 p-3 text-xs">
        <code>{code}</code>
      </pre>
    </details>
  );
}

function NoCases({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--muted)]">{children}</p>;
}

function Anchor({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-[var(--accent)] underline-offset-2 hover:underline"
    >
      {children}
    </a>
  );
}

function traptaskGithubHref(ref: string): string {
  const parts = ref.split("/").filter(Boolean);
  if (parts.length <= 2) return `https://github.com/${ref}`;
  const [owner, repo, ...rest] = parts;
  return `https://github.com/${owner}/${repo}/tree/main/${rest.join("/")}`;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
