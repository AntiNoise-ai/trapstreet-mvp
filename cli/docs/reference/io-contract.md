# IO contract

trap injects environment variables at three points. Values are always **JSON strings** — consumers call `json.loads(os.environ["VAR"])` directly.

---

## Solution side: INPUTS and OUTPUTS

Before running each case, trap injects:

**`INPUTS`** — every file in `inputs/{case_id}/`, keyed by filename:

```json
{
  "input.json":  "/abs/path/task/inputs/case_one/input.json",
  "config.json": "/abs/path/task/inputs/case_one/config.json"
}
```

**`OUTPUTS`** — every filename declared in `trap.yaml` `file_outputs`, keyed by filename:

```json
{
  "result.json": "/abs/path/.trap/test/2026-05-09T14:30:00/case_one/result.json"
}
```

Keys are full filenames including extension. Values are absolute paths. The solution reads from `INPUTS["foo.json"]` and writes to `OUTPUTS["result.json"]`.

`stdout`, `stderr`, and `case_meta.json` are captured automatically — the solution never writes these itself.

The env var names default to `INPUTS` and `OUTPUTS`. Override with `inputs_envvar` / `outputs_envvar` in `trap.yaml` if the solution already uses these names.

---

## Judge side: TRAPTASK_PAYLOAD

For each case, the judge receives a JSON string with three namespaces:

```json
{
  "inputs": {
    "input.json": "/abs/path/task/inputs/case_one/input.json"
  },
  "outputs": {
    "case_stdout":    "/abs/path/.trap/test/.../case_one/case_stdout",
    "case_stderr":    "/abs/path/.trap/test/.../case_one/case_stderr",
    "case_meta.json": "/abs/path/.trap/test/.../case_one/case_meta.json"
  },
  "expected": {
    "expected.json": "/abs/path/task/expected/case_one/expected.json"
  }
}
```

Captured outputs are keyed with the `case_` prefix (`case_stdout`, `case_stderr`, `case_meta.json`). `case_meta.json` contains `{"exit_code": N, "duration": seconds}`.

The judge prints free-form JSON to stdout. trap stores it verbatim as `metrics` on each case result. There are no reserved field names.

Override the env var name with `payload_envvar` in `traptask.yaml`.

---

## Grader side: TRAPTASK_PAYLOAD

The grader receives the full list of per-case results:

```json
[
  {
    "case_id": "case_one",
    "exit_code": 0,
    "duration": 0.12,
    "metrics": {"passed": true},
    "skipped": false
  },
  {
    "case_id": "case_two",
    "exit_code": 1,
    "duration": 0.08,
    "metrics": null,
    "skipped": false
  }
]
```

`metrics` is whatever the judge printed, or `null` if no judge ran. The grader prints free-form JSON to stdout — there are no reserved field names. The output is stored in the run report for display; it does not affect the process exit code.
