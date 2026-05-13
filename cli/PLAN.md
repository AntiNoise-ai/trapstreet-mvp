# trap — 实施计划

## 背景与目标

为 AI prompt / agent / workflow 提供一个**完全解耦、非侵入式**的 CLI 测试框架。

核心原则：
- 框架只关心 input/output，不管被测程序用什么语言或框架实现
- **solution author** 写 `trap.yaml`（运行配置）和 `solution/`；**task author** 写 `traptask.yaml`、`judge.py`、`grader.py` 及测试数据
- 被测程序以 shell 命令调用（subprocess），支持任意语言/脚本/管线
- judge / grader 同样以 subprocess 调用，语言无关

技术栈：Python + typer / pydantic v2 / pyyaml / rich / loguru / uv / ruff / pytest

---

## 项目目录结构

```
trap/
├── examples/
│   ├── echo/
│   │   ├── solution/
│   │   │   ├── trap.yaml           # solution author 维护：tasks、cmd、inputs binding、traptask 路径
│   │   │   └── echo.py             # fake solution，原样回显 input
│   │   └── task/
│   │       ├── traptask.yaml       # task 单一入口：cases、dirs、judge/grader cmd
│   │       ├── judge.py            # per-case 评分，env var 协议（TRAPTASK_PAYLOAD → stdout）
│   │       ├── grader.py           # overall 聚合，env var 协议（TRAPTASK_PAYLOAD → stdout）
│   │       ├── pyproject.toml      # task 独立依赖
│   │       ├── inputs/             # 每个 case 一个子目录 inputs/{id}/，支持多文件（静态，task author 维护）
│   │       └── expected/           # 每个 case 一个子目录 expected/{id}/，支持多文件（静态，task author 维护）
│   └── word-count/                 # 多输入多输出示例
│       ├── solution/
│       │   ├── trap.yaml
│       │   └── word_count.py
│       └── task/
│           ├── traptask.yaml
│           ├── judge.py
│           ├── grader.py
│           ├── inputs/
│           └── expected/
├── src/
│   └── trap/
│       ├── __init__.py
│       ├── cli.py                  # typer app，所有 CLI 命令
│       ├── models/
│       │   ├── __init__.py
│       │   ├── config.py           # Task、InputsBinding（trap.yaml 模型）
│       │   ├── task.py             # TrapTask、TrapTaskCase、SubprocessCmd、DirsConfig
│       │   └── results.py          # CaseResult、GraderResult
│       ├── loader.py               # YAML 加载 + 路径解析
│       ├── runner.py               # subprocess 执行引擎，注入 INPUTS/OUTPUTS env vars
│       ├── judge/
│       │   ├── __init__.py
│       │   └── subprocess.py       # subprocess 调用 judge/grader，设置 TRAPTASK_* env vars
│       └── reporter/
│           ├── __init__.py
│           ├── rich_reporter.py
│           └── json_reporter.py
├── tests/
├── pyproject.toml
├── CLAUDE.md
└── PLAN.md
```

> `examples/` 里的 `solution/` 和 `task/` 在真实使用场景中会分属不同 repo，此处并排只是为了开发方便。

---

## 已确认的设计决策

### 整体 IO 契约

```
inputs/{id}/  ──[INPUTS env var]──→  solution  ──[OUTPUTS env var]──→  .trap/{task}/{ts}/{id}/
expected/{id}/                                                                 │
      │                                                                           │
      └────────────────────── judge ←────────────────────────────────────────────┘
                                 │
                           {metrics: Any}
                                 │
                     [collect all case results]
                                 │
                              grader
                                 │
                           {metrics: Any}
```

### 三个命名空间

| 命名空间 | 解析路径 | 归属 |
|---------|---------|------|
| `inputs` | `{task_dir}/inputs/{case_id}/` | task author，静态，提交到 repo |
| `expected` | `{task_dir}/expected/{case_id}/` | task author，静态，提交到 repo |
| `outputs` | `.trap/{task}/{timestamp}/{case_id}/` | trap 运行时生成，**不在 task 目录中** |

`outputs/{case_id}/` 结构（trap 自动写入）：
```
.trap/{task}/{ts}/{case_id}/
├── stdout         # solution 的 stdout 原文
├── stderr         # solution 的 stderr 原文
├── meta.json      # {"exit_code": 0}
└── {file_outputs} # solution 声明并写入的文件
```

### .trap/ workspace

```
.trap/
└── {task}/
    ├── latest -> 2026-05-09T14:30:00/   # symlink，指向最近一次运行
    └── 2026-05-09T14:30:00/
        ├── basic/
        ├── case_sensitive/
        └── report.json                   # 本次运行的报告（json/rich）
```

### trap.yaml 格式（已确认）

顶层有 `tasks:` wrapper。所有 task 都必须有 `traptask`（指向 task 目录，trap 在其中找 `traptask.yaml`）。solution author 维护：

