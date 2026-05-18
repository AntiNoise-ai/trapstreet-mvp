import { auth } from "@/auth";
import { createSolution, getSolutionByName } from "@/lib/queries";
import { ERR, ok } from "@/lib/api";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ERR.invalid("body must be valid JSON");
  }
  const { name, endpoint_url } = (body ?? {}) as {
    name?: string;
    endpoint_url?: string;
  };
  if (!name || !endpoint_url) {
    return ERR.invalid("name and endpoint_url are required");
  }

  const existing = await getSolutionByName(name);
  if (existing) {
    return ERR.conflict(`solution name "${name}" already exists`);
  }

  // Optionally link to logged-in user. Anonymous registration still works
  // for parity with the API spec.
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const { solution, api_key } = await createSolution({
    name,
    endpoint_url,
    user_id: userId,
  });
  return ok({ solution, api_key });
}
