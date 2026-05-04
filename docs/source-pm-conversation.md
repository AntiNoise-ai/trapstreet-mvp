# antinoise — 产品经理视角设计 (workflow-eval platform)

**Session UUID:** `0ca04696-2de7-4537-8574-1330db6ce6f2`  
**Project:** antinoise  
**Source file:** `~/.claude/projects/-Users-shuhc-Documents-claude-antinoise/0ca04696-2de7-4537-8574-1330db6ce6f2.jsonl`  
**First event:** 2026-04-23T19:03:07.058Z  
**Last event:** 2026-04-23T19:18:50.565Z  

---

## 👤 User — turn 1

帮我读一下
https://github.com/AntiNoise-ai/market-research/blob/main/workflow-eval-platform-test-case-research.md

## 🤖 Assistant


> 🛠️ **Tool call: `ToolSearch`**
```json
{
  "query": "select:WebFetch",
  "max_results": 1
}
```

## 🤖 Assistant


> 🛠️ **Tool call: `Bash`**
```json
{
  "command": "gh api repos/AntiNoise-ai/market-research/contents/workflow-eval-platform-test-case-research.md --jq '.content' | base64 -d",
  "description": "Fetch the research markdown via GitHub API"
}
```

### 📤 Tool result (back to assistant)


> 📤 **Tool result:**
```
# Workflow Evaluation Platform — Test Case Research

*A ranked shortlist of real-world "hassles" most likely to drive attention and traffic to a platform that ranks workflows/agents/skills by whether they actually work.*

Prepared for: Ruqi
Date: April 21, 2026

---

## 0. Strategic framing (read this first)

You are not building another model leaderboard. You are building a **"does this thing actually get my job done"** leaderboard. That distinction matters for test-case selection. A good test case for your platform has five properties:

1. **Real pain.** People lose money, hours, or sleep over it today. Ideally there is already a search term people type, a subreddit where they complain, or a SaaS vendor charging for it.
2. **Checkable ground truth.** There must be an answer you can verif
... (tool result truncated)
```

## 🤖 Assistant

已读完。这是一份面向 Ruqi 的"工作流评估平台"选题研究（2026-04-21），核心逻辑是:**不是做模型排行榜,而是做"能不能真干完活"的排行榜**。

## 关键发现

**评分模型**:Demand / Data / Eval / Traffic 各 1–5 分,总分 ≥16 即为可发布候选。

**Tier 1 启动候选(≥16 分)**
| 编号 | 场景 | 分 | 看点 |
|---|---|---|---|
| T1-A | SEC 10-K/10-Q 数字抽取 | 20 | FinanceBench 已有"GPT-4 Turbo 81% 错/拒"爆款数字 |
| T1-B | 电商竞品价格监控 | 18 | 手工监控年损 ~$180K,避开 Amazon(2026-03 AI Agent 新政) |
| T1-C | 评论挖掘结构化洞察 | 17 | McAuley 数据集千万量级 |
| T1-D | 发票/收据抽取 | 17 | B2B 可信度够,但不易出圈 |
| T1-E | 简历按 JD 定制 | 17 | **最可能病毒传播**——幻觉率是杀手指标 |
| T1-F | 冷邮件个性化事实核查 | 16 | "你最爱的 AI SDR 编造了多少假细节" |

**推荐首发三选**:T1-A(金融)+ T1-C 或 T1-B(电商)+ T1-E(消费),第二月加 T1-F 打 B2B。

**必须提前处理的坑**:评估漂移(GPT-4 既当裁判又当选手)、刷榜(公开 dev + 私有 held-out + live 集)、Amazon ToS、**第一天就记录 $/任务和延迟**、可复现性(Docker runner + 固定模型版本)。

**平台 meta-hook**:"$199/月的工具排第 14,这个独立脚本排第 2,附收据" —— 独立胜巨头的那张截图就是增长飞轮。

## 👤 User — turn 2

