import { auth } from "@/auth";
import {
  deleteComment,
  getComment,
  getTask,
  getThread,
} from "@/lib/queries";
import { ERR, ok } from "@/lib/api";

// Comment author can delete their own; task creator can delete comments
// on threads attached to their task (forum moderation).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return ERR.unauthorized();

  const comment = await getComment(id);
  if (!comment) return ERR.notFound("comment not found");

  const isAuthor = comment.author_id === session.user.id;
  let isTaskOwner = false;
  if (!isAuthor) {
    const thread = await getThread(comment.thread_id);
    if (thread?.subject_type === "task") {
      const task = await getTask(thread.subject_id);
      isTaskOwner = task?.created_by === session.user.id;
    }
  }
  if (!isAuthor && !isTaskOwner) {
    return ERR.forbidden(
      "only the comment author or the task creator can delete this comment",
    );
  }

  await deleteComment(id);
  return ok({ deleted: id });
}
