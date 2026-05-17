# Writing a solution

A solution is any program that can be invoked from a shell. It receives inputs via environment variables and stdin, and writes outputs to paths provided via environment variables.

---

## Minimal setup

Create `trap.yaml` next to your solution code:

```yaml
tasks:
  test:
    cmd: uv run python solution.py
    traptask: ../task          # path to the directory containing traptask.yaml
```

Run from the same directory as `trap.yaml`:

```bash
tp run
```

---

## Reading inputs

Before each case, trap injects two environment variables:

- **`INPUTS`** — JSON string mapping `filename → absolute path` for every file in `inputs/{case_id}/`
- **`OUTPUTS`** — JSON string mapping `filename → absolute path` for each file declared in `file_outputs`

```python
import json, os
from pathlib import Path

inputs = json.loads(os.environ["INPUTS"])
outputs = json.loads(os.environ["OUTPUTS"])

# read an input file
data = json.loads(Path(inputs["config.json"]).read_text())

# write an output file
Path(outputs["result.json"]).write_text(json.dumps({"answer": 42}))
```

stdin is always available if you declare it:

```yaml
tasks:
  test:
    cmd: uv run python solution.py
    traptask: ../task
    inputs:
      stdin: input.json        # pipe inputs/{case_id}/input.json into stdin
```

stdout and stderr are captured automatically — you never need to declare them.

---

## Declaring file outputs

If your solution writes files, declare them so trap knows where to route them:

```yaml
tasks:
  test:
    cmd: uv run python solution.py
    traptask: ../task
    file_outputs:
      - result.json
      - summary.txt
```

trap creates the output paths and injects them via `OUTPUTS`. The solution writes to those paths; trap stores them under `.trap/{task}/{timestamp}/{case_id}/`.

---

## Full trap.yaml reference

See [trap.yaml reference](../reference/trap-yaml.md) for all available fields.

## Running options

See [Running & reporting](running.md) for `tp run` flags (tags, fail-fast, output format).
