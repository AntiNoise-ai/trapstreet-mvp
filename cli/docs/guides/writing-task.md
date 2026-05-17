# Writing a task

A task defines the test cases, inputs, expected outputs, and scoring logic for a benchmark. It is completely decoupled from any specific solution.

---

## Minimal setup — output-only mode

If you just want to run cases and inspect outputs without scoring, you don't even need a `traptask.yaml`. Create an `inputs/` directory with one subdirectory per case:

```
task/
└── inputs/
    ├── case_one/
    │   └── input.json
    └── case_two/
        └── input.json
```

trap auto-discovers the cases by scanning `inputs/`. Any case whose solution exits non-zero counts as a failure.

---

## Adding traptask.yaml

For explicit case control, a judge, or a grader, create `traptask.yaml` in the task directory:

```yaml
dirs:
  inputs: inputs/        # default
  expected: expected/    # default

cases:
  - id: case_one
    description: optional human-readable label
    tags: [smoke]
  - id: case_two
    skip: true           # skip this case entirely
    tags: [wip]

judge:                           # optional
  cmd: .venv/bin/python judge.py

grader:                          # optional
  cmd: .venv/bin/python grader.py
```

Both `judge` and `grader` are optional — trap runs whatever is present and stops at that stage:

- No `judge`: the solution still runs for every case; `metrics` on each case result is empty.
- No `grader`: per-case results are still collected and reported; there is no final aggregation step.

---

## Writing a judge

The judge runs once per case. It receives `TRAPTASK_PAYLOAD` — a JSON string with three namespaces of file paths:

```python
import json, os
from pathlib import Path

data = json.loads(os.environ["TRAPTASK_PAYLOAD"])

# inputs/ files for this case
input_path   = data["inputs"]["input.json"]

# captured solution outputs
stdout       = Path(data["outputs"]["case_stdout"]).read_text().strip()
exit_code    = json.loads(Path(data["outputs"]["case_meta.json"]).read_text())["exit_code"]

# expected/ files for this case
expected     = json.loads(Path(data["expected"]["expected.json"]).read_text())

# print result — any JSON shape is valid; field names are yours to choose
passed = stdout == expected["answer"]
print(json.dumps({"passed": passed, "expected": expected["answer"], "got": stdout}))
```

The judge prints free-form JSON to stdout. trap stores it verbatim as `metrics` on each case result — there are no reserved field names. `--fail-fast` is based on the solution's exit code, not on any judge metric.

---

## Writing a grader

The grader runs once after all cases complete. It receives the full list of case results via `TRAPTASK_PAYLOAD`:

```python
import json, os

results = json.loads(os.environ["TRAPTASK_PAYLOAD"])
# results is a list of:
# {"case_id": str, "exit_code": int, "duration": float, "metrics": any, "skipped": bool}

n_passed = sum(1 for r in results if not r["skipped"] and r["exit_code"] == 0)
n_total = sum(1 for r in results if not r["skipped"])

print(json.dumps({"passed": n_passed, "total": n_total}))
```

The grader prints free-form JSON to stdout — field names are yours to choose. The output is stored and displayed in the report; it does not affect the process exit code (which is determined solely by case exit codes).

---

## Three running modes

Choose by what you put in `traptask.yaml`:

| Mode | `judge` | `grader` | Pass/fail signal |
|---|---|---|---|
| Output-only | absent | absent | any case `exit_code != 0` → exit 1 |
| Per-case scoring | present | absent | same as above |
| Full evaluation | present | present | same as above; grader output is for reporting only |

---

## Full traptask.yaml reference

See [traptask.yaml reference](../reference/traptask-yaml.md) for all available fields.

See [IO contract](../reference/io-contract.md) for the full `TRAPTASK_PAYLOAD` schema.