```yaml
tasks:
  test:
    cmd: uv run python word_count.py
    traptask: ../task              # task 目录路径，trap 加载 ../task/traptask.yaml
    inputs:
      stdin: text.txt              # inputs/{id}/text.txt 以 stdin 传入
      files:
        - config.json              # 校验 inputs/{id}/config.json 存在（也在 INPUTS 中）
    file_outputs:
      - frequencies.json           # solution 写入 OUTPUTS["frequencies.json"] 路径
      - summary.json
    timeout: 30                    # 默认 30s
    inputs_envvar: INPUTS             # 默认值，可覆盖
    outputs_envvar: OUTPUTS           # 默认值，可覆盖

  run:                             # 同一 traptask，不同 cmd 或 inputs 配置
    cmd: uv run python word_count.py
    traptask: ../task
    inputs:
      stdin: text.txt
      files:
        - config.json
    file_outputs:
      - frequencies.json
      - summary.json
```

CLI：
```
trap run              → 运行第一个 task
trap run <name>       → 运行指定 task
```

- 每个 task 完整独立，无继承
- solution 通过 `INPUTS`/`OUTPUTS` env var 获取文件路径，不知道 trap 的存在

### 三种运行模式（已确认）

| 模式 | judge | grader | exit code 逻辑 |
|------|-------|--------|---------------|
| 纯输出 | None | None | 任意 case exit_code ≠ 0 → exit 1 |
| 单 case 评分 | 有 | None | 同上 |
| 完整评测 | 有 | 有 | `GraderResult.metrics["passed"]` 为 False → exit 1 |

### INPUTS / OUTPUTS env var 协议（已确认）

trap runner 在运行 solution 前注入两个 env var（值直接为 JSON 字符串，无需读文件）：

| env var | 值 | 内容 |
|---------|-----|------|
| `INPUTS` | JSON 字符串 | `{"filename.ext": "/abs/path/to/file", ...}` — inputs/{id}/ 下所有文件 |
| `OUTPUTS` | JSON 字符串 | `{"filename.ext": "/abs/path/to/output/file", ...}` — solution 声明的 file_outputs |

- key 为**完整文件名（含扩展名）**，例如 `config.json`、`meta.json`
- value 为绝对路径
- `INPUTS` 包含 case 目录下所有文件，无论 `inputs.files` 是否声明（声明只用于校验）
- solution 读 `json.loads(os.environ["INPUTS"])["config.json"]` 获取路径

### traptask.yaml 格式（已确认）

task author 维护。**整个文件可省略**：若 `traptask.yaml` 不存在，trap 自动扫描 `inputs/` 子目录作为 case，以纯输出模式运行（无 judge/grader/expected）。

`traptask.yaml` 存在时，`judge` 和 `grader` 均为可选，省略则跳过对应步骤：

```yaml
dirs:
  inputs: inputs/      # 默认值，可省略
  expected: expected/  # 默认值，可省略

cases:
  - id: contains_basic
    description: stdout contains the substring (case-insensitive)
    tags: [smoke]
  - id: exit_code_failure
    description: exit code is 1 when message field is missing
  - id: skipped_example
    skip: true
    tags: [wip]

judge:                             # 可选；省略 → 纯输出模式，CaseResult.metrics = None
  cmd: .venv/bin/python judge.py   # 相对于 traptask.yaml 所在目录

grader:                            # 可选；省略 → 无整体聚合，GraderResult.metrics = None
  cmd: .venv/bin/python grader.py
```

- `traptask.yaml` 缺失时：扫描 `inputs/` 子目录自动发现 case，无 skip/tags/description/judge/grader
- judge / grader 无需声明 inputs/expected binding，trap 自动注入
- `skip: true` 的 case 直接跳过
- `tags` 用于 CLI 过滤（`trap run --tag smoke`）

### Judge 协议（已确认）

**职责**：对单个 case 评分，返回自由格式 JSON（`metrics: Any`）。

**通信**：env var + stdout：
- `TRAPTASK_PAYLOAD` → JSON 字符串（直接在 env var 里，非文件路径），可通过 `payload_envvar` 字段覆盖
- result → judge/grader 将自由格式 JSON 写到 **stdout**，trap 捕获

**TRAPTASK_PAYLOAD 内容**（trap 自动组装，三命名空间全部注入）：

```json
{
  "inputs": {
    "input.json": "/abs/path/task/inputs/case1/input.json"
  },
  "outputs": {
    "stdout":    "/abs/path/.trap/test/2026-05-09T14:30:00/case1/stdout",
    "stderr":    "/abs/path/.trap/test/2026-05-09T14:30:00/case1/stderr",
    "meta.json": "/abs/path/.trap/test/2026-05-09T14:30:00/case1/meta.json"
  },
  "expected": {
    "expected.json": "/abs/path/task/expected/case1/expected.json"
  }
}
```

- key 为**完整文件名（含扩展名）**
- value 为绝对路径，judge 自行读取，支持任意格式包括 binary

**judge stdout**（自由格式，trap 不解读）：
```json
{"score": 1.0}
```
trap 将此内容原样存为 `CaseResult.metrics`。

### Grader 协议（已确认）

**职责**：聚合所有 case 的 judge 结果，决定整体通过策略。

