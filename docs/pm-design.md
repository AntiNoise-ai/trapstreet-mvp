# PM Design — Pages & Features

Distilled from the original CTO conversation.
Full transcript: [`source-pm-conversation.md`](source-pm-conversation.md).

---

## Product thesis

> **Trap Street is not a leaderboard. It's the truth layer for AI tools.**
> Every AI tool here runs real tasks in front of the world. We plant verifiable
> truths and watch who fabricates.
> Buyers decide. Builders prove. Analysts mine.

Reference points: **Chatbot Arena × Yelp × GitHub Trending** — but for "does it
finish the job, and is it telling you the truth."

The leaderboard now operates on the **three-tier trust model** — see
[`trust-tiers.md`](trust-tiers.md). Every page below shows tier badges
(🥉 Bronze / 🥈 Silver / 🥇 Gold) prominently.

---

## Three users

| User | Why they come | What they want |
|---|---|---|
| **Buyer** (job-seeker / SMB / procurement / VC) | Find a tool that actually works | "I save $29/mo and get better output" |
| **Builder** (indie hacker / agent startup / big-co PM) | Prove their tool beats the incumbent | "Top-3 badge on our site → fundraising signal" |
| **Analyst** (media / KOL / VC) | Get data to write with | "Weekly Diff report = my content pipeline" |

---

## Page map

### A. Public pages (no login, built for SEO + virality)

| # | Page | One-line spec |
|---|---|---|
| A1 | **Home / The Arena** | Live leaderboard with rank-change ticker. Hero: "$29/mo tool ranks #14. Open-source script ranks #2." |
| A2 | **Track leaderboard** (one per task family) | Resume tailoring / SEC extraction / etc. — rank, score, cost, latency, **Pareto frontier chart** (accuracy vs $/task) |
| A3 | **Tool detail page** | Single tool's report card: scores across all tracks, failure gallery, full trace replay, "vs another tool" button |
| A4 | **Agent Arena** (head-to-head) 🔥 | Pick two tools + one task → both run live, side-by-side. Audience votes. Generates share card. |
| A5 | **Task detail page** | "On this résumé task, which tools fabricated experience?" — every tool's answer side-by-side |
| A6 | **Trap Street Wall** 🔥 | Daily card: "AI said X. Truth was Y." Pre-baked TikTok/小红书 content. |
| A7 | **Playground** (no signup) 🔥 | Upload your résumé + paste a JD → top-3 tools tailor live in 5 seconds. Email-gate the full report. |
| A8 | **Buyer's guide** | "Best resume AI in April 2026" — SEO compounding machine, auto-generated from eval data + editor polish |
| A9 | **Weekly Drift Report** (email + RSS) | "This week: Rezi fell 4 ranks. New #1." |
| A10 | **Prediction market** (optional) | "Will any tool break 90% by Q3?" — community virtual currency, retention loop |

### B. Builder pages (logged in)

| # | Page | One-line spec |
|---|---|---|
| B1 | **Submission portal** | Three paths: 🥉 Upload Bronze report from CLI, 🥈 Request Silver audit, 🥇 Apply for Gold (paid or top-20 auto-promotion) |
| B2 | **Builder dashboard** | All tracks, score history, cost/latency trends, A/B (new version vs production) |
| B3 | **CI auto-submit hook** 🔥 | One-line GitHub Action — every release auto-evals — Slack/Discord alerts on rank changes |
| B4 | **Embeddable live badge** 🔥 | iframe / React snippet for builder's own site. Live rank, auto-updates. Top-10 silver, top-3 gold, #1 crown. |
| B5 | **Public builder profile** | Pricing, link to product, "Try now" CTA (affiliate-trackable) |

### C. Analyst / developer pages

| # | Page | One-line spec |
|---|---|---|
| C1 | **Judge the Judge** 🔥 | Public agreement rates: LLM judges vs human annotators. Bias audits. Failure samples. Transparency = moat. |
| C2 | **Open data + runner** | GitHub link, Docker image, Discord for community task contributions |
| C3 | **Research blog / Insights** | "What we learned from 1,000 résumé rewrites" — VCs subscribe |
| C4 | **Public API** | Programmatic access to scores. TechCrunch and analysts pull from this. |

### D. Internal (ops)

| # | Page | Purpose |
|---|---|---|
| D1 | Eval control console | Schedule rounds, rotate held-out set, human annotation queue |
| D2 | Community moderation | Submitted task review, badge-fraud reports, appeals |

---

## The five Silicon-Valley-grade weapons

These five features are what separate Trap Street from "yet another benchmark site":

### 1️⃣ Agent Arena (live head-to-head) — borrowed from LMArena

Pick two tools + one task → both run live → audience votes a winner alongside our
objective score. Entertainment + data flywheel.

**Why a moat:** LMArena went 0 → ~$1B valuation on this mechanic alone.

### 2️⃣ Live Mode (un-cheatable fresh tasks) — borrowed from Polymarket / Kalshi

Every dawn we pull the latest 10-Q filings. Every hour we pull fresh LinkedIn JDs.
Tools must perform on tasks **they could not have trained on.** Defeats benchmark
gaming AND keeps the leaderboard alive — today's results may differ from yesterday's.

**Why a moat:** Static benchmarks are infinitely cheatable. Live tasks are an
ever-renewing supply only we control.

### 3️⃣ Playground-first onboarding — borrowed from Perplexity

Drop a résumé on the home page. **No signup.** 5 seconds later you see the top-3
tools' tailored output. Email-gate the full report and ranks 4–10.

**Why a moat:** 10x funnel-top expansion. This is how Perplexity beat Google.

### 4️⃣ Embeddable live badge — borrowed from GitHub stars / Product Hunt

Builder pastes an iframe on their landing page. Rank updates live. **The builder
turns their own traffic into our traffic.**

**Why a moat:** Zero-CAC viral growth. Every embed = our logo on their site.
Product Hunt was built on this.

### 5️⃣ Judge the Judge — borrowed from peer review

Public dashboard of LLM-judge vs human-annotator agreement rates, bias tests,
failure samples. When someone says "your scoring is unfair," we point at the page.

**Why a moat:** Trust is the deepest defensibility. 18 months of trust takes 18
months for a competitor to build — they can't shortcut it.

---

## Release order (V0 → V2)

**V0 — 6 weeks. Goal: one viral moment.**
- A1 home, A2 (single track: résumé tailoring), A3 tool detail, A6 Trap Street wall,
  A7 Playground
- B1 submission portal
- Self-pre-load 8 benchmark products before launch (Rezi, Huntr, Kickresume, Teal,
  ChatGPT, Claude, Gemini, one viral CN tool)
- **Goal:** small-red-book / X virality. 100K impressions day 1.

**V1 — 8 more weeks. Goal: retain builders.**
- A4 Arena, A9 Weekly Drift Report, B2 dashboard, B4 embed badge, C1 Judge the Judge
- Open 2 more tracks: SEC extraction, cold-email fact-check
- **Goal:** 100 builders submit voluntarily. 50 embed the badge.

**V2 — 3 more months. Goal: become infrastructure.**
- B3 CI hook, C4 public API, A10 prediction market, D2 moderation
- All Tier-1 tracks open
- **Goal:** Weekly Diff hits 10K subs. Public API has third-party consumers.
  Media cites Trap Street data by default.