我是cto，我怎么看不懂。。

## 🤖 Assistant

好的,我用大白话重讲一遍 — 先记一下你的角色。

## 🤖 Assistant


> 🛠️ **Tool call: `Write`**
```json
{
  "file_path": "/Users/shuhc/.claude/projects/-Users-shuhc-Documents-claude-antinoise/memory/user_role.md",
  "content": "---\nname: User role\ndescription: User is CTO at AntiNoise-ai, works on workflow/agent evaluation platform product\ntype: user\n---\n\nUser is the CTO at AntiNoise-ai. Currently involved in the \"workflow evaluation platform\" project — a benchmark/leaderboard for AI workflows, agents, and skills that measures whether they actually complete real-world jobs (not a model leaderboard).\n\nRuqi is a colleague/stakeholder on this project (market research was prepared for Ruqi).\n\nCommunication preference: prefers plain, conversational Chinese over dense consulting-style writing. Strategic framings and jargon-heavy tables lose them — lead with the punchline, explain in everyday metaphors, then optionally give structure.\n"
}
```

### 📤 Tool result (back to assistant)


> 📤 **Tool result:**
```
File created successfully at: /Users/shuhc/.claude/projects/-Users-shuhc-Documents-claude-antinoise/memory/user_role.md (file state is current in your context — no need to Read it back)
```

## 🤖 Assistant


> 🛠️ **Tool call: `Read`**
```json
{
  "file_path": "/Users/shuhc/.claude/projects/-Users-shuhc-Documents-claude-antinoise/memory/MEMORY.md"
}
```

### 📤 Tool result (back to assistant)


> 📤 **Tool result:**
```
<system-reminder>This memory is 6 days old. Memories are point-in-time observations, not live state — claims about code behavior or file:line citations may be outdated. Verify against current code before asserting as fact.</system-reminder>
1	- [Onboarding UX: conversational HITL first](onboarding_ux_hitl.md) — /onboard defaults to natural-language thread collection; modal form is a fallback, not the default
2
```

## 🤖 Assistant


> 🛠️ **Tool call: `Edit`**
```json
{
  "replace_all": false,
  "file_path": "/Users/shuhc/.claude/projects/-Users-shuhc-Documents-claude-antinoise/memory/MEMORY.md",
  "old_string": "- [Onboarding UX: conversational HITL first](onboarding_ux_hitl.md) — /onboard defaults to natural-language thread collection; modal form is a fallback, not the default",
  "new_string": "- [Onboarding UX: conversational HITL first](onboarding_ux_hitl.md) — /onboard defaults to natural-language thread collection; modal form is a fallback, not the default\n- [User role](user_role.md) — CTO at AntiNoise-ai, building workflow eval platform; prefers plain conversational Chinese over consulting-speak"
}
```

### 📤 Tool result (back to assistant)


> 📤 **Tool result:**
```
The file /Users/shuhc/.claude/projects/-Users-shuhc-Documents-claude-antinoise/memory/MEMORY.md has been updated successfully. (file state is current in your context — no need to Read it back)
```

## 🤖 Assistant

好,记下了。下面咱用大白话聊这份文档。

---

## 这份文档到底在说什么?

**你们要做的东西,一句话:** 做个"**AI 干活儿排行榜**"——不是比谁的模型参数大,而是比"**老子把真活儿丢给你,你到底干不干得成**"。

市面上 AI 工具现在全在吹牛。你们要做的事,就是摆擂台:**同一道题,让所有工具来做,看谁真能做对,公开打分。**

---

## 为什么这事能火?

作者列了个套路(照抄过往火过的榜单,比如 FinanceBench、SWE-bench):

