import { auth, signIn } from "@/auth";
import { listTracks } from "@/lib/queries";
import TaskForm from "./TaskForm";

export default async function NewTaskPage() {
  const session = await auth();
  const existingTracks = await listTracks();

  if (!session?.user) {
    return (
      <div className="max-w-xl">
        <h1 className="mb-2 text-2xl font-semibold">New task</h1>
        <p className="mb-8 text-[var(--muted)]">
          Sign in to publish a task. Your account will be shown as the
          author on the home grid.
        </p>
        <div className="space-y-3">
          <SignInButton provider="github" label="continue with github" />
          <SignInButton provider="google" label="continue with google" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold">New task</h1>
      <p className="mb-8 text-[var(--muted)]">
        Point this at a <code className="text-[var(--foreground)]">traptask</code>{" "}
        directory in GitHub (with{" "}
        <code className="text-[var(--foreground)]">traptask.yaml</code> +
        inputs/expected/judge.py/grader.py). Choose your ranking metric
        and visibility. Once created, anyone with the <code className="text-[var(--foreground)]">tp</code>{" "}
        CLI can submit a run.
      </p>
      <TaskForm existingTracks={existingTracks} />
    </div>
  );
}

function SignInButton({
  provider,
  label,
}: {
  provider: "github" | "google";
  label: string;
}) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn(provider, { redirectTo: "/tasks/new" });
      }}
    >
      <button
        type="submit"
        className="w-full rounded border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10"
      >
        {label}
      </button>
    </form>
  );
}
