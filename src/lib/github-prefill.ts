// Parse a GitHub task URL and fetch metadata to prefill /tasks/new.
//
// Unauth GitHub API (60 req/hr/IP) is fine for low-volume "click the
// prefill button" flow. If we hit rate limits we'd add a server-side
// token; for now KISS.

export interface ParsedTaskUrl {
  owner: string;
  repo: string;
  ref: string;        // branch/tag/sha, defaults to "main"
  path: string;       // path within the repo, no leading/trailing slash
}

export interface PrefillResult {
  id: string;
  name: string;
  track: string;
  description: string;
  traptask_ref: string;
}

/**
 * Accepts any of:
 *   https://github.com/<owner>/<repo>
 *   https://github.com/<owner>/<repo>/tree/<ref>/<path>
 *   https://github.com/<owner>/<repo>/blob/<ref>/<path>/<file>
 *   <owner>/<repo>/<path>          (our internal `traptask_ref` shape)
 */
export function parseGithubUrl(input: string): ParsedTaskUrl | null {
  const raw = input.trim();
  if (!raw) return null;

  // shape 1: full https URL
  const m = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/(?:tree|blob)\/([^/]+)\/(.*?))?\/?$/.exec(
    raw,
  );
  if (m) {
    const [, owner, repo, ref, path] = m;
    return {
      owner,
      repo: repo.replace(/\.git$/, ""),
      ref: ref || "main",
      // strip a trailing filename if /blob/ was used — task dir is the parent
      path: (path || "").replace(/\/$/, ""),
    };
  }

  // shape 2: owner/repo[/path] (our internal form)
  const parts = raw.split("/").filter(Boolean);
  if (parts.length >= 2) {
    const [owner, repo, ...rest] = parts;
    return { owner, repo, ref: "main", path: rest.join("/") };
  }
  return null;
}

async function ghFetch(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
    // 1 min cache so a 2nd prefill on same URL doesn't burn quota
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${url}`);
  }
  return res.json();
}

async function ghFetchRaw(parsed: ParsedTaskUrl, pathInTask: string): Promise<string | null> {
  // Use the API's raw content endpoint so we get a proper 404 instead
  // of an HTML page when the file's missing.
  const url = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${parsed.ref}/${
    parsed.path ? parsed.path + "/" : ""
  }${pathInTask}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return await res.text();
}

/**
 * Given a GitHub task-dir URL, pull whatever we can to pre-populate
 * the create-task form. Network failures degrade gracefully — we
 * always return a partial result, the user fills the rest.
 */
export async function prefillFromGithub(input: string): Promise<{
  result: Partial<PrefillResult>;
  warning?: string;
}> {
  const parsed = parseGithubUrl(input);
  if (!parsed) {
    return {
      result: {},
      warning: "Could not parse that as a GitHub URL.",
    };
  }

  const traptask_ref = parsed.path
    ? `${parsed.owner}/${parsed.repo}/${parsed.path}`
    : `${parsed.owner}/${parsed.repo}`;

  // ID: last segment of the path, normalised to kebab-case (matches our
  // `/tasks/:id` URL constraint).
  const lastSeg = parsed.path.split("/").filter(Boolean).pop() ?? parsed.repo;
  const id = slugify(lastSeg);

  // Track: second-to-last segment, e.g. .../tasks/pdf_reader/<name> → "pdf-reader"
  const segs = parsed.path.split("/").filter(Boolean);
  const trackSeg = segs.length >= 2 ? segs[segs.length - 2] : segs[0] ?? "";
  const track = slugify(trackSeg) || "community";

  const out: Partial<PrefillResult> = {
    id,
    track,
    traptask_ref,
  };

  // README: first H1 → name; first non-empty paragraph after that → description.
  try {
    const readme = await ghFetchRaw(parsed, "README.md");
    if (readme) {
      const lines = readme.split("\n");
      let foundH1 = false;
      const para: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!foundH1) {
          if (trimmed.startsWith("# ")) {
            out.name = trimmed.slice(2).trim();
            foundH1 = true;
          }
          continue;
        }
        if (trimmed.startsWith("#")) {
          if (para.length > 0) break;
          continue;
        }
        if (trimmed === "" && para.length > 0) break;
        if (trimmed !== "") para.push(trimmed);
      }
      if (para.length > 0) {
        out.description = para.join(" ").slice(0, 280);
      }
    }
  } catch {
    // ignore — we just won't have a name/description
  }

  // Fallbacks
  if (!out.name) {
    out.name = humanize(id);
  }

  return { result: out };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function humanize(s: string): string {
  return s
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
