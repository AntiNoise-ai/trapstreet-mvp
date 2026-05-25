"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Generic "delete this thing" button used on forum threads + comments.
// Confirms via window.confirm; on success refreshes the route or
// navigates to a fallback URL.
export function DeleteButton({
  endpoint,
  confirm: confirmMsg = "Delete? This can't be undone.",
  label = "delete",
  redirectTo,
  className = "text-xs text-red-400 hover:text-red-300 disabled:opacity-50",
}: {
  endpoint: string;
  confirm?: string;
  label?: string;
  // If set, navigate there after delete instead of just refreshing.
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle() {
    if (!confirm(confirmMsg)) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
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
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handle}
        disabled={pending}
        className={className}
      >
        {pending ? "deleting…" : label}
      </button>
      {error && (
        <span className="ml-2 text-xs text-red-400">{error}</span>
      )}
    </>
  );
}
