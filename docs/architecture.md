# Community Edition Architecture

Goal: anyone can clone a repo, run `docker compose up`, and have their own private
Trap Street instance. Anyone can run `npx trapstreet eval` and reproduce a public
score.

This document reflects the **tiered trust model** (Bronze / Silver / Gold) — see
[`trust-tiers.md`](trust-tiers.md) for the strategy behind the architecture.

---

## The four verbs (from the manifesto)

```
Define real tasks  →  Explore tasks  →  Submit a task  →  Run an eval
```

Each verb maps to one component.

---

## System diagram

```
                          ┌────────────────────────────┐
                          │   trapstreet.run (web)    │
                          │   - leaderboard (3 tiers) │
                          │   - playground            │
                          │   - submission portal     │
                          │   - Trap Street Wall      │
                          └─────────────┬─────────────┘
                                        │
        ┌───────────────────────────────┼─────────────────────────────┐
        │                               │                             │
   ┌────▼─────┐  ┌─────────────┐  ┌────▼──────┐  ┌────────┐  ┌───────▼──────┐
   │ Bronze   │  │  Silver     │  │  Gold     │  │ Public │  │  Trap Street │
   │ Upload   │  │  Audit      │  │  Runner   │  │ Read   │  │  Wall API    │
   │ API      │  │  API        │  │  Queue    │  │ API    │  │              │
   └────┬─────┘  └──────┬──────┘  └─────┬─────┘  └───┬────┘  └──────┬───────┘
        │               │               │            │              │
        ▼               ▼               ▼            │              │
  verify signature   sample 10–20   builder API     │              │
  replay locally    re-run on us    + Live tasks    │              │
        │               │               │            │              │
        └───────────────┴───────┬───────┘            │              │
                                ▼                    │              │
                      ┌──────────────────┐           │              │
                      │  Scorer Pipeline │           │              │
                      │  (Pydantic Evals │           │              │
                      │   + LLM judge)   │           │              │
                      └─────────┬────────┘           │              │
                                │                    │              │
                                ▼                    │              │
                      ┌──────────────────┐           │              │
                      │     Langfuse     │◀──────────┘              │
                      │  - datasets      │                          │
                      │  - traces        │                          │
                      │  - scores        │                          │
                      └─────────┬────────┘                          │
                                │                                   │
                                ▼                                   │
                      ┌──────────────────┐                          │
                      │ Postgres + Redis │                          │
                      │  + S3 / R2       │                          │
                      └─────────┬────────┘                          │
                                │                                   │
                                ▼                                   │
                      ┌──────────────────┐                          │
                      │ Trap Street DB   │──────────────────────────┘
                      │ - submissions    │
                      │ - tier badges    │
                      │ - audit results  │
                      │ - cheating log   │
                      └──────────────────┘
```

---

## The four verbs, mapped

### 1. Define real tasks

A task lives in `trapstreet-tasks/<track>/<task-id>/`:

```
trapstreet-tasks/resume-tailoring/T-0001/
├── task.yaml          # metadata: track, version, ground-truth schema
├── input.json         # what the builder receives ({ jd, resume })
├── ground_truth.json  # what we score against ({ keywords, allowed_experience })
└── README.md          # human description, why this task exists
```

`task.yaml`:

```yaml
id: T-0001
track: resume-tailoring
version: 1
created: 2026-04-21
contributor: ruqi
visibility: public        # public | held-out | live
trap_street: false        # if true, this task contains a planted falsehood probe
graders:
  - keyword_match
  - hallucination_judge
  - format_check
  - cost_meter
  - latency_meter
```

PRs to add tasks go through community review (2 maintainers approve).
Trap-street tasks are reviewed by maintainers only and never appear in public
listings.

### 2. Explore tasks

Static site under `trapstreet.run/tasks/<track>/<task-id>` — generated from the
`trapstreet-tasks` repo at build time. Anyone can read every **public** task.

Held-out, live, and trap-street tasks are NOT exposed. Only their existence and
their contribution to scores is shown.

### 3. Submit a task (i.e., submit a workflow)

Three submission paths, one per tier.

#### 🥉 Bronze — upload self-run report

```bash
$ npx @trapstreet/cli eval \
    --track resume-tailoring \
    --endpoint https://my-api.com/tailor \
    --output report.json
$ npx @trapstreet/cli upload report.json --token $TS_TOKEN
```

The CLI:
- Pulls the latest **public** task set
- Calls the builder's endpoint locally
- Runs all graders via Pydantic Evals
- Outputs a signed JSON report (ed25519 + harness version)
- Uploads to `https://trapstreet.run/api/bronze/upload`

The Bronze Upload API:
- Verifies the ed25519 signature
- Verifies the task-set hash matches a known harness version
- Spot-checks 1–2 results by **deterministic replay** (same seed, same model)
- If any check fails: rejected with reason
- If passes: leaderboard updated, "self-reported" badge attached

#### 🥈 Silver — request audit

Submitted via the web portal:

```json
{
  "name": "ResumeGPT-mini",
  "owner": "github.com/foo/bar",
  "endpoint": "https://my-api.com/tailor",
  "auth": { "type": "bearer", "secret_ref": "user-provided" },
  "tracks": ["resume-tailoring"],
  "tier_requested": "silver"
}
```

Silver Audit API enqueues a Silver run:
- Fetches the builder's most recent Bronze report (must exist)
- Picks 20–40 random tasks (mix of public + held-out sample)
- Calls the builder's endpoint for those tasks ourselves
- Compares our scores to the reported scores
- If within drift tolerance (default 5%): Silver badge issued
- If outside tolerance: flagged → 7-day appeal → demote to Bronze + Trap Street Wall

