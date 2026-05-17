# trap

**Non-invasive CLI testing framework for AI prompts, agents, and workflows.**

trap treats the program under test (the "solution") as a black box: it invokes it as a subprocess, captures stdout/stderr/files, then optionally pipes the output through a judge (per-case scorer) and a grader (overall aggregator) — also subprocesses, also language-agnostic.

The framework knows nothing about how the solution is implemented. Python, shell scripts, compiled binaries, agentic pipelines — anything invokable from a shell works.

---

## Core idea: solution and task are decoupled

Two roles, two directories, connected only by a small IO contract:

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

## Where to start

**I want to see a complete end-to-end example first:**
→ [Quick start](quickstart.md)

**I want to test my solution against an existing task:**
→ [Writing a solution](guides/writing-solution.md)

**I want to create a benchmark or evaluation task:**
→ [Writing a task](guides/writing-task.md)
