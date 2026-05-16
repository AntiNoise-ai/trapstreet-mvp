// Tiny Markdown renderer — no dep. Supports:
//   ## h2, ### h3
//   - bullet list (with indented continuation lines)
//   ``` fenced code block (verbatim, language hint ignored)
//   `inline code`, **bold**, [text](url)
//
// Anything else falls through as a paragraph. Used for docs pages and
// task rules / IO blocks.
export function MarkdownBlock({ md }: { md: string }) {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let listBuf: string[] = [];
  let codeBuf: string[] | null = null;

  const flushList = () => {
    if (listBuf.length === 0) return;
    out.push(
      <ul key={`ul-${out.length}`} className="mb-4 list-disc space-y-2 pl-5">
        {listBuf.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed">
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
        className="mb-4 overflow-x-auto rounded border border-[var(--border)] bg-black/40 p-3 text-xs"
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
          className="mb-3 mt-8 text-xl font-semibold text-[var(--foreground)] first:mt-0"
        >
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith("### ")) {
      flushList();
      out.push(
        <h3
          key={`h-${out.length}`}
          className="mb-2 mt-5 text-base font-semibold text-[var(--foreground)]"
        >
          {line.slice(4)}
        </h3>,
      );
    } else if (line.startsWith("- ")) {
      listBuf.push(line.slice(2));
    } else if (listBuf.length > 0 && /^\s{2,}\S/.test(raw)) {
      // Continuation of the previous bullet (markdown convention: indent
      // continuation lines by 2+ spaces). Append with a leading space so
      // the words don't fuse.
      listBuf[listBuf.length - 1] += " " + raw.trim();
    } else if (line === "") {
      flushList();
    } else {
      flushList();
      out.push(
        <p key={`p-${out.length}`} className="mb-3 text-sm leading-relaxed">
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
  // One regex covering every supported inline span. Order matters only
  // for nested cases — we don't support nesting, so plain alternation
  // is fine.
  const tokens = s.split(
    /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g,
  );
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
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(t);
    if (link) {
      const [, text, href] = link;
      const external = /^https?:\/\//.test(href);
      return (
        <a
          key={i}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
          className="text-[var(--accent)] underline-offset-2 hover:underline"
        >
          {text}
        </a>
      );
    }
    return <span key={i}>{t}</span>;
  });
}
