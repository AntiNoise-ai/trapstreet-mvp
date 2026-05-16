"use server";

import { prefillFromGithub } from "@/lib/github-prefill";

// Server action wrapper so the client TaskForm can request GitHub
// prefill without a custom API route.
export async function prefillTaskAction(url: string) {
  return prefillFromGithub(url);
}