1. **要有一个让人震惊的数字** — 比如 FinanceBench 那句"GPT-4 做 10-K 财报题,81% 做错或者拒答",一句话就火遍科技圈。
2. **要有反派和黑马** — 收 $199/月的大牌排第 14,某个野生小脚本排第 2。这种反差故事自己会传播。
3. **要换算成钱** — "这活儿手动干一年亏 18 万美金",CFO 一看就懂。
4. **要能复现** — 给数据集、给脚本,别人自己能跑一遍。
5. **情绪越浓传得越广** — 简历、冷邮件、报税这种每个人都有故事的题目,比干巴巴的 B2B 题目传得快十倍。

---

## 怎么挑题?

作者给了个打分表,**四项各 1–5 分**:

- **需求** — 有多少人被这事烦得睡不着?
- **数据** — 能不能合法拿到干净的标准答案?
- **评分** — 机器能不能自动判对错?
- **传播** — 结果出来能不能被人截图到处发?

**总分 ≥16 就是值得首发的好题。**

---

## 作者推荐你们先做哪几个?

挑了 3 个打头阵:

| 做啥 | 为啥做这个 |
|---|---|
| **抽 SEC 财报里的数字**(比如 "苹果 Q3 经营现金流多少") | 已经有现成数据集,已经有爆款数字("81% 答错"),金融圈天然爱传 |
| **电商评论挖掘**(一万条评论里,最大的投诉是啥) | 数据千万条免费可用,商家天天为这头疼 |
| **简历按 JD 定制** | **最可能出圈**。关键杀手指标:**"这工具编造了几条假工作经历?"** 人人都有简历焦虑,一上热搜就停不下来 |

第二个月再加一个 **"冷邮件个性化事实核查"**——"你花钱买的 AI 销售工具,给客户胡编了多少假细节?"——B2B 圈自己就会转发。

---

## 最要命的几个坑(你作为 CTO 必须拍板)

1. **别让 GPT-4 既当选手又当裁判** — 会出偏差,至少 10% 人工复核。
2. **防刷榜** — 榜单一红,人就开始针对你的题训练。要准备三套数据:公开练习集 + 私藏测试集(每月刷新) + 实时新题(比如最新财报一出就上)。
3. **别碰 Amazon** — 2026 年 3 月 Amazon 出了新政策,非官方爬取要封号。用别的电商平台。
4. **第一天就记成本和延迟** — "每道题花了多少钱、多少秒"。这是 FinanceBench 当年漏的,补得很痛。**"每美元能答对几题"** 这个指标一出,小作坊就能爆大厂。
5. **可复现** — 每个提交都要能用 Docker 跑,模型版本要锁死。

---

## 一句话带走

**你们的 slogan 自己就写好了:**

> "$199 一个月的工具排第 14。这个开源小脚本排第 2。附证据。"

这张截图就是你们的增长引擎。上面每一道 Tier 1 的题,都是为了生产这张截图。

---

有哪块想细聊?比如"评分机制怎么防作弊"、"首发该投多少工程量",或者"这里面哪条路线最不像创业公司能吃下的"——我可以展开讲。

## 👤 User — turn 3

继续聊下去，让我听听，我还是不懂具体干什么，怎么实施

## 🤖 Assistant

好,咱不谈战略,直接演一遍**一个真实场景**,你就知道具体要造啥了。

挑最容易想象的:**简历定制排行榜**。

---

## 场景 1:一个求职者(你的网站的"观众")

小李今晚要投 10 家公司,不想自己改简历,想找个 AI 工具。

他打开你们的网站 `antinoise.ai/resume-tailor`,看到:

```
简历定制 AI 真实测评榜 · 测试于 2026-04-24 · 共 200 道题

排名  工具              总分   幻觉率   关键词匹配   每次花费   响应速度
#1    某独立开源脚本    82    1.2%     91%          $0.008    1.4s
#2    Claude 直写        79    0.8%     87%          $0.015    2.1s
#3    Rezi ($29/月)      71    6.5%     93%          $0.042    3.8s
#4    Huntr ($39/月)     68    4.1%     88%          $0.038    2.9s
#14   某网红工具         41    18.7%    62%          $0.091    5.2s
```

