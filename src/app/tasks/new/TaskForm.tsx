"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const METRICS = [
  { value: "total_score", label: "score (higher better)" },
  { value: "latency_ms", label: "latency_ms (lower better)" },
  { value: "cost_usd", label: "cost_usd (lower better)" },
  { value: "cases_passed", label: "cases_passed (higher better)" },
] as const;

export default function TaskForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: "",
    name: "",
    track: "",
    description: "",
    traptask_ref: "",
    ranking_metric: "total_score",
    ranking_direction: "desc" as "asc" | "desc",
    rules_md: "",
    io_md: "",
    visibility: "public" as "public" | "private",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "task creation failed");
      } else {
        router.push(`/tasks/${data.task.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
    }
  }

  // ranking_direction defaults: latency/cost = asc, score/cases = desc
  function onMetricChange(v: string) {
    set("ranking_metric", v);
    const isLowerBetter = v === "latency_ms" || v === "cost_usd";
    set("ranking_direction", isLowerBetter ? "asc" : "desc");
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Row label="id" hint="lowercase, dash-separated. shows in URL: /tasks/<id>">
        <input
          required
          pattern="[a-z0-9-]+"
          placeholder="my-task"
          value={form.id}
          onChange={(e) => set("id", e.target.value)}
          className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--accent)]"
        />
      </Row>

      <Row label="name">
        <input
          required
          placeholder="A short, human-readable title"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--accent)]"
        />
      </Row>

      <Row label="track" hint="grouping in the home grid (e.g. examples, pdf-reader)">
        <input
          required
          placeholder="examples"
          value={form.track}
          onChange={(e) => set("track", e.target.value)}
          className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--accent)]"
        />
      </Row>

      <Row label="description">
        <textarea
          rows={2}
          placeholder="One-liner describing the task"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--accent)]"
        />
      </Row>

      <Row label="traptask_ref" hint="GitHub path to the traptask directory (org/repo/path)">
        <input
          required
          placeholder="AntiNoise-ai/trapstreet-tasks/tasks/<name>"
          value={form.traptask_ref}
          onChange={(e) => set("traptask_ref", e.target.value)}
          className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--accent)]"
        />
      </Row>

      <Row label="ranking metric" hint="what column the leaderboard sorts by">
        <div className="flex gap-2">
          <select
            value={form.ranking_metric}
            onChange={(e) => onMetricChange(e.target.value)}
            className="flex-1 rounded border border-[var(--border)] bg-transparent px-3 py-2 outline-none focus:border-[var(--accent)]"
          >
            {METRICS.map((m) => (
              <option key={m.value} value={m.value} className="bg-[var(--background)]">
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </Row>

      <Row label="rules" hint="Markdown — sections, lists, **bold**, `code`, ``` fences supported">
        <textarea
          rows={6}
          placeholder="## Rules\n\n- Rule one\n- Rule two"
          value={form.rules_md}
          onChange={(e) => set("rules_md", e.target.value)}
          className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 font-mono text-xs outline-none focus:border-[var(--accent)]"
        />
      </Row>

      <Row label="inputs · outputs · scoring" hint="Markdown — concrete contract for one sample case">
        <textarea
          rows={8}
          placeholder="## Example case: `basic`\n\n### Input\n\n```\nhello\n```"
          value={form.io_md}
          onChange={(e) => set("io_md", e.target.value)}
          className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 font-mono text-xs outline-none focus:border-[var(--accent)]"
        />
      </Row>

      <Row label="visibility">
        <div className="flex gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={form.visibility === "public"}
              onChange={() => set("visibility", "public")}
            />
            <span>public — show in home grid</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={form.visibility === "private"}
              onChange={() => set("visibility", "private")}
            />
            <span>private — only you</span>
          </label>
        </div>
      </Row>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10 disabled:opacity-50"
      >
        {pending ? "creating…" : "create task"}
      </button>
    </form>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-[var(--muted)]">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] text-[var(--muted)]">
          {hint}
        </span>
      )}
    </label>
  );
}