#### 🥇 Gold — full eval

Auto-promoted (top 20 of any track) or paid (priority queue).

Gold Runner Queue:
- Pulls public + held-out + Live Mode tasks
- Calls builder's endpoint for the entire set (~200 tasks)
- Runs all graders end-to-end on our infra
- Score wins headline placement on the leaderboard

### 4. Run an eval

Whether it's the local CLI (Bronze) or the cloud Runner (Silver/Gold), the
**scoring pipeline is identical**. This is the reproducibility guarantee.

```python
from pydantic_evals import Dataset, Case
from trapstreet.graders import KeywordMatch, HallucinationJudge, FormatCheck

dataset = Dataset(
    cases=[Case(...) for task in tasks],
    evaluators=[
        KeywordMatch(),
        HallucinationJudge(model="gpt-4o-mini"),
        FormatCheck(),
    ],
)
report = await dataset.evaluate(builder_endpoint_call)
```

Same code runs locally (Bronze) and on our infra (Silver/Gold). Identical
inputs produce identical scores. **That's the H4.**

---

## Data model

Three stores:

**Langfuse** owns:
- `dataset` (= track + version)
- `dataset_item` (= task)
- `trace` (= one endpoint invocation)
- `score` (= grader output)

**Trap Street DB (Postgres)** owns:
- `submission` (builder + endpoint metadata)
- `run` (a submission × tier × dataset_version → linked to Langfuse `dataset_run`)
- `tier_badge` (current tier per submission, history of promotions/demotions)
- `audit_result` (Silver-tier audit comparisons + verdicts)
- `cheating_log` (entries on the Trap Street Wall)
- `embed_token` (issued badge tokens)

**Object store (S3 / R2)** holds:
- Bronze submitted reports (signed JSON)
- Held-out task content (server-side only)
- Live Mode daily ingestion artifacts

**Reproducibility guarantee:** anyone running their own Langfuse + Trap Street
DB + Pydantic Evals harness against the public task pool will produce
**identical scores** to our public Bronze numbers. Audit and Live Mode
require our infra by design.

---

## Anti-cheat — three layers

### Layer 1: Held-out task pool

Maintained in private S3, rotated monthly. Used in:
- Silver audits (a sample is shown only during audit, then retired)
- Gold full evals (used in entirety, never published)

### Layer 2: Live Mode

Daily ingestion. Sources per track:

| Track | Live source |
|---|---|
| SEC extraction | EDGAR daily filings (cron 06:00 UTC) |
| Resume tailoring | LinkedIn job postings, scraped hourly |
| Cold-email fact-check | Recent Crunchbase / news headlines |
| Review mining | New Amazon / Trustpilot reviews (compliant sources) |

Live tasks are < 24 hours old at eval time. **Cannot be in any model's training
data.** This is the moat.

### Layer 3: Trap Streets (the namesake feature)

Some tasks (5–10% of held-out) contain **planted falsehoods or canary signals**:

- A résumé task whose ground truth says "no employer named 'Quanta Robotics'
  exists in this résumé" — tools that hallucinate "improving Quanta Robotics
  systems" trip the trap
- A SEC task whose source filing has been edited to remove a specific number,
  with ground truth "the number is not present in the filing" — tools that
  fabricate the number trip the trap
- A canary phrase embedded in tasks that, if echoed verbatim, indicates the
  builder is leaking ground truth back through the workflow

A score on a trap-street task contributes to a separate **Fabrication Index**,
shown on every tool's detail page. Tools with high Fabrication Index get
prominent warnings and feed the Trap Street Wall.

---

## Cost model — by tier

| Tier | Marginal cost per submission | Cap |
|---|---|---|
| Bronze | $0 (storage only) | unlimited |
| Silver | ~$2 (10–20 task re-runs + judge) | unlimited (paid by builder) |
| Gold | ~$20 ($5 endpoint + $5 judge + $10 amortized Live Mode) | top 20/track + paid tier |

**Total infra cost at month-2 target (500 builders, 5 tracks):** ~$780/mo.

See [`trust-tiers.md`](trust-tiers.md) for the full back-of-envelope.

---

## Stack summary

| Layer | Tool |
|---|---|
| Web app | Next.js 15 + React 19 |
| Backend API | Next.js route handlers + tRPC |
| Eval library (graders, dataset shape) | **Pydantic Evals** (Python) |
| CLI (Bronze tier) | Node wrapper around `@trapstreet/core` Python module |
| Queue | BullMQ (Redis) for V0; Inngest for V1 |
| Eval substrate (datasets, traces, scores) | **Langfuse** (self-hosted) |
| Database | Postgres (shared with Langfuse) + Redis |
| Object storage | S3 / R2 |
| Hosting | Vercel (web) + Railway/Fly (workers + Langfuse) |
| OSS distribution | NPM (`@trapstreet/cli`), PyPI (`trapstreet-core`), Docker Hub (`trapstreet/server`) |

---

## Why Pydantic Evals + Langfuse together

- **Pydantic Evals** gives us the eval-authoring DX. Community contributors who
  PR a new grader write Python with full type safety, no DSL, no learning curve.
  This is what makes the OSS task repo grow.
- **Langfuse** gives us the platform substrate. Datasets, traces, scores, and
  judge pipelines live in a queryable DB with a UI. This is what powers the
  public leaderboard, the historical comparisons, and the audit replay UX.

Pydantic Evals' `report.print()` output gets transformed into Langfuse `Score`
records by our Runner. The two systems agree on a common schema; neither
duplicates the other.
