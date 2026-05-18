# trap — 实施计划

## 进行中

### 非侵入式 cost/token 监控（per-case 粒度）

**方案**：本地 HTTP 反向代理（stdlib server + httpx 转发），通过环境变量注入拦截子进程的 LLM API 调用，不修改 solution 代码。

**技术栈**：
- 代理服务器：`socketserver.ThreadingMixIn + TCPServer`（daemon 线程）
- 转发客户端：`httpx`（streaming tee）
- Cost 计算：`tokencost`（`TOKEN_COSTS` dict，400+ 模型）

**自动探测**：检测到 `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GROQ_API_KEY` / `MISTRAL_API_KEY` 时自动启用；`ANTHROPIC_BASE_URL` 若已设置（如指向 Ollama）则以其为上游。用户可在 `trap.yaml` 加 `monitor: {enabled: false}` 关闭。

**Provider 覆盖**：Anthropic、OpenAI、Groq、Mistral，以及所有 OpenAI 兼容接口（DeepSeek、Kimi、豆包、Qwen 等）；Ollama/vLLM/LM Studio 等本地模型服务器也覆盖。不支持：AWS Bedrock（SigV4）、Google Vertex AI（GCP SDK）、讯飞星火（WebSocket）。

**Token 解析**：
- Anthropic 非流式：`usage.input_tokens / output_tokens`
- Anthropic 流式 SSE：`message_start` + `message_delta` 事件
- OpenAI 非流式：`usage.prompt_tokens / completion_tokens`
- OpenAI 流式：需 solution 开 `stream_options.include_usage=True`，否则静默跳过

**数据模型变更**：
- 新增 `CaseUsage` 模型（`models/usage.py`）
- `CaseResult` 新增 `usage: CaseUsage | None = None`（向后兼容）
- `Task` 新增 `monitor: MonitorConfig | None = None`
- `_auto_summary_dict()` 新增 `tokens_total` 聚合，`cost_usd_total` 优先读 `usage`
- `RichRenderer` case 表格加 `in_tok` / `out_tok` / `cost` 列

**新增文件**：
- `src/trap/models/usage.py`
- `src/trap/monitor/__init__.py`
- `src/trap/monitor/proxy.py`

**新增依赖**：`httpx>=0.27`、`tokencost`

---

## 待实现

- [ ] `init` 命令：scaffold trap.yaml + traptask.yaml + inputs/ 目录（当前为 stub）
- [ ] runner 并发化：`TaskRunner._iter()` 改为 `asyncio.gather` 或 thread-pool，case 并行执行、judge 串行顺序不变
- [ ] `--fail-fast` 实测验证
- [ ] 测试套件（pytest）

---

## 待定（TBD）

- [ ] 多步 pipeline（steps 编排）
