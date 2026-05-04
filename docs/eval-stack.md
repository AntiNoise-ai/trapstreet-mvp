# Evaluation Stack: What to build vs what to buy

The community edition of Trap Street needs five layers:

```
┌──────────────────────────────────────────────┐
│  1. Submission gateway                       │  ← we build
│     (Bronze upload / Silver audit / Gold)    │
├──────────────────────────────────────────────┤
│  2. Runner                                   │  ← we build
│     (call endpoints, replay reports, audit)  │
├──────────────────────────────────────────────┤
│  3. Eval library — graders & dataset shape   │  ← Pydantic Evals
│     (Cases, Evaluators, LLM judge)           │
├──────────────────────────────────────────────┤
│  4. Eval substrate — datasets, traces, store │  ← Langfuse
│     (DB-backed, queryable, multi-tenant)     │
├──────────────────────────────────────────────┤
│  5. Public leaderboard UI + Trap Street Wall │  ← we build
│     (3-tier badges, Pareto charts, embeds)   │
└──────────────────────────────────────────────┘
```

Layers 1, 2, 5 are core IP. Layers 3 and 4 are reused open-source.

---

## Layer 3: Eval library — Pydantic Evals

**What it gives us:**

- `Case` / `Dataset` / `Evaluator` primitives with full Pydantic typing
- Built-in evaluators: `LLMJudge`, `IsInstance`, `Contains`, `MatchesRegex`,
  `EqualsExpected`, `IsType`, etc.
- Async concurrent execution with cost + latency capture
- Programmatic `report` object → easy to transform into our schema
- MIT license, part of `pydantic-ai`
- **Best-in-class developer experience** for community contributors who want
  to PR new graders

**Why it wins layer 3:**

A community edition lives or dies on contributor DX. When someone wants to
add a "schema-conformance grader" for our SEC track, they should be able to
write 30 lines of typed Python and open a PR. Pydantic Evals' API makes this
trivial. Langfuse's grader API (YAML or web UI) does not — it's optimized for
ops engineers configuring rules, not Python developers writing logic.

**Where it stops:**

- No persistent storage — `Dataset` is in-memory or file-loaded
- No multi-tenant trace store
- No web UI for leaderboards or comparisons
- No cross-run aggregation queries

That's where layer 4 picks up.

---

## Layer 4: Eval substrate — Langfuse

**What it gives us:**

- DB-backed `Dataset` and `DatasetItem` records — versioned, queryable
- Trace ingestion (any agent framework) → searchable, replayable
- `Score` API → write structured scores from any source
- LLM-as-judge pipelines with prompt versioning + cost tracking
- OpenTelemetry-compatible
- **MIT license, fully self-hostable**

**Why it wins layer 4:**

Our public-facing product (rank histories, audits, replay) needs a real
database. Langfuse's data model (Dataset → DatasetItem → Trace → Score) is
purpose-built for our needs and saves us 3+ months of plumbing.

**Where it stops:**

- No submission gateway — strangers can't submit external HTTP endpoints
- No three-tier trust model — that's our IP
- No public leaderboard UI — Langfuse dashboards are private/team-internal
- No Trap Street Wall — that's our IP

---

## How layers 3 and 4 connect

```
┌─────────────────────────────┐
│   Pydantic Evals (Python)   │
│   - Case, Dataset, Eval'r   │
│   - report.py emits scores  │
└──────────────┬──────────────┘
               │ (our adapter)
               ▼
┌─────────────────────────────┐
│   Langfuse client           │
│   - Score API write         │
│   - Trace API write         │
│   - Dataset link            │
└─────────────────────────────┘
```

A small adapter (~200 lines of Python) translates Pydantic Evals' `EvaluationReport`
into Langfuse `Score` and `Trace` records. We get the authoring DX of the former
and the platform substrate of the latter.

---

## The other contenders, briefly

### Braintrust

Closed source, hosted only. **Killer for a community edition.** Contributors
must be able to self-host the entire stack. Out.

### Build from scratch

Reinventing dataset versioning + trace storage + judge pipelines = 3 months,
zero user-visible value. **NIH tax we cannot afford.** Out.

### Inspect AI (UK AISI)

Heavy framework opinionation. Best when you control both eval and model.
Awkward for "external HTTP endpoints from strangers." **Worth revisiting in
V2** when we accept Docker submissions and need sandboxed isolation.

### OpenAI Evals / DeepEval / Promptfoo / RAGAS

Each is roughly equivalent to Pydantic Evals at the eval-library layer. We
chose Pydantic Evals because:
- Cleanest typed API
- No vendor lock-in (works with any model)
- Active development (Pydantic team has compounding velocity)
- Type safety matches our code base (and avoids the "untyped dict" landmines
  the others have)

---

## What "community edition" means concretely

Three artifacts ship under the `trapstreet` org:

1. **`@trapstreet/cli`** (NPM) — Bronze tier client. Wraps `trapstreet-core`,
   handles signing + upload.
2. **`trapstreet-core`** (PyPI) — the Pydantic Evals + Langfuse adapter +
   built-in graders. Anyone can install and run our eval pipeline locally.
3. **`trapstreet/server`** (Docker Hub) — full self-hostable stack: Postgres
   + Langfuse + Next.js leaderboard. Run your own private benchmark for
   internal teams.

Anyone running `trapstreet/server` locally produces scores bit-identical to
those on `trapstreet.run` for the public task pool. **That's the credibility
moat** — "you can verify our scores yourself."

This is the OSS pattern that worked for Vercel (Next.js), Supabase (Postgres
+ own UI), and Posthog (analytics). The community edition is the trust
generator. The hosted edition is the revenue.

---

## Decision summary

| Layer | Tool | License | Why |
|---|---|---|---|
| 1. Submission gateway | Custom (Next.js API) | proprietary | Three-tier trust = our IP |
| 2. Runner | Custom (Node + Python workers) | OSS | Tier-aware orchestration |
| 3. Eval library | **Pydantic Evals** | MIT | Best DX for contributors |
| 4. Eval substrate | **Langfuse** | MIT | Best DB-backed substrate |
| 5. Leaderboard + Trap Street Wall | Custom (Next.js) | proprietary | Public IP / brand |
| Sandbox (V2) | Inspect AI sandbox | OSS | Docker isolation when we accept it |
