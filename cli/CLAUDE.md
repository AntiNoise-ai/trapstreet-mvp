# trap — Coding Agent Reference

## Project Overview

`trap` is a non-invasive CLI testing framework for AI workflows, agents, and prompt pipelines.
It treats the **solution** (the program under test) as a black box, calling it via subprocess and
evaluating its outputs (stdout and/or files). The framework knows nothing about how the solution is implemented.

Key constraint: solution repo and task repo are fully decoupled — they share only an IO contract.

Ownership:
- **task author** owns `traptask.yaml` and `task/judge.py` — defines what the solution must do and how to judge it
- **solution author** owns `trap.yaml` and `solution/` — configures how their solution runs (inputs, outputs, timeout) and points to the task directory

---

## IO Contract

**Solution side** — runner injects two env vars before each run (values are JSON strings, not file paths):
- `INPUTS` → JSON string mapping `filename → absolute path` for all files in `inputs/{case_id}/`
- `OUTPUTS` → JSON string mapping `filename → absolute path` for each declared `file_outputs` entry

Solution may also receive content piped to stdin (declared via `inputs.stdin` in trap.yaml).
stdout and stderr are always captured automatically.

**trap.yaml format** (`tasks:` wrapper; `traptask` is required for all tasks):
```yaml
tasks:
  test:
    cmd: uv run python solution.py
    traptask: ../task            # path to task directory; trap loads ../task/traptask.yaml
    inputs:
      stdin: input.txt           # optional: pipe this file as stdin
      files:                     # optional: validate these filenames exist before running
        - config.json
    file_outputs:                # files the solution writes via OUTPUTS env var
      - result.json
    timeout: 30                  # default 30s
    inputs_envvar: INPUTS           # override if solution already uses this name
    outputs_envvar: OUTPUTS

  run:                           # second task; same traptask, different cmd or inputs
    cmd: uv run python solution.py
    traptask: ../task
    inputs:
      stdin: input.txt
    file_outputs:
      - result.json
```

**Task side** — `traptask.yaml` is optional. If absent, trap auto-discovers cases by scanning `inputs/` subdirectories and runs in output-only mode (no judge/grader/expected). When present:
- `judge` and `grader` in traptask.yaml are optional; omitting either skips that step
- judge/grader receive `TRAPTASK_PAYLOAD` as a JSON string (not a file path) mapping `{inputs, outputs, expected}` namespaces (`filename → absolute path`)
- judge/grader write their result JSON to **stdout**; trap captures and stores it as `metrics`
- `payload_envvar` in traptask.yaml overrides the env var name (default `TRAPTASK_PAYLOAD`)

**Namespace key convention**: filenames including extension (`config.json`, `case_stdout`, `case_meta.json`).

**`.trap/` workspace**:
```
.trap/
└── {task}/
    ├── latest -> 2026-05-09T14:30:00/   # symlink to most recent run
    └── 2026-05-09T14:30:00/
        ├── {case_id}/                    # case outputs (case_stdout, case_stderr, case_meta.json, file_outputs)
        └── report.json                   # report for this run
```

---

## Architecture

```
loader  →  runner  →  judge  →  reporter
  ↑           ↑            ↑            ↑
YAML       subprocess   built-in     rich / JSON
parsing                or custom
```

Modules interact only through pydantic models (serialisable data). No shared state.
`runner` is intentionally stateless — inputs and outputs are plain data.

`TaskRunner._iter()` is kept as a separate generator (not inlined into `run()`) to preserve a clean
seam for future async or multi-threaded case execution — e.g. replacing the for-loop body with
`asyncio.gather` or a thread-pool map without restructuring `run()`.

---

## Rust Rewrite Constraints

These constraints keep future Rust migration cheap — do not violate them:

1. **Module boundaries**: loader / runner / judge / reporter communicate only via pydantic models.
   No shared mutable state between modules.
2. **Serialisable data only**: pass pydantic models (JSON-serialisable) across module boundaries.
   No Python-specific runtime objects.
3. **Stateless runner**: `runner` is a pure function — same inputs always produce same outputs.
4. **Stable JSON schema**: `--json` output schema is a public contract. Changes must be backwards-compatible.
5. **No dynamic Python features** in cross-module interfaces (no metaclasses, no dynamic attributes).

Modules most likely to be rewritten in Rust first: `runner`, `reporter`, CLI entry point.
`judge/custom` stays Python (calls user-written Python code).
