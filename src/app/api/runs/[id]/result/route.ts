import {
  authRunner,
  getRun,
  ingestCliUpload,
  type CliUpload,
} from "@/lib/queries";
import { ERR, ok } from "@/lib/api";

// POST /api/runs/:id/result — ingest the CLI's report.json into a pre-opened
// run. Body shape matches trapstreet/docs/scoring-and-metrics.md "Upload
// protocol":
//
//   { task_id, cases, summary?, started_at?, finished_at?, metadata? }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const runner = await authRunner(req.headers.get("authorization"));
  if (!runner) return ERR.unauthorized();

  const { id } = await params;
  const run = await getRun(id);
  if (!run) return ERR.notFound("run not found");
  if (run.runner_id !== runner.id) {
    return ERR.forbidden("run owned by another runner");
  }
  if (run.status === "scored" || run.status === "failed") {
    return ERR.invalid(`run is terminal (${run.status})`);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ERR.invalid("body must be valid JSON");
  }

  const validation = validate(body);
  if (validation.error) return ERR.invalid(validation.error);

  const updated = await ingestCliUpload(id, body as CliUpload);
  return ok({ run: updated });
}

function validate(body: unknown): { error: string | null } {
  if (!body || typeof body !== "object")
    return { error: "body must be an object" };
  const b = body as Record<string, unknown>;
  if (typeof b.task_id !== "string")
    return { error: "task_id is required (string)" };
  if (!Array.isArray(b.cases)) return { error: "cases must be an array" };
  if (b.summary !== undefined) {
    if (!b.summary || typeof b.summary !== "object")
      return { error: "summary must be an object when present" };
    const s = b.summary as Record<string, unknown>;
    if (typeof s.passed !== "boolean")
      return { error: "summary.passed must be a boolean" };
    if (typeof s.score !== "number")
      return { error: "summary.score must be a number" };
  }
  if (b.metadata !== undefined && (b.metadata === null || typeof b.metadata !== "object")) {
    return { error: "metadata must be an object when present" };
  }
  return { error: null };
}
