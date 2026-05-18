import { authSolution, createRun, getTask } from "@/lib/queries";
import { ERR, ok } from "@/lib/api";

export async function POST(req: Request) {
  const solution = await authSolution(req.headers.get("authorization"));
  if (!solution) return ERR.unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ERR.invalid("body must be valid JSON");
  }
  const { task_id } = (body ?? {}) as { task_id?: string };
  if (!task_id) return ERR.invalid("task_id is required");

  const task = await getTask(task_id);
  if (!task) return ERR.invalid(`task ${task_id} does not exist`);

  const run = await createRun({ task_id, solution_id: solution.id });
  return ok({ run });
}