**小李点进 #3 Rezi,看到:**

- "在第 47 题里,Rezi 给你**编造了** '曾在字节跳动实习' 这段经历——你原简历里没有"
- "第 89 题,JD 要求 'Kubernetes',Rezi 的输出里没出现这个词"
- 带截图、带原文对比

**这个页面就是你的产品。** 围观群众来看热闹,转发,引流。

---

## 场景 2:一个 builder(你的"参赛者")

小王做了个简历工具,想证明自己比 Rezi 牛,投 VC 时好讲故事。

他在你们网站:

1. 注册账号
2. 填表:
   - 工具名:`ResumeGPT-mini`
   - **提交一个 HTTP 接口**:`https://my-api.com/tailor`,约定入参 `{jd, resume}`,出参 `{tailored_resume}`
   - 或者一个 Docker 镜像(更严格)
3. 点"开始评测"
4. 你们后端:把 200 道题一道道打到他的接口,收回答,5 分钟内出分
5. 榜单更新

**就这么简单。builder 只管写一个 HTTP 接口,剩下全是你们的事。**

---

## 所以,你们具体要造啥?

**六个组件,缺一不可:**

### ① 题库(最难的,也是你们的护城河)

一个数据库,存 200+ 道题,每题三样东西:

```
{
  "jd": "字节跳动后端工程师 JD 原文...",
  "original_resume": "小李的原始简历 PDF/DOCX",
  "ground_truth": {
    "jd_keywords": ["Golang", "Kubernetes", "微服务", "高并发"],
    "allowed_experience": ["阿里云 2 年", "腾讯 3 年"],  // 原简历里真有的
    "forbidden_fabrications": []  // 给评委标出的可编造陷阱
  }
}
```

**这是你们唯一无法被 AI 替代的资产**。200 道题 = 2 个实习生标 2 周。

### ② 分层测试集

- **公开练习集**:20 道题,所有人能看。用来让 builder 调参。
- **私藏评测集**:180 道题,**永远不公开**。每月替换 20 道防刷榜。
- **实时题**:最新发的 JD(从 LinkedIn 爬),builder 没见过。

### ③ Runner 服务(跑测试的后台)

伪代码长这样:

```python
def evaluate(workflow_endpoint, test_set):
    results = []
    for question in test_set:
        start = time.now()
        answer = http_call(workflow_endpoint, question, timeout=60s)
        results.append({
            "answer": answer,
            "latency_ms": time.now() - start,
            "cost_usd": estimate_cost(answer)
        })
    return results
```

加上队列、重试、隔离沙箱。**1 个工程师 1 周能搭出第一版。**

### ④ 评分引擎(五个评委,各打一项)

| 评委 | 怎么评 | 工具 |
|---|---|---|
| 关键词评委 | JD 关键词在改后简历里出现几个? | 正则 / embedding 匹配 |
| 幻觉评委 | 改后的简历里,有没有原简历没有的经历? | Judge LLM(GPT-4 当裁判) |
| 具体性评委 | 每句话是不是都有数字/项目名? | Judge LLM |
| 格式评委 | DOCX/PDF 结构还在不在? | 解析器 |
| 成本评委 | 这次调用花了多少钱、几秒? | 直接记录 |

**每个评委 100–300 行代码。**

### ⑤ 排行榜前端

一个 Next.js 站,三种页面:
- 榜单总览
- 单个工具的详情(每题答得怎么样)
- 提交入口

**1–2 周。**

### ⑥ 沙箱 + 提交门户

- OAuth 登录
- 发 API key
- 限流(免得有人恶意跑爆你)
- **隔离**:builder 的接口可能返回奇怪的东西,要防 XSS / 超大响应

**2 周,因为安全不能省。**

---

## MVP 时间表(就做一个"简历定制"题目)

