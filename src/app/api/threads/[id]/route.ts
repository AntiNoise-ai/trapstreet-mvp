import { auth } from "@/auth";
import {
  deleteThread,
  getTask,
  getThread,
  listComments,
} from "@/lib/queries";
import { ERR, ok } from "@/lib/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const thread = await getThread(id);
  if (!thread) return ERR.notFound("thread not found");
  const comments = await listComments(id);
  return ok({ thread, comments });
}

// Thread author can delete their thread; for threads attached to a task,
// the task's creator can also delete (forum moderation on their own task).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return ERR.unauthorized();

  const thread = await getThread(id);
  if (!thread) return ERR.notFound("thread not found");

  const isAuthor = thread.author_id === session.user.id;
  let isTaskOwner = false;
  if (thread.subject_type === "task") {
    const task = await getTask(thread.subject_id);
    isTaskOwner = task?.created_by === session.user.id;
  }
  if (!isAuthor && !isTaskOwner) {
    return ERR.forbidden(
      "only the thread author or the task creator can delete this thread",
    );
  }

  await deleteThread(id);
  return ok({ deleted: id });
}
