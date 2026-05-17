# Workspace (.trap/)

Every `tp run` writes artifacts under `.trap/{task}/{timestamp}/` and updates a `latest` symlink alongside it.

## Directory layout

```
.trap/
└── {task_name}/
    ├── latest -> 2026-05-09T14:30:00/      # symlink to most recent run
    └── 2026-05-09T14:30:00/
        ├── {case_id}/
        │   ├── case_stdout                  # solution stdout (always captured)
        │   ├── case_stderr                  # solution stderr (always captured)
        │   ├── case_meta.json               # {"exit_code": 0, "duration": 0.12}
        │   ├── judge_stdout                 # raw judge output (if judge ran)
        │   ├── judge_stderr
        │   ├── judge_meta.json              # {"exit_code": 0, "duration": 0.05}
        │   └── {file_outputs}              # files declared in trap.yaml file_outputs
        ├── grader_stdout                    # raw grader output (if grader ran)
        ├── grader_stderr
        ├── grader_meta.json                 # {"exit_code": 0, "duration": 0.03}
        └── report.json                      # full serialised run report
```

## Key files

**`case_meta.json`** — written by the runner after each case:
```json
{"exit_code": 0, "duration": 0.12}
```

**`report.json`** — the full run report in JSON format. Use `tp report --output json` to print it to stdout instead of reading the file directly.

## Re-displaying a run

Use `tp report` to re-render any stored run without re-executing the solution:

```bash
tp report                              # latest run
tp report test 2026-05-09T14:30:00    # specific run by timestamp
```

## Ignoring the workspace

Add `.trap/` to your `.gitignore`:

```
.trap/
```