| 周次 | 干啥 | 谁 |
|---|---|---|
| W1–2 | 题库:标 200 道题 | 你 + 1 个懂招聘的人 |
| W1–2 | Runner 服务 | 1 个后端 |
| W2–3 | 5 个评委 graders | 1 个后端 |
| W3–4 | 前端排行榜 | 1 个前端 |
| W4–5 | 提交门户 + 沙箱 | 后端 |
| W5–6 | **自己跑 8 个标杆产品**(Rezi / Huntr / ChatGPT / Claude 裸用 / 等),把榜单填满 | 全员 |
| W6 | 发布 + 发 Twitter/小红书 | 你 |

**6 周,2–3 个人。**

---

## 发布第一天你必须做的一件事

**别上线空榜单。**

**你自己先跑 8 个标杆产品**(Rezi / Huntr / Kickresume / Teal / ChatGPT 官方 / Claude / Gemini / 某网红中文工具),**把数据填满**,造出那句爆款话:

> **"我们测了 8 个简历 AI 工具,4 个编造了你的工作经历。第 1 名不是花 $29/月的那个。"**

这句话配一张榜单截图,发小红书 + X + Hacker News,**第一天 10 万曝光**,不难。

---

## 三个决策你现在得拍板

1. **首发题目选哪个?** 我建议简历定制,因为:
   - 人人有故事(比 SEC 财报传得远十倍)
   - 数据好标(200 份简历 + JD,找外包 3 天搞定)
   - **"编造经历"这个指标极其上头**

2. **builder 怎么接入?** 建议 **HTTP 接口**起步,半年后再加 Docker。Docker 运维贵,HTTP 够跑。

3. **你打算自己投多少钱?** 6 周,2–3 人,大概 10–15 万人民币就能出 MVP。再加 5 万跑标杆产品(Rezi $29 × 5 个账号 × 跑 200 题这种)。**总预算 20 万以内能砸出第一版。**

---

要我接下来展开讲哪个?

- **A.** 题库具体怎么标注,一道题长啥样,给你看个真实例子
- **B.** "幻觉评委" 怎么用 LLM 判,怎么防它瞎打分
- **C.** 防刷榜的三层数据集具体怎么运作
- **D.** 发布那天的营销话术和推广渠道

选一个,我给你展开到能直接开干的程度。

## 👤 User — turn 4

站在天才产品经理视角，按照现在所有的硅谷新鲜ai思维，能否设计一个这样的网站的功能和页面列表，让我跟你对话详细需求

## 🤖 Assistant

好,产品经理帽戴上。先甩一个**产品论断**,再上页面和功能,最后标出"硅谷味儿最重的 5 个杀器"让你挑着聊。

---

## 产品论断(一句话)

> **"AntiNoise 不是榜单,是 AI 工具的真相层。**
> 每个 AI 工具在这儿,都必须当着全世界的面跑真活儿。
> 观众看热闹,买家下决定,作者拼身价。"**

类比:**Chatbot Arena × 大众点评 × GitHub Trending**,但针对"能不能干完活"这个维度。

---

## 三种用户,三种心智

| 用户 | 来干嘛 | 爽点 |
|---|---|---|
| **买家**(求职者 / SMB 老板 / 采购 / 投资人) | 找一个真能干活的工具 | "我省下 $29/月,而且效果更好" |
| **作者**(indie hacker / agent 创业公司 / 大厂 PM) | 证明自己比巨头强 | "我的工具拿到 Top 3 徽章,官网一贴,融资有谱了" |
| **分析者**(媒体 / KOL / 投资人) | 拿数据写文章 / 做赛道尽调 | "每周的 Diff 报告就是我的内容素材库" |

---

## 页面 & 功能全景(按用户分组)

### 🟢 A. 公共页(无需登录,为 SEO 和传播而生)

