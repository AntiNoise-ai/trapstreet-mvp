// Public-repo verification for the "submitting to a public task requires
// a public solution repo" rule. Called from POST /api/submit/:task_id.
//
// Hard 5s timeout per check so a slow remote doesn't tie up the submit
// request. Returns a stable `{ok, reason}` shape so the API can build a
// user-friendly error message.

export interface RepoCheck {
  ok: boolean;
  reason?: string;
}

const TIMEOUT_MS = 5000;

export async function verifyPublicRepo(url: string): Promise<RepoCheck> {
  if (!url || typeof url !== "string") {
    return { ok: false, reason: "missing or invalid URL" };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: `${url} is not a valid URL` };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, reason: `${url} is not an http(s) URL` };
  }

  // For github.com, the API gives an authoritative public/private signal
  // (200 vs 404 unauth). Use that path first.
  if (parsed.hostname === "github.com" || parsed.hostname === "www.github.com") {
    return checkGithub(parsed);
  }

  // Generic fallback for non-github hosts: just confirm the URL is
  // reachable. Anyone hosting their solution elsewhere can use this.
  return checkGeneric(url);
}

async function checkGithub(parsed: URL): Promise<RepoCheck> {
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    return {
      ok: false,
      reason: `${parsed} doesn't look like a GitHub repo URL (need github.com/<owner>/<repo>)`,
    };
  }
  const [owner, repo] = parts;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo.replace(/\.git$/, "")}`;

  const res = await timedFetch(apiUrl, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (res.kind === "timeout") {
    return { ok: false, reason: `couldn't verify ${parsed} (timeout)` };
  }
  if (res.kind === "error") {
    return { ok: false, reason: `couldn't reach GitHub API (${res.message})` };
  }
  if (res.response.status === 200) return { ok: true };
  if (res.response.status === 404) {
    return {
      ok: false,
      reason: `${owner}/${repo} isn't publicly accessible (404 from GitHub API — repo is private, missing, or renamed)`,
    };
  }
  return {
    ok: false,
    reason: `GitHub API returned ${res.response.status} for ${owner}/${repo}`,
  };
}

async function checkGeneric(url: string): Promise<RepoCheck> {
  const res = await timedFetch(url, { method: "HEAD", redirect: "follow" });
  if (res.kind === "timeout") {
    return { ok: false, reason: `couldn't verify ${url} (timeout)` };
  }
  if (res.kind === "error") {
    return { ok: false, reason: `couldn't reach ${url} (${res.message})` };
  }
  if (res.response.status >= 200 && res.response.status < 400) {
    return { ok: true };
  }
  return {
    ok: false,
    reason: `${url} returned HTTP ${res.response.status} — must be publicly reachable`,
  };
}

type FetchOutcome =
  | { kind: "ok"; response: Response }
  | { kind: "error"; message: string }
  | { kind: "timeout" };

async function timedFetch(url: string, init?: RequestInit): Promise<FetchOutcome> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: ctrl.signal });
    return { kind: "ok", response };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return { kind: "timeout" };
    }
    return { kind: "error", message: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timer);
  }
}
