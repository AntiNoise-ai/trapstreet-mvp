"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Inline "open a new thread" form on the task forum tab. Title is
// required; body is optional first post. Posts via session-authenticated
// POST /api/threads (no api_key needed — forum is human-to-human).
export default function NewThreadForm({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subject: { type: "task", id: taskId },
          body: body.trim() || undefined,
        }),
      });
      const text = await res.text();
      let data: { error?: string; thread?: { id: string } } | null = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        /* fall through */
      }
      if (!res.ok) {
        setError(
          data?.error ?? (text ? text.slice(0, 200) : `HTTP ${res.status}`),
        );
        return;
      }
      if (data?.thread) {
        router.push(`/threads/${data.thread.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10"
      >
        + new thread
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded border border-[var(--border)] p-4"
    >
      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-[var(--muted)]">
          title
        </label>
        <input
          required
          maxLength={200}
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's the question?"
          className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--accent)]"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-[var(--muted)]">
          first post <span className="text-[var(--muted)]">(optional, markdown)</span>
        </label>
        <textarea
          rows={5}
          maxLength={4000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="**Markdown** supported."
          className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 font-mono text-xs outline-none focus:border-[var(--accent)]"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || !title.trim()}
          className="rounded border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10 disabled:opacity-50"
        >
          {pending ? "posting…" : "open thread"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTitle("");
            setBody("");
            setError(null);
          }}
          disabled={pending}
          className="rounded border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
        >
          cancel
        </button>
      </div>
    </form>
  );
}
