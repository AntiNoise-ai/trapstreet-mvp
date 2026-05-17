# Running & reporting

## tp run

Run from the directory containing `trap.yaml`:

```bash
tp run                    # run the first task defined in trap.yaml
tp run test               # run a specific task by name
tp run -t smoke           # only run cases tagged `smoke` (repeatable)
tp run --output json      # machine-readable JSON instead of rich table
tp run --fail-fast        # stop after the first case whose solution exits non-zero
```

### Options

| Flag | Default | Description |
|---|---|---|
| `TASK` (positional) | first task in `trap.yaml` | which task to run |
| `--config / -c` | `trap.yaml` | path to the trap config file |
| `--tag / -t` | (none) | filter cases by tag; repeatable |
| `--output / -o` | `rich` | report renderer: `rich` or `json` |
| `--fail-fast` | `false` | stop after the first case whose solution exits non-zero |
| `--workspace / -w` | `.trap` | where to write run artifacts |

### Exit codes

| Code | Condition |
|---|---|
| `0` | every case exited 0 |
| `1` | at least one case had a non-zero exit code |

---

## tp report

Re-render a previously stored run from disk without re-executing the solution:

```bash
tp report                 # latest run of the first task
tp report test            # latest run of the named task
tp report test latest     # explicit `latest` alias
tp report test 2026-05-09T14:30:00   # specific run by timestamp
```

Accepts the same `--config`, `--output`, and `--workspace` flags as `tp run`.

---

## Run artifacts

Every `tp run` writes artifacts under `.trap/{task}/{timestamp}/` and updates a `latest` symlink. Use `tp report` to re-display any stored run.

See [Workspace reference](../reference/workspace.md) for the complete directory layout.
