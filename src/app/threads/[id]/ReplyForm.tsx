"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/threads/${threadId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const raw = await res.text();
      let data: { error?: string } | null = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        /* fall through */
      }
      if (!res.ok) {
        setError(
          data?.error ?? (raw ? raw.slice(0, 200) : `HTTP ${res.status}`),
        );
        return;
      }
      setBody("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        required
        rows={4}
        maxLength={4000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Reply… **markdown** supported"
        className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 font-mono text-xs outline-none focus:border-[var(--accent)]"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending || !body.trim()}
        className="rounded border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10 disabled:opacity-50"
      >
        {pending ? "posting…" : "reply"}
      </button>
    </form>
  );
}
