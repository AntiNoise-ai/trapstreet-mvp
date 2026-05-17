# trap.yaml reference

`trap.yaml` is the solution author's config. It lives next to the solution code and tells trap how to invoke the solution, where the task lives, and what inputs/outputs to wire up.

## Full example

```yaml
tasks:
  test:
    description: optional — shown in the report header
    cmd: uv run python solution.py
    traptask: ../task
    inputs:
      stdin: input.json
      files:
        - config.json
    file_outputs:
      - result.json
    timeout: 30
    inputs_envvar: INPUTS
    outputs_envvar: OUTPUTS
    metadata:
      model: gpt-4o
      framework: langchain

  run:
    cmd: uv run python solution.py
    traptask: ../task
    inputs:
      stdin: input.json
    file_outputs:
      - result.json
```

## Fields

### `tasks` (required)

A mapping of task name → task config. Each key is a task name you can pass to `tp run <name>`. If you only have one task, `tp run` uses it automatically.

### `cmd` (required)

Shell command to invoke the solution. Parsed via `shlex.split` and run with the `trap.yaml` directory as `cwd`.

### `traptask` (required)

Path to the task directory (relative to `trap.yaml`). trap looks for `traptask.yaml` inside this directory.

### `description`

Optional label shown in the report header.

### `inputs`

Controls what trap feeds to the solution before each case.

| Field | Type | Description |
|---|---|---|
| `stdin` | filename | Pipe `inputs/{case_id}/{filename}` into the solution's stdin |
| `files` | list of filenames | Assert these files exist in `inputs/{case_id}/` before running; raises an error if any are missing |

All files in `inputs/{case_id}/` are always exposed via the `INPUTS` env var regardless of what `files` declares.

### `file_outputs`

List of filenames the solution promises to write. trap creates the destination paths and injects them via the `OUTPUTS` env var. The solution reads the path from `OUTPUTS["filename"]` and writes to it.

### `timeout`

Maximum seconds to wait for the solution subprocess. Default: `30`.

### `inputs_envvar`

Name of the env var injected with the inputs mapping. Default: `INPUTS`. Override if the solution already uses this name for something else.

### `outputs_envvar`

Name of the env var injected with the outputs mapping. Default: `OUTPUTS`.

### `metadata`

Free-form dict attached to the run report. Use it to record solution configuration (model name, framework version, etc.). Never validated by trap.
