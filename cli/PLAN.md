# trap — 实施计划

## 待实现

- [ ] `init` 命令：scaffold trap.yaml + traptask.yaml + inputs/ 目录（当前为 stub）
- [ ] runner 并发化：`TaskRunner._iter()` 改为 `asyncio.gather` 或 thread-pool，case 并行执行、judge 串行顺序不变
- [ ] `--fail-fast` 实测验证
- [ ] 测试套件（pytest）

---

## 待定（TBD）

- [ ] Token 消耗追踪：judge stdout 是否可附带额外字段（`tokens_used` 等）
- [ ] 多步 pipeline（steps 编排）
