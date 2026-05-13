# trap — CLI

> Lives at [`trapstreet-mvp/cli/`](https://github.com/AntiNoise-ai/trapstreet-mvp/tree/main/cli) — part of the trapstreet monorepo. The standalone repo `AntiNoise-ai/trap` is retained for history only; all active development happens here.

Install:

```bash
uv tool install "git+https://github.com/AntiNoise-ai/trapstreet-mvp.git#subdirectory=cli"
```

`trap` is a **non-invasive CLI testing framework for AI prompts, agents, and workflows**. It treats the program under test (the "solution") as a black box: it invokes the solution as a subprocess, captures stdout/stderr/files, then optionally pipes that output through a "judge" (per-case scorer) and a "grader" (overall aggregator) — also subprocesses, also language-agnostic.

The framework knows nothing about how the solution is implemented. Python, shell scripts, compiled binaries, agentic pipelines — anything that can be invoked from a shell works.

---

## Core idea: solution and task are decoupled

Two roles, two repos (or two directories), connected only by a small IO contract:

| Role | Owns | Configures |
|---|---|---|
| **Solution author** | `trap.yaml`, the solution code | how to invoke the solution, which inputs to feed it, which outputs it produces |
| **Task author** | `traptask.yaml`, `judge.py`, `grader.py`, `inputs/`, `expected/` | the test cases, scoring logic, expected outputs |

The solution doesn't need to import trap or know it exists. It reads paths from two environment variables (`INPUTS`, `OUTPUTS`) and runs.

```
inputs/{case_id}/   ──[INPUTS env var]──▶  solution  ──[OUTPUTS env var]──▶  .trap/{task}/{ts}/{case_id}/
expected/{case_id}/                                                                 │
       │                                                                            │
       └──────────────────────── judge  ◀──────────────────────────────────────────┘
                                   │
                            {metrics: any JSON}
                                   │
                  [collect all cases, hand to grader]
                                   │
                                grader
                                   │
                            {passed, score, ...}
```

---

## Install

Requires Python `>=3.14` and `uv`.

```bash
git clone https://github.com/AntiNoise-ai/trap
cd trap
uv sync
```

The installed entry point is **`tp`** (not `trap`), declared in `pyproject.toml`:

```bash
uv run tp --help
```

There is no PyPI release yet, so use `uv run tp …` from a clone, or run it from a wheel you build locally (`uv build`).

---

## Quick start — the echo example

The repo ships two complete worked examples under `examples/`. Walk through `examples/echo/` to see the moving pieces.

### 1. Solution side — `examples/echo/solution/`

`echo.py` reads JSON from stdin and prints `message` to stdout (or errors with exit 1 if `message` is missing):

```python
import json, sys
data = json.load(sys.stdin)
if "message" not in data:
    print("error: missing 'message' field", file=sys.stderr)
    sys.exit(1)
print(data["message"])
```

`trap.yaml` tells trap how to run it and where the task lives:

```yaml
tasks:
  test:
    description: Echo solution — reads stdin JSON, writes it back to stdout
    cmd: uv run python echo.py
    traptask: ../task          # path to the task directory (relative to trap.yaml)
    inputs:
      stdin: input.json        # pipe inputs/{case_id}/input.json into stdin
```

### 2. Task side — `examples/echo/task/`

`traptask.yaml` lists the cases and points at the judge/grader:

```yaml
dirs:
  inputs: inputs/         # optional; this is the default
  expected: expected/     # optional; this is the default

cases:
  - id: contains_basic
    description: stdout contains the substring (case-insensitive)
    tags: [smoke]
  - id: exit_code_failure
    description: exit code is 1 when message field is missing
  - id: skipped_example
    skip: true
    tags: [wip]

judge:
  cmd: .venv/bin/python judge.py     # optional — omit for output-only mode

grader:
  cmd: .venv/bin/python grader.py    # optional — omit to skip aggregation
```

Each case has a directory under `inputs/{id}/` (and optionally `expected/{id}/`) holding whatever files that case needs.

`judge.py` reads the payload from `TRAPTASK_PAYLOAD`, evaluates one case, prints a JSON metric to stdout:

```python
import json, os, re
from pathlib import Path

data = json.loads(os.environ["TRAPTASK_PAYLOAD"])
stdout = Path(data["outputs"]["case_stdout"]).read_text().strip()
exit_code = json.loads(Path(data["outputs"]["case_meta.json"]).read_text())["exit_code"]
expected = json.loads(Path(data["expected"]["expected.json"]).read_text())

# … compute results …
print(json.dumps({"score": score}))
```

`grader.py` receives the list of all case results and emits the overall verdict:

```python
import json, os
results = json.loads(os.environ["TRAPTASK_PAYLOAD"])
passed = all(r["metrics"]["score"] == 1.0 for r in results)
print(json.dumps({"passed": passed, "score": avg_score}))
```

### 3. Run it

From `examples/echo/solution/`:

```bash
uv run tp run                    # run the first task in trap.yaml
uv run tp run test               # run the named task
uv run tp run -t smoke           # only run cases tagged `smoke`
uv run tp run --output json      # print machine-readable JSON instead of a rich table
uv run tp run --fail-fast        # stop on first case whose judge score < 1.0
```

Trap writes per-run artifacts under `.trap/{task}/{timestamp}/` and updates a `latest` symlink alongside it.

---

## CLI reference

```
tp run [TASK] [OPTIONS]      # execute a task
tp report [TASK] [RUN]       # re-print the report for a stored run (defaults to `latest`)
tp init                      # scaffold trap.yaml + traptask.yaml — NOT YET IMPLEMENTED
```

### `tp run` options

| Flag | Default | Purpose |
|---|---|---|
| `TASK` (positional) | first task in `trap.yaml` | which task to run |
| `--config / -c` | `trap.yaml` | path to the trap config |
| `--tag / -t` | (none) | filter cases by tag; repeatable |
| `--output / -o` | `rich` | report renderer: `rich` or `json` |
| `--fail-fast` | `false` | stop after the first case whose judge `score < 1.0` |
| `--workspace / -w` | `.trap` | where to write run artifacts |

### `tp report` options

Re-renders a previously stored run from disk. Same `--config / --output / --workspace` flags; the `RUN` argument is the timestamp directory name, or `latest` (default).

### Exit codes

- `0` — every case exited 0, and (if a grader ran) `metrics.passed` is not `False`.
- `1` — at least one case had a non-zero exit code, **or** the grader returned `{"passed": false}`.

---

## Configuration reference

### `trap.yaml` (solution author)

```yaml
tasks:
  test:                        # task name; arbitrary
    description: optional      # shown in the report
    cmd: uv run python solution.py
    traptask: ../task          # path to the task dir (contains traptask.yaml)
    inputs:                    # optional
      stdin: input.txt         # filename in inputs/{case_id}/ to pipe as stdin
      files:                   # optional: filenames to assert exist before running
        - config.json
    file_outputs:              # files the solution promises to write
      - result.json
    timeout: 30                # seconds; default 30
    inputs_envvar: INPUTS      # override the env var name if you want
    outputs_envvar: OUTPUTS

  run:                         # second task; same traptask, different cmd or inputs
    cmd: uv run python solution.py
    traptask: ../task
    inputs:
      stdin: input.txt
    file_outputs:
      - result.json
```

- `tasks:` is a mapping; each key is a task name you can pass to `tp run`.
- `traptask` is required for every task — it points at the **directory** containing `traptask.yaml`.
- `cmd` is parsed via `shlex.split`, run with the trap.yaml's directory as `cwd`.

### `traptask.yaml` (task author)

The entire file is optional. **If `traptask.yaml` is absent**, trap scans `inputs/` and treats each subdirectory as a case in *output-only mode* (no judge, no grader, no expected). With it:

```yaml
dirs:
  inputs: inputs/                # default
  expected: expected/            # default

cases:
  - id: contains_basic           # must match an inputs/<id>/ directory
    description: optional
    tags: [smoke]                # for `tp run -t smoke`
  - id: skipped_example
    skip: true                   # case is not executed

judge:                           # optional; omit for output-only mode
  cmd: .venv/bin/python judge.py
  payload_envvar: TRAPTASK_PAYLOAD   # default; override if you must

grader:                          # optional; omit to skip aggregation
  cmd: .venv/bin/python grader.py
```

`judge.cmd` and `grader.cmd` run with `cwd` set to the task directory.

---

## The IO contract

Trap injects environment variables at three points. Values are always **JSON strings** (not file paths) so consumers can `json.loads(os.environ[…])` directly.

### Solution-side: `INPUTS` and `OUTPUTS`

Before running each case, trap injects:

```jsonc
// INPUTS — every file in inputs/{case_id}/
{
  "input.json":  "/abs/path/task/inputs/contains_basic/input.json",
  "config.json": "/abs/path/task/inputs/contains_basic/config.json"
}

// OUTPUTS — every filename declared in trap.yaml `file_outputs`
{
  "result.json": "/abs/path/.trap/test/2026-05-09T14:30:00/contains_basic/result.json"
}
```

Keys are full filenames *with* extension. Values are absolute paths. The solution reads `INPUTS["foo.json"]`, writes to `OUTPUTS["result.json"]`. If you have nothing to read or write via files you can still receive content on stdin via `inputs.stdin` in trap.yaml.

`stdout`, `stderr`, and `meta.json` are captured automatically — the solution never writes to `OUTPUTS["case_stdout"]` itself.

### Judge-side: `TRAPTASK_PAYLOAD`

For each case, the judge receives a JSON string with three namespaces:

```jsonc
{
  "inputs":   { "input.json":      "/abs/path/task/inputs/case1/input.json"      },
  "outputs":  {
    "case_stdout":     "/abs/path/.trap/test/.../case1/case_stdout",
    "case_stderr":     "/abs/path/.trap/test/.../case1/case_stderr",
    "case_meta.json":  "/abs/path/.trap/test/.../case1/case_meta.json"
  },
  "expected": { "expected.json":   "/abs/path/task/expected/case1/expected.json" }
}
```

Note the captured outputs are keyed `case_stdout`, `case_stderr`, `case_meta.json` (prefixed) — that's what the runner writes to disk and what the example `judge.py` reads. `case_meta.json` contains `{"exit_code": N, "duration": seconds}`.

The judge prints free-form JSON to stdout. Trap stores it verbatim as `CaseResult.metrics`. Convention: include a numeric `score` field if you want `--fail-fast` to be meaningful (it checks `metrics.score < 1.0`).

### Grader-side: `TRAPTASK_PAYLOAD`

The grader receives the full list of per-case results as JSON:

```jsonc
[
  {"case_id": "contains_basic", "exit_code": 0, "duration": 0.12, "metrics": {"score": 1.0}, "skipped": false},
  {"case_id": "exact_match",    "exit_code": 0, "duration": 0.11, "metrics": {"score": 0.5}, "skipped": false}
]
```

It prints free-form JSON to stdout. Convention: include `passed: bool` (used for the exit-code check) and `score: float` (used in the report header).

---

## The `.trap/` workspace

```
.trap/
└── {task_name}/
    ├── latest -> 2026-05-09T14:30:00/
    └── 2026-05-09T14:30:00/
        ├── {case_id}/
        │   ├── case_stdout
        │   ├── case_stderr
        │   ├── case_meta.json           # {"exit_code": 0, "duration": 0.12}
        │   ├── judge_stdout             # raw judge output (if judge ran)
        │   ├── judge_stderr
        │   ├── judge_meta.json
        │   └── {any declared file_outputs}
        ├── grader_stdout                # raw grader output (if grader ran)
        ├── grader_stderr
        ├── grader_meta.json
        └── report.json                  # the rendered/JSON report for this run
```

Use `tp report` to re-display a stored run without re-executing the solution.

---

## Three running modes

Choose by what you put (or don't put) in `traptask.yaml`:

| Mode | `judge` | `grader` | Pass/fail signal |
|---|---|---|---|
| Output-only | absent | absent | any case `exit_code != 0` → exit 1 |
| Per-case scoring | present | absent | same as above |
| Full evaluation | present | present | grader's `metrics.passed == false` → exit 1 |

In output-only mode you can even omit `traptask.yaml` entirely — trap will discover cases by scanning `inputs/` subdirectories.

---

## Current limitations

- `tp init` is a stub; scaffolding is not implemented yet.
- Cases run sequentially (the `TaskRunner._iter` generator is deliberately left as a seam for future parallelization).
- No PyPI release; install from source.
- Python 3.14 minimum.