| # | 页面 | 一句话功能 |
|---|---|---|
| A1 | **首页 / 战场** | 活体榜单,滚动字幕显示实时排名变动("Rezi 刚刚下跌 3 位"),大字报标题"$29/月的 #14,开源脚本 #2" |
| A2 | **任务榜单页**(每个赛道一个) | "简历定制榜"、"财报抽取榜"——排名 + 分数 + 成本 + 延迟 + **帕累托前沿图**(准确率 vs 每次花费) |
| A3 | **工具详情页** | 单个工具的成绩单:所有赛道分数、失败画廊、完整 trace 回放、"和谁对打"按钮 |
| A4 | **Agent Arena(头对头对战页)** 🔥 | 选两个工具 + 一道题,并排看它们当场做,观众投票"谁赢了",生成分享卡 |
| A5 | **题目详情页** | "简历里 JD 要求量化结果,哪些工具翻车了"——所有工具在这道题上的答案并排 |
| A6 | **Hallucination Wall(翻车墙)** 🔥 | 每日一张"AI 说 X,真相是 Y"的卡片,TikTok/小红书预制素材 |
| A7 | **Playground(不注册就能玩)** 🔥 | 上传你的简历 + 粘贴一个 JD,Top 3 工具**现场**帮你改,5 秒出结果。留邮箱才能看完整报告 |
| A8 | **买家导购** | "2026-04 最佳简历 AI 工具"——SEO 永动机,每个赛道一篇,内容自动从评测数据生成 + 编辑润色 |
| A9 | **每周 Diff 报告**(邮件 + RSS) | "本周大事:Rezi 下跌 4 位,新王登基。点击查看详细原因" |
| A10 | **预测市场 / 押注**(可选,轻量) | "Q3 前会有工具突破 90% 分吗?"社区小额虚拟币下注,增加留存 |

### 🔵 B. 作者页(登录后)

| # | 页面 | 一句话功能 |
|---|---|---|
| B1 | **提交入口** | 填表 → 提交 HTTP 接口 或 Docker 镜像 → 选模型配置(方便算成本) → 一键评测,5 分钟出分 |
| B2 | **作者仪表盘** | 我的所有赛道排名、每题历史、成本延迟趋势图、对比"新版本 vs 线上版"(A/B 模式) |
| B3 | **CI 自动提交钩子** 🔥 | GitHub Actions 一行代码接入,**每次 release 自动评测**,排名波动 Slack/Discord 通知 |
| B4 | **"AntiNoise Verified" 嵌入徽章** 🔥 | 发一段 iframe/React 代码,贴到自己官网——**活体徽章**,排名变了自动更新。Top 10 银徽、Top 3 金徽、#1 加王冠 |
| B5 | **作者主页(公开)** | 工具定价、官网链接、一键"立即使用"(可做返佣) |

### 🟡 C. 分析者 / 开发者页

| # | 页面 | 一句话功能 |
|---|---|---|
| C1 | **Judge the Judge(评委的评委)** 🔥 | 公开我们的 LLM 评委和人类标注员的一致率。**透明度就是护城河**,防止别人说"你的评分不公" |
| C2 | **开源数据 + Runner** | GitHub 链接、Docker 镜像、Discord 社区贡献题库 |
| C3 | **研究博客 / Insights** | "1000 次简历改写我们学到了什么"——投资机构会订阅 |
| C4 | **公共 API** | 任何人可程序化调用分数、嵌入榜单。TechCrunch 写文章都拿你的数据 |

### 🔴 D. 内部(运营后台)

| # | 页面 | 一句话功能 |
|---|---|---|
| D1 | 评测控制台 | 开新一轮评测、轮换私藏测试集、人工标注队列 |
| D2 | 社区审核 | 用户提交的题目审核、假徽章举报、申诉处理 |

---

## 🔥 硅谷味儿最重的 5 个杀器(产品的命门)

戴着 genius PM 帽,这几个是能让你们**和 90% 的 benchmark 网站拉开代差**的招:

### 1️⃣ Agent Arena(活体对战) — 抄 LMArena
让用户**选两个工具,选一道题,点开始,两边同时跑**,看着它们一句一句输出,像直播打游戏。最后一个"谁赢"按钮收集众意,跟我们的客观评分双轨并行。

