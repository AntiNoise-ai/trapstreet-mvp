import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";

// Right-side of the header. Anonymous: a sign-in button. Signed in:
// the user's display name as a dropdown trigger (native <details>) with
// new task / settings / sign out underneath.
export async function HeaderAuth() {
  const session = await auth();
  if (!session?.user) {
    return (
      <form
        action={async () => {
          "use server";
          await signIn();
        }}
      >
        <button
          type="submit"
          className="text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          sign in
        </button>
      </form>
    );
  }

  const label = session.user.name ?? session.user.email ?? "signed in";

  return (
    <details className="user-menu group relative">
      <summary className="cursor-pointer list-none text-[var(--foreground)] hover:text-[var(--accent)] [&::-webkit-details-marker]:hidden">
        {label} <span className="text-[var(--muted)]">▾</span>
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-44 rounded border border-[var(--border)] bg-[var(--background)] py-1 shadow-lg">
        <Link
          href="/tasks/new"
          className="block px-3 py-1.5 text-[13px] text-[var(--muted)] hover:bg-[var(--border)]/30 hover:text-[var(--foreground)] hover:no-underline"
        >
          new task
        </Link>
        <Link
          href="/settings"
          className="block px-3 py-1.5 text-[13px] text-[var(--muted)] hover:bg-[var(--border)]/30 hover:text-[var(--foreground)] hover:no-underline"
        >
          settings
        </Link>
        <div className="my-1 border-t border-[var(--border)]" />
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="block w-full px-3 py-1.5 text-left text-[13px] text-[var(--muted)] hover:bg-[var(--border)]/30 hover:text-[var(--foreground)]"
          >
            sign out
          </button>
        </form>
      </div>
    </details>
  );
}
