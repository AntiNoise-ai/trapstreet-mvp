# trap — 实施计划

## 进行中

### `cost` 模块 — per-case token & spend 追踪

**方案**：本地 HTTP 反向代理（stdlib server + httpx 转发），通过环境变量注入拦截子进程的 LLM API 调用，不修改 solution 代码。详见 CLAUDE.md "LLM Observability" 章节。

**技术栈**：`socketserver.ThreadingMixIn + TCPServer`（daemon 线程）+ `httpx`（streaming tee）+ `tokencost`（cost 计算）

**Token 解析**（统一字段名 `prompt_tokens` / `completion_tokens`）：
- Anthropic 非流式：`usage.input_tokens` → `prompt_tokens`；`usage.output_tokens` → `completion_tokens`
- Anthropic 流式 SSE：`message_start.usage.input_tokens` + `message_delta.usage.output_tokens`
- OpenAI 非流式：`usage.prompt_tokens / completion_tokens`（原生同名）
- OpenAI 流式：需 solution 开 `stream_options.include_usage=True`，否则静默跳过

**数据模型变更**：
- 新增 `CaseCost` 模型（`models/cost.py`）：`prompt_tokens`、`completion_tokens`、`cost_usd`、`calls`、`model`、`provider`
- `CaseResult` 新增 `cost: CaseCost | None = None`（向后兼容）
- `Task` 新增 `cost: CostConfig | None = None`（`enabled: bool = True`）
- `_auto_summary_dict()` 新增 `tokens_total` 聚合，`cost_usd_total` 优先读 `CaseCost`
- `RichRenderer` case 表格加 `prompt_tok` / `compl_tok` / `cost` 列

**新增文件**：
- `src/trap/models/cost.py`
- `src/trap/cost/__init__.py`
- `src/trap/cost/proxy.py`

**新增依赖**：`httpx>=0.27`、`tokencost`

---

## 待实现

- [ ] `init` 命令：scaffold trap.yaml + traptask.yaml + inputs/ 目录（当前为 stub）
- [ ] runner 并发化：`TaskRunner._iter()` 改为 `asyncio.gather` 或 thread-pool，case 并行执行、judge 串行顺序不变
- [ ] `--fail-fast` 实测验证
- [ ] 测试套件（pytest）

---

## 待定（TBD）

- [ ] `tracing` 模块 — 记录每次 LLM 调用的 prompt/completion 内容、latency、cache hits、调用链；与 `cost` 共享同一 HTTP 代理机制，新增 collector 即可
- [ ] 多步 pipeline（steps 编排）