**为啥是杀器:** LMArena 从 0 到估值几亿美金靠的就是这个机制。娱乐性 + 数据飞轮。

### 2️⃣ Live Mode(永远打不过的新题) — 抄 Polymarket / Kalshi 的"实时"感
**每天凌晨从 SEC 抓最新 10-Q,每小时从 LinkedIn 抓最新 JD**,工具必须在"永远没见过的题"上表现。防刷榜,也让榜单有"鲜活感"——今天的结果可能和昨天完全不同。

**为啥是杀器:** 现有的 benchmark 全是死题,作弊容易。活题=别人永远追不上的壁垒。

### 3️⃣ Playground-First Onboarding(不注册先爽) — 抄 Perplexity / Claude.ai
首页丢个简历,**不用登录**,**5 秒**看到 Top 3 工具同时给你改好的版本。要看完整分析和"第 4–10 名"才留邮箱。

**为啥是杀器:** 转化漏斗顶端扩 10 倍。这是 Perplexity 干翻 Google 的核心操作。

### 4️⃣ Embeddable Live Badge(作者的虚荣税) — 抄 GitHub stars / Product Hunt 徽章
作者贴一个 **iframe 徽章**到自己官网,榜单排名实时更新,**作者把我们的流量反向导回来**。

**为啥是杀器:** 零成本病毒增长。每贴一次 = 作者官网访客看见"AntiNoise" logo 一次。Product Hunt 当年就靠这个起家。

### 5️⃣ Judge the Judge(评委透明化) — 抄科研 peer review 文化
公开每个 LLM 评委和人类标注员的**一致率、偏见测试、失败样本**。有人质疑"你打分不公",我们甩一个页面:"这是我们 10% 人工复核的原始数据,开源,你来看"。

**为啥是杀器:** 榜单最容易被质疑的就是"你凭啥这么打分"。先发制人,把透明度做成武器。信任一建立,对手 18 个月追不上。

---

## V0 → V1 → V2 顺序建议

**V0(6 周,拼流量爆款)**
- A1 首页 + A2 单赛道榜单(选简历定制)+ A3 工具详情 + A6 翻车墙 + A7 Playground
- B1 提交入口
- **目标:** 小红书 / X 病毒传播 1 次,10 万曝光

**V1(V0 后再 8 周,把作者留住)**
- A4 Arena + A9 周报 + B2 仪表盘 + B4 嵌入徽章 + C1 Judge the Judge
- 再开 2 个赛道(财报 + 冷邮件)
- **目标:** 100 个工具主动提交评测,50 个嵌入徽章

**V2(再 3 个月,搞生态)**
- B3 CI 钩子 + C4 API + A10 预测市场 + D2 社区审核
- 所有 Tier-1 赛道全开
- **目标:** 每周 Diff 周报 1 万订阅,API 有第三方应用调用,媒体引用成标配

---

## 现在,挑一条线咱们展开

这些功能里,有些你一听就有主意,有些可能是你第一次想——挑一个钻进去,我陪你把需求拍到**"明天就能丢给工程师写"**那种细度:

- **A.** Agent Arena 具体长啥样?两个工具怎么并排跑?观众投票怎么防刷?
- **B.** Playground 的极简体验:从用户贴简历到看结果,**一秒一秒**的画面该是啥样
- **C.** 嵌入徽章的产品规则:怎么防作者作弊?徽章的视觉语言(金银铜)怎么设计?
- **D.** 每周 Diff 周报的内容结构:一封爆款周报长啥样?抄谁家的?
- **E.** Live Mode 技术上怎么实现"每天新题",让作弊成本真的高于收益?
- **F.** Judge the Judge 的透明度页面长啥样?怎么把"LLM 打分可信"讲给不懂 AI 的 CFO 听?

告诉我哪个,我当场设计给你看。

---

**End of session.** 4 user turns rendered.