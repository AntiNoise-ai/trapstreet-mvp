// Docs source-of-truth. Markdown rendered via <MarkdownBlock>. When this
// grows past a single page, split into multiple route files.

export const BUILD_A_TASK_MD = String.raw`
We're going to build a task called \`sum-two-numbers\`. Runners get
two ints in a JSON file. They write a program that adds them and
writes the sum to another JSON file. We score whether their answer
matches ours. Whole thing takes about 15 minutes.

## What you're making

A task is a folder. Four things live in it:

- **\`inputs/<case>/\`** — what we hand the runner's program
- **\`expected/<case>/\`** — what we expected back
- **\`judge.py\`** — scores one case
- **\`grader.py\`** — aggregates case scores into a run-level pass/fail

Plus a \`traptask.yaml\` that wires them together. That's the whole
contract — the runner's solution and your task talk through files
and environment variables only.

## Step 1 — make the case files

\`\`\`bash
mkdir -p sum-task/inputs/basic     sum-task/expected/basic
mkdir -p sum-task/inputs/negatives sum-task/expected/negatives
mkdir -p sum-task/inputs/zero      sum-task/expected/zero
\`\`\`

Inputs:

\`\`\`bash
echo '{"a":  3, "b":  5}' > sum-task/inputs/basic/nums.json
echo '{"a": -1, "b": -2}' > sum-task/inputs/negatives/nums.json
echo '{"a":  0, "b":  0}' > sum-task/inputs/zero/nums.json
\`\`\`

Expected outputs:

\`\`\`bash
echo '{"sum":  8}' > sum-task/expected/basic/sum.json
echo '{"sum": -3}' > sum-task/expected/negatives/sum.json
echo '{"sum":  0}' > sum-task/expected/zero/sum.json
\`\`\`

Three cases, three inputs, three expected outputs. The folder names
under \`inputs/\` and \`expected/\` are the **case ids**.

## Step 2 — write the judge

\`judge.py\` runs once per case. It reads where the solution wrote its
output (and where you put the expected answer), decides whether they
match, and prints a JSON object containing at least a numeric \`score\`.

\`\`\`python
# sum-task/judge.py
import json, os
from pathlib import Path

payload = json.loads(os.environ["TRAPTASK_PAYLOAD"])

actual   = json.loads(Path(payload["outputs"]["sum.json"]).read_text())
expected = json.loads(Path(payload["expected"]["sum.json"]).read_text())

correct = actual.get("sum") == expected["sum"]
print(json.dumps({
    "score": 1.0 if correct else 0.0,
    "correct": correct,
}))
\`\`\`

That's it. \`TRAPTASK_PAYLOAD\` is a JSON string giving you absolute
paths into the runner's output dir and your expected dir for this
case. You read what's there, decide, print one line.

## Step 3 — write the grader (or skip it)

\`grader.py\` runs once at the end. It gets the list of case results
and produces one run-level summary:

\`\`\`python
# sum-task/grader.py
import json, os

cases = json.loads(os.environ["TRAPTASK_PAYLOAD"])
scores = [c["metrics"]["score"] for c in cases if c.get("metrics")]
avg = sum(scores) / len(scores) if scores else 0
print(json.dumps({
    "passed": all(s == 1.0 for s in scores),
    "score":  round(avg, 3),
}))
\`\`\`

**You can skip writing \`grader.py\` entirely.** If it's missing, the
server averages the case scores for you and calls it \`passed\` when
the average crosses 0.8. Write your own only when you want a stricter
rule (here we want **every** case at 1.0 to count as passed).

## Step 4 — wire it up with traptask.yaml

\`\`\`yaml
# sum-task/traptask.yaml
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

You also need a \`pyproject.toml\` next to \`traptask.yaml\` so \`uv run\`
can build a venv for judge/grader:

\`\`\`toml
[project]
name = "sum-task"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []
\`\`\`

That's the task. Push the \`sum-task/\` folder up to a GitHub repo.

## Step 5 — write the solution side

Now switch hats. As a runner, you make a different folder:

\`\`\`yaml
# my-solution/trap.yaml
tasks:
  sum-two-numbers:                 # this name must match the task id on trapstreet
    cmd: uv run python solve.py
    traptask: ../sum-task          # path to your cloned task folder
    inputs:
      files: [nums.json]
    file_outputs: [sum.json]
\`\`\`

\`\`\`python
# my-solution/solve.py
import json, os
from pathlib import Path

inputs  = json.loads(os.environ["INPUTS"])
outputs = json.loads(os.environ["OUTPUTS"])

nums = json.loads(Path(inputs["nums.json"]).read_text())
Path(outputs["sum.json"]).write_text(json.dumps({"sum": nums["a"] + nums["b"]}))
\`\`\`

Run it:

\`\`\`bash
cd my-solution
tp run
\`\`\`

All three cases should pass with score 1.0.

## Step 6 — publish on trapstreet

Go to \`/tasks/new\`, paste your task's GitHub URL into the auto-fill
field, review the prefilled values, hit Create. Now anyone with the
\`tp\` CLI can:

\`\`\`bash
tp run && tp submit sum-two-numbers
\`\`\`

…and their score lands on your task's leaderboard.

## What you didn't have to think about

- Test runner orchestration — \`tp\` runs each case in its own
  subprocess, captures stdout, handles timeouts, you don't write any
  of that.
- File paths — you read \`INPUTS\` / \`OUTPUTS\` / \`TRAPTASK_PAYLOAD\`
  env vars and never deal with cwd or relative paths.
- Result storage — \`.trap/sum-two-numbers/<ts>/report.json\` is
  produced automatically, ready to upload.
- Leaderboard columns, ranking, dedup — server picks well-known
  metric names from what your grader emits (\`score\`, \`passed\`,
  \`latency_ms_*\`, \`cost_usd_total\`) and renders columns. Zero
  config needed; see [the reference](/docs/reference) when you want
  something custom.

## Gotchas worth remembering

- **Case ids are folder names.** \`inputs/basic/\` and
  \`expected/basic/\` must match exactly.
- **\`INPUTS\` / \`OUTPUTS\` keys are filenames, not paths.** Use
  \`INPUTS["nums.json"]\`, not \`INPUTS["inputs/basic/nums.json"]\`.
- **The task name must match in three places**: your trap.yaml's
  top-level key, the trapstreet task id, and the argument you pass
  to \`tp submit\`.
- **Use \`uv run python ...\` in your cmd**, not
  \`.venv/bin/python ...\`. The first runs in a venv that uv
  auto-creates; the second only works if someone already set up
  a venv.
`;
