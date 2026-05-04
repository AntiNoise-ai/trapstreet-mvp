# Trust Tiers — Bronze / Silver / Gold

The strategic backbone of Trap Street. This document is the one to read if you
only have time for one.

---

## Why this exists

Two pressures pull in opposite directions:

| Pressure | Pulling toward |
|---|---|
| **Cost** — every eval we run on a builder's endpoint costs us $$ | "Let builders self-report" |
| **Trust** — self-reported scores have zero credibility (see HF Open LLM Leaderboard 2024 collapse) | "We must run every eval ourselves" |

Doing only one of those kills the product:

- All-self-report → no credibility → no users → no leaderboard
- All-we-run → unbounded cost → can't scale past ~50 builders

The answer is **tiered evidence with public, visible badges,** so the cost
falls on builders for low-stakes scores and on us for headline-stakes scores.

---

## The three tiers

### 🥉 Bronze — Self-Reported

**Who runs the eval:** the builder, locally, using our open-source harness
(`@trapstreet/cli`).

**Tasks used:** **Public** task pool only.

**Audit:** none. Score is published with a clearly-marked "self-reported" badge.

**Cost to us:** ~$0 (just storage of the uploaded report).

**What the builder uploads:**

```json
{
  "submission_id": "...",
  "harness_version": "0.4.2",
  "task_set_hash": "sha256:...",
  "git_commit": "abc1234",
  "model_config": { "model": "gpt-4o", "temperature": 0.0 },
  "results": [
    { "task_id": "T-0001", "answer": "...", "scores": {...}, "trace": {...} }
  ],
  "signature": "ed25519:..."
}
```

The harness signs the report with an ed25519 key tied to the harness version.
Tampering with the report after the fact invalidates the signature.

**What it's good for:** anyone can claim a Bronze score. Indie hackers, hobby
projects, models behind a paywall — all welcome. The leaderboard's long tail.

**What it isn't:** Bronze is never the headline. Bronze never appears in our
press releases. Bronze is the funnel.

---

### 🥈 Silver — Verified

**Who runs the eval:** the builder runs the full set; we re-run a 10–20% random
sample on our infrastructure and compare.

**Tasks used:** Public + a held-out sample. The held-out tasks are revealed
**only during the audit**, then retired (rotated out of the held-out pool).

**Audit:**
- We pick 20–40 tasks randomly from the builder's reported set
- We re-run them by calling the builder's endpoint ourselves
- If our re-run scores differ from reported scores by more than the **drift
  tolerance** (typically 5%), the submission is flagged
- Flagged submissions get a 7-day window to respond; unresolved → demoted to
  Bronze and added to the Trap Street Wall

**Cost to us:** ~$1–3 per Silver submission (10–20 task re-runs).

**Pricing:** small annual fee for the verified badge — the SOC 2 of AI evals.
Builders who want the credential pay for the audit cost plus margin.

**What it's good for:** SaaS tools that want a credible third-party score on
their landing page. The Verified badge is the embeddable trust object that
turns into outbound marketing.

---

### 🥇 Gold — Full Eval

**Who runs the eval:** us, end-to-end, on the builder's endpoint.

**Tasks used:** Public + Held-out + **Live Mode** (today's freshly-scraped tasks
— SEC filings, LinkedIn JDs, etc.).

**Audit:** unnecessary; we are the runner.

**Cost to us:** $5–30 per full eval depending on track. **Bounded** — we only
run Gold for:
- Top 20 of each track's Bronze/Silver leaderboard (auto-promoted, free)
- Anyone who pays the Gold tier fee (priority queue, monthly re-eval)

**What it's good for:** the headline. The viral screenshot. The press quote.
*"$199/mo tool ranks #14. Open-source script ranks #2."* That sentence is only
credible at Gold tier because Gold uses tasks the builder could not have seen.

**Live Mode is the moat.** Every other benchmark site has static tasks that get
gamed. Gold's daily-fresh tasks make gaming Bronze and Silver pointless — your
Gold score is the only one that matters, and it's computed on data that didn't
exist when you submitted.

---

## Visual hierarchy on the leaderboard

```
Track: Resume Tailoring                                Updated 2 min ago

#1   ResumeGPT-mini      🥇 GOLD     score 84.2   $0.008/task   1.4s
#2   Claude (direct)     🥇 GOLD     score 79.1   $0.015/task   2.1s
#3   Rezi                🥇 GOLD     score 71.3   $0.042/task   3.8s
─── Top 20 ─────────────────────────────────────────────────────────
#21  IndieResumeAI       🥈 SILVER   score 68.2   audit ✓        2 days ago
#22  TailorBot           🥈 SILVER   score 67.1   audit ✓        5 days ago
─── Verified tier ──────────────────────────────────────────────────
#43  WeekendHack         🥉 BRONZE   score 64.0   self-reported  1h ago
...
```

Three columns the leaderboard always shows:
1. **Tier badge** (the trust signal)
2. **Score** (how well it does the job)
3. **Audit status** ("✓", "self-reported", or "⚠ flagged")

Users scanning the table understand the trust gradient at a glance. The
hierarchy is enforced visually, not buried in fine print.

---

## The cheating scenario — and why it's actually a feature

Suppose a Bronze submitter inflates their score by editing the report locally
before upload. Three layers of defense:

1. **Signature check** — the harness signs reports with an ed25519 key tied to
   `@trapstreet/cli`'s release. Edited reports fail signature verification on
   upload and are rejected.
2. **Replay reproducibility** — Bronze reports include task seeds and model
   configs. Anyone can `npx trapstreet replay <submission-id>` and re-derive
   the score. Mismatches are public.
3. **Promotion audit** — when a Bronze submission climbs to top 20, we
   auto-promote it to Silver, which triggers our re-run. If the re-run differs
   from the report, the submission lands on the **Trap Street Wall**:

```
TRAP STREET WALL · Caught This Week

WeekendHack v3.2  reported  91.4   audited  47.2   delta  +44.2
   →  reported a fabricated work-history scrubber. Audit shows
       the workflow simply removed all dates.
```

This page is the most viral asset on the site. It is also the credibility
demonstration: every visitor who lands on the Trap Street Wall is being
shown, in real time, why our scores are trustworthy.

---

## Cost model — back-of-envelope

Assume month-2 numbers: 500 builders, 5 tracks, 200 tasks each.

| Tier | Builders/month | Cost per | Total cost |
|---|---|---|---|
| Bronze | 450 | $0 | $0 |
| Silver | 40 | $2 | $80 |
| Gold | 20 (top + paid) | $20 | $400 |
| Live Mode ingestion | — | $200 (judges + scraping) | $200 |
| Re-audits / spot checks | — | $100 | $100 |
| **Total** | | | **~$780/mo** |

Compare with the previous "all-we-run" model at the same scale: ~$50,000/mo.

**60–70× cost reduction. Same headline credibility. Better viral surface.**

---

## Revenue surface this unlocks

| Product | Tier | Price | Buyer |
|---|---|---|---|
| Verified Audit (annual) | Silver | $99–499/year | SaaS tools wanting trust badge |
| Priority Gold eval | Gold | $200/run | Pre-launch product validation |
| Driftless certification | Gold + 6mo | $1,000/year | Enterprise procurement gates |
| Private leaderboard (white-label) | n/a | $5,000/year | VCs benchmarking portfolio |

These are five-figure ARR products at the Silver/Gold tiers. The Bronze tier
remains free forever; that's what feeds the funnel.

---

## Summary diagram

```
                        ┌─────────────────────────┐
                        │      LEADERBOARD        │
                        └─────────────────────────┘
                                    ▲
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
   ┌────┴─────┐               ┌─────┴─────┐                ┌────┴────┐
   │  BRONZE  │               │  SILVER   │                │  GOLD   │
   │ self-run │  ──promote──▶ │ +10% audit│  ──promote──▶  │ we run  │
   │  public  │               │ +sample HO│                │ +Live   │
   │  $0      │               │  ~$2/run  │                │ ~$20/run│
   └──────────┘               └───────────┘                └─────────┘
        │                           │                           │
        └───── on cheat ────────────┴────────── on cheat ───────┘
                                    ▼
                        ┌─────────────────────────┐
                        │   TRAP STREET WALL      │
                        │   (public failure log)  │
                        └─────────────────────────┘
```
