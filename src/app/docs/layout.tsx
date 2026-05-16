import { DocsNav } from "@/components/docs-nav";

// Shared layout for /docs/* — tab nav + header. Each child page renders
// its own content beneath.
export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl">
      <p className="mb-1 text-[10px] uppercase tracking-widest text-[var(--muted)]">
        docs
      </p>
      <DocsNav />
      {children}
    </div>
  );
}
