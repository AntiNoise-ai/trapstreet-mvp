// Docs source-of-truth. Markdown rendered via <MarkdownBlock>. When this
// grows past a single page, split into multiple route files.

export const BUILD_A_TASK_MD = String.raw`
## The mental model

\`tp\` decouples the **task author** (the person defining what counts
as correct) from the **solution author** (the person writing the code
under test). The two never import each other. They talk through a
small IO contract — environment variables and stdin/stdout. \`tp run\`
is the glue.

You can be both roles. But thinking about them separately is how the
abstraction stays clean.

## Who owns what

**Task author** owns these files (usually shipped in one GitHub repo):

- \`traptask.yaml\` — declares cases + how to invoke judge/grader
- \`inputs/<case_id>/\` — input files per case
- \`expected/<case_id>/\` — expected output files per case (optional for non-reference judges)
- \`judge.py\` — scores ONE case
- \`grader.py\` — aggregates all case scores into a run-level pass/score
- \`pyproject.toml\` — judge/grader's Python env

**Solution author** owns:

- \`trap.yaml\` — declares how to invoke their program + which task to point at
- The program itself (any language, any binary)
- \`pyproject.toml\` if the program is Python managed by uv

## The IO contract — only 5 things

\`tp run\` runs the solution once per case, passing:

- \`INPUTS\` env var — JSON object \`{ "filename.ext": "/abs/path/to/file", ... }\` of every input file for this case
- \`OUTPUTS\` env var — JSON object \`{ "filename.ext": "/abs/path/to/write", ... }\` for every output declared in \`trap.yaml\`'s \`file_outputs\`
- stdin — if \`trap.yaml\` says \`inputs.stdin: foo.txt\`, that file's content is piped to stdin
- stdout / stderr — captured automatically
- exit code — captured automatically

The judge gets a similar payload (\`TRAPTASK_PAYLOAD\` env var, JSON) with paths to outputs + expected + inputs. It writes its metrics JSON to stdout.

That's it. No SDK to import. No subclasses. Just env vars and pipes.

## Build a task from zero — "sum two numbers"

### Step 1 · Task side (one GitHub repo)

Create \`sum-task/\`:

\`\`\`text
sum-task/
├── traptask.yaml
├── pyproject.toml
├── judge.py
├── grader.py
├── inputs/
│   ├── basic/nums.json          { "a": 3, "b": 5 }
│   ├── negatives/nums.json      { "a": -1, "b": -2 }
│   └── zero/nums.json           { "a": 0, "b": 0 }
└── expected/
    ├── basic/sum.json           { "sum": 8 }
    ├── negatives/sum.json       { "sum": -3 }
    └── zero/sum.json            { "sum": 0 }
\`\`\`

\`traptask.yaml\`:

\`\`\`yaml
dirs:
  inputs: inputs/
  expected: expected/

cases:
  - id: basic
  - id: negatives
  - id: zero

judge:
  cmd: uv run python judge.py

grader:
  cmd: uv run python grader.py
\`\`\`

\`judge.py\` — scores ONE case:

\`\`\`python
import json, os
from pathlib import Path

p = json.loads(os.environ["TRAPTASK_PAYLOAD"])
actual = json.loads(Path(p["outputs"]["sum.json"]).read_text())
expected = json.loads(Path(p["expected"]["sum.json"]).read_text())

correct = actual.get("sum") == expected["sum"]
print(json.dumps({"correct": correct, "score": 1.0 if correct else 0.0}))
\`\`\`

\`grader.py\` — aggregates all cases:

\`\`\`python
import json, os

cases = json.loads(os.environ["TRAPTASK_PAYLOAD"])
scores = [c["metrics"]["score"] for c in cases if c.get("metrics")]
total = sum(scores) / len(scores) if scores else 0
print(json.dumps({"passed": all(s == 1.0 for s in scores), "score": total}))
\`\`\`

\`pyproject.toml\` — even if your judge has no deps, this lets \`uv run\` spin up a venv:

\`\`\`toml
[project]
name = "sum-task"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []
\`\`\`

Push to GitHub: \`https://github.com/<you>/sum-task\`.

### Step 2 · Solution side (your machine)

Create \`my-sum-solution/\`:

\`\`\`yaml
# trap.yaml
tasks:
  sum-two-numbers:
    cmd: uv run python solve.py
    traptask: ../sum-task
    inputs:
      files:
        - nums.json
    file_outputs:
      - sum.json
\`\`\`

\`solve.py\`:

\`\`\`python
import json, os
from pathlib import Path

inputs = json.loads(os.environ["INPUTS"])
outputs = json.loads(os.environ["OUTPUTS"])

nums = json.loads(Path(inputs["nums.json"]).read_text())
result = {"sum": nums["a"] + nums["b"]}

Path(outputs["sum.json"]).write_text(json.dumps(result))
\`\`\`

### Step 3 · Run it locally

\`\`\`bash
cd my-sum-solution
tp run
\`\`\`

You should see all 3 cases pass with \`score=1.0\`. The full run report
lands at \`.trap/sum-two-numbers/latest/report.json\`.

### Step 4 · Register the task on trapstreet

Go to \`/tasks/new\` (sign in first). Fill the form:

- **id**: \`sum-two-numbers\` — **must match** the key in your trap.yaml
- **traptask_ref**: \`<your-github-user>/sum-task\` — points at the GitHub path of the task repo
- **ranking metric**: \`total_score\` (default; \`latency_ms\` if it's a speed race)
- **rules / inputs·outputs·scoring**: Markdown describing what's allowed and what the contract looks like
- **visibility**: public (shows in the home grid) or private (only you)

Submit. Your task now has its own leaderboard page.

### Step 5 · Submit your run

\`\`\`bash
tp submit
\`\`\`

\`tp submit\` finds \`.trap/sum-two-numbers/latest/report.json\`, POSTs
it to \`/api/submit/sum-two-numbers\`, and prints a \`view_url\`
linking back to this task's leaderboard with your score on it.

Done. You're a runner.

## Common pitfalls (and how to avoid them)

- **Task name must match in 3 places**: the key in solution \`trap.yaml\`, the trapstreet task \`id\`, and the \`tp submit <name>\` argument (if you pass one). When they don't match you'll get 404 or "no report found".
- **Don't write \`.venv/bin/python ...\` in judge/grader \`cmd\`** — that assumes a venv was pre-built. Use \`uv run python ...\` — uv auto-creates and caches the venv.
- **\`INPUTS\` / \`OUTPUTS\` keys are filenames, not paths**. \`INPUTS["nums.json"]\` is right; \`INPUTS["inputs/basic/nums.json"]\` is wrong.
- **stdin is opt-in**. To get stdin in your solution, declare \`inputs.stdin: foo.txt\` in trap.yaml. Otherwise stdin is empty and you read from \`INPUTS\` paths.
- **Cases are isolated**. Each case is a fresh subprocess with a fresh \`OUTPUTS\` dir. Don't rely on shared state between cases.
- **\`traptask:\` is a relative path** when the task is on your local disk. For a real published task,you typically clone the task repo as a sibling of your solution dir, then \`traptask: ../sum-task\`.
`;