**通信**：同 judge，env var + stdout。

**TRAPTASK_PAYLOAD 内容**（grader 版，为各 case 的 `CaseResult.model_dump()` 列表）：
```json
[
  {"case_id": "contains_basic", "metrics": {"score": 1.0}, "skipped": false},
  {"case_id": "exact_match",    "metrics": {"score": 0.5}, "skipped": false}
]
```
grader 通过 `r["metrics"]["score"]` 等访问 judge 输出的内容。

**grader stdout**（自由格式，trap 不解读）：
```json
{"passed": true, "score": 0.75}
```
trap 将此内容原样存为 `GraderResult.metrics`。reporter 约定从 `metrics.passed` / `metrics.score` 读取展示信息。

### 完整 IO 契约汇总

| 阶段 | 谁写 | 谁读 | 内容 |
|------|------|------|------|
| solution 运行（stdin） | trap | solution | inputs/{id}/{stdin_file} 内容以 stdin 传入 |
| solution 运行（INPUTS） | trap | solution | env var 直接为 JSON 字符串 → `{filename: abs_path}` |
| solution 运行（OUTPUTS） | trap | solution | env var 直接为 JSON 字符串 → `{filename: abs_path}` |
| outputs 捕获 | trap | judge | stdout / stderr / meta.json 写入 `.trap/{task}/{ts}/` |
| judge payload | trap | judge | TRAPTASK_PAYLOAD env var → 三命名空间 JSON 字符串（key 含扩展名） |
| judge result | judge | trap | stdout → 自由格式 JSON → `CaseResult.metrics` |
| grader payload | trap | grader | TRAPTASK_PAYLOAD env var → `[CaseResult.model_dump()]` JSON 字符串 |
| grader result | grader | trap | stdout → 自由格式 JSON → `GraderResult.metrics` |

---

## 实现阶段

### ✅ Phase 1 — 骨架

`uv run trap --help` 可用，三个命令 stub，pre-commit 配置，环境就绪。

### ✅ Phase 2 — echo 示例

- [x] 目录结构：solution/、task/、inputs/、expected/
- [x] traptask.yaml 格式（judge/grader cmd、dirs、cases）
- [x] inputs/expected 目录结构（`{id}/` per case，支持多文件）
- [x] outputs 命名空间（stdout / stderr / meta.json，`.trap/{task}/{ts}/` 下，不在 task 目录）
- [x] judge/grader 职责分离（per-case vs overall）
- [x] judge/grader env var 协议（TRAPTASK_PAYLOAD → stdout）
- [x] trap.yaml 格式（`tasks:` wrapper，`file_outputs`，`inputs.stdin: str`）
- [x] INPUTS/OUTPUTS env var 协议（key 含扩展名，value 为绝对路径）

### ✅ Phase 3 — word-count 示例

- [x] 多输入（stdin + config.json via INPUTS）、多输出（frequencies.json + summary.json via OUTPUTS）
- [x] 4 个 case（basic、case_insensitive、case_sensitive、empty）
- [x] judge 校验两个输出文件，grader 聚合 score

### ✅ Phase 4 — trap 核心模块实现

- [x] `src/trap/models/config.py` — `Task`（traptask 必填）、`InputsBinding`
- [x] `src/trap/models/task.py` — `TrapTask`（judge/grader 可选）、`TrapTaskCase`、`SubprocessCmd`、`DirsConfig`
- [x] `src/trap/models/results.py` — `CaseResult`、`GraderResult`
- [x] `src/trap/models/__init__.py`
- [x] `src/trap/loader.py` — `TrapLoader`、`TrapTaskLoader`（traptask 指向目录）
- [x] `src/trap/runner.py` — subprocess 执行，注入 INPUTS/OUTPUTS
- [x] `src/trap/reporter/__init__.py` — `OutputFormat` enum
- [ ] `src/trap/reporter/rich_reporter.py` — 三种模式（纯输出 / judge-only / 完整 eval）
- [ ] `src/trap/reporter/json_reporter.py`
- [x] `src/trap/cli.py` — `run` 命令（judge/grader 未接入）

### ✅ Phase 5 — 端到端验证

- [x] echo 所有 case PASS，exit code 0
- [x] word-count 所有 case PASS
- [x] `--tag smoke` 过滤正常
- [x] `.trap/{task}/{ts}/{case_id}/` 目录结构正确

### Phase 6 — 待实现

- [ ] judge/grader subprocess 调用（`run_judge` / `run_grader`），接入 cli.py
- [ ] `src/trap/reporter/rich_reporter.py` — 三种模式（纯输出 / judge-only / 完整 eval）
- [ ] `src/trap/reporter/json_reporter.py`
- [ ] `init` 命令：scaffold trap.yaml + traptask.yaml + inputs/ 目录
- [ ] `--fail-fast` 实测验证
- [ ] 测试套件（pytest）

---

## 待定（TBD）清单

- [ ] Token 消耗追踪：judge stdout 是否可附带额外字段（`tokens_used` 等）
- [ ] 多步 pipeline（steps 编排）
