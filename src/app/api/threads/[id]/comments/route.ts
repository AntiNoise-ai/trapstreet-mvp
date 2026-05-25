import { auth } from "@/auth";
import {
  createComment,
  ensureUserRow,
  getThread,
} from "@/lib/queries";
import { ERR, ok } from "@/lib/api";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return ERR.unauthorized();

  const { id } = await params;
  const thread = await getThread(id);
  if (!thread) return ERR.notFound("thread not found");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ERR.invalid("body must be valid JSON");
  }
  const { body: text } = (body ?? {}) as { body?: string };
  if (!text || text.length === 0) return ERR.invalid("body is required");

  try {
    await ensureUserRow(session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });
  } catch (e) {
    return ERR.internal(
      e instanceof Error ? e.message : "could not ensure user row",
    );
  }

  const comment = await createComment({
    thread_id: id,
    author_id: session.user.id,
    body: text,
  });
  return ok({ comment });
}
