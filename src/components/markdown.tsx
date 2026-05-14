// Tiny Markdown renderer — no dep. Supports:
//   ## h2, ### h3
//   - bullet list
//   ``` fenced code block (verbatim, language hint ignored)
//   `inline code`, **bold**
//
// Anything else falls through as a paragraph. Use this everywhere we
// render user-authored Markdown (task rules, docs page, etc).
export function MarkdownBlock({ md }: { md: string }) {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let listBuf: string[] = [];
  let codeBuf: string[] | null = null;

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

  const flushCode = () => {
    if (codeBuf === null) return;
    out.push(
      <pre
        key={`pre-${out.length}`}
        className="mb-3 overflow-x-auto rounded border border-[var(--border)] bg-black/40 p-3 text-xs"
      >
        <code>{codeBuf.join("\n")}</code>
      </pre>,
    );
    codeBuf = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith("```")) {
      if (codeBuf === null) {
        flushList();
        codeBuf = [];
      } else {
        flushCode();
      }
      continue;
    }
    if (codeBuf !== null) {
      codeBuf.push(raw);
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      out.push(
        <h2
          key={`h-${out.length}`}
          className="mb-2 mt-6 text-sm uppercase tracking-widest text-[var(--muted)] first:mt-0"
        >
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith("### ")) {
      flushList();
      out.push(
        <h3
          key={`h-${out.length}`}
          className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] first:mt-0"
        >
          {line.slice(4)}
        </h3>,
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
  flushCode();
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
