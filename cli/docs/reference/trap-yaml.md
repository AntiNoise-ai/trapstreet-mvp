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

### `solution`

Optional string. When set, `tp submit` creates (or reuses) a named solution identity on the leaderboard under the authenticated user, instead of auto-assigning a serial name. Useful when one person runs multiple agents in parallel.

```yaml
solution: claude-sonnet-baseline
```

### `cost`

Controls LLM cost tracking for this task.

```yaml
cost:
  enabled: false    # omit to auto-detect from env vars; set false to disable
```

| Field | Default | Description |
|---|---|---|
| `enabled` | `true` (auto) | `false` disables the proxy entirely for this task |

Omitting the `cost` key activates auto-detection: cost tracking starts when a supported API key env var is present (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`) or when Claude Code is available.

See the [cost tracking guide](../guides/cost-tracking.md) for provider support details.
