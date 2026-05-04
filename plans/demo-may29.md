# Demo Plan — Claude Code London, May 29 2026

> **Phase 1 mission:** Ruqi walks on stage at the Claude Code London Event
> on May 29 and ships the strongest demo of Trap Street the world has yet
> seen. Everything else in the project is subordinate to this date.

**Speaker prep call:** Thu 30 Apr 2026, 3–3:30pm BST · with `wkasekende@googlemail.com`
**Show date:** Fri 29 May 2026
**Days available:** 31

This plan supersedes [`v0-mvp.md`](v0-mvp.md), which is preserved for
reference but no longer active.

---

## Why we changed the plan

The 6-week V0 plan optimized for *one viral moment* via a public launch.
That bet still holds — but the **best possible viral moment** for this
project is no longer a Twitter thread; it's **Ruqi on a stage in front of
the Claude Code community in London**. That audience converts at 100x the
rate of cold web traffic and gives us the credibility halo of being
embraced by Anthropic's user community.

So the new plan: **build the demo, then build the product around the
demo.** Everything we ship before May 29 has to serve the on-stage moment.
Everything we ship after May 29 can be the actual community edition.

---

## The demo, in one paragraph

Ruqi opens with a number: *"I asked 8 of the most popular resume AI tools
to tailor the same résumé to the same job. Four of them fabricated work
history that was never in the original. Let me show you which ones."* She
clicks to the live `trapstreet.run` site. Audience sees a leaderboard with
familiar tool names ranked, with Bronze / Silver / Gold tier badges. She
clicks into the Trap Street Wall and shows three specific fabrications —
each with the original résumé, the AI's output, and a red CAUGHT stamp.
She closes: *"This is the H4 for AI workflows. trapstreet.run is live
today, the landing source is at github.com/AntiNoise-ai/trapstreet-landing,
and the full community harness drops the day of this talk."*

**Total runtime:** 5–8 minutes. **One headline number** the audience will
quote afterward.

---

## The five demo screens

Everything we build is in service of these five screens. If a feature
doesn't appear in this list, it's out of scope until June.

### Screen 1: Home / Hero (`trapstreet.run`)

- Brand wordmark, manifesto headline ("H4 for AI workflows")
- One-line product positioning: *"We don't fine-tune models. We test
  claims. We run real tasks. We expose what works, what fails, and what
  lies."*
- Hero CTA: **View the leaderboard**
- Below the fold: live counter — "**4 fabrications caught this week**"
- Visible to the audience for ~10 seconds

### Screen 2: Resume Tailoring Leaderboard

- 8–10 ranked tools, all real names the audience recognizes
  (Rezi, Huntr, Kickresume, Teal, ChatGPT, Claude, Gemini, one CN tool,
  one indie open-source script)
- Columns: rank, name, tier badge (🥉🥈🥇), score, **fabrication count**
  (red), $/task, latency
- Pareto frontier mini-chart top right (accuracy vs $/task)
- Visible for ~30 seconds

### Screen 3: Tool Detail (one of the failed paid tools)

- Picked tool: a paid SaaS that fabricated. The "$29/month tool that
  ranked #14" reveal.
- Tier badge: 🥇 Gold (we audited it ourselves — the audience must trust
  the verdict)
- Score breakdown by grader (Keyword Match / Hallucination / Format / Cost)
- One specific failed task with side-by-side comparison
- Visible for ~45 seconds

### Screen 4: Trap Street Wall (the money shot)

- Brick wall background, three CAUGHT stamps
- Each entry: tool name, what it claimed vs the truth, evidence
- Headline: **"CHEATERS GET CAUGHT."**
- Three real fabrication examples, hand-curated for shareability:
  1. *Tool A claimed "Quanta Robotics" experience — résumé never mentioned it*
  2. *Tool B padded a 1-year role to "3 years" — résumé clearly stated dates*
  3. *Tool C added a fake degree from "Stanford Online" — never on the original*
- Visible for ~60 seconds. **This is the screen the audience photographs.**

### Screen 5: Submission portal (CTA)

- Brief glimpse, just enough to communicate "you can submit your own tool"
- Three submission tiers (Bronze CLI / Silver request / Gold contact)
- GitHub repo prominent
- Discord QR code on screen for live audience signups
- Visible for ~30 seconds, then handoff

---

## What has to be REAL vs what can be staged

The audience cannot leave thinking "they faked it." But not everything
needs to be live and dynamic.

| Element | Real or Staged? |
|---|---|
| 8 tools' actual scores against 200 résumé tasks | **REAL** — must be reproducible if challenged |
| The leaderboard ranking | **REAL** — pulled from the actual eval |
| Three fabrication examples on the Wall | **REAL** — we keep the original receipts |
| Tier badges (Bronze/Silver/Gold) | **REAL** — we ran every benchmark tool ourselves at Gold |
| Live Mode (today's fresh tasks) | **STAGED** — show it as "coming soon" in the UI, don't claim it ships |
| Submission flow | **STAGED** — Ruqi doesn't click through it on stage, just shows the page |
| `@trapstreet/cli` | **STAGED** — slide-only, doesn't need to be on NPM by May 29 |
| Embed badges on builders' sites | **STAGED** — show as design comp |
| Bronze self-report path | **STAGED** — exists as a page, no actual external submissions |
| Discord, GitHub, blog | **REAL** — need to be live and look populated |

The rule: **if Ruqi clicks it on stage, it's real. If she points at it, it
can be staged.**

---

## Build scope (cut to the bone)

### Web (Next.js, single deployment)

- `/` — Home / Hero
- `/leaderboard/resume-tailoring` — the ranked table
- `/tool/[slug]` — one or two tool detail pages (only those Ruqi clicks)
- `/wall` — Trap Street Wall with 3 prepared cases
- `/submit` — static page describing the three tiers
- `/about`, `/manifesto`, `/blog/launching` — supporting pages

**Scope cuts vs original V0:**
- ❌ No Playground (drag-drop résumé tailoring) — too much to land in 4 weeks
- ❌ No Builder dashboard — Ruqi doesn't show this
- ❌ No CI hooks, no embed badge runtime, no API — all "coming soon" pages
- ❌ No live submission accepting external endpoints

### Backend / data

- Static JSON / SQLite snapshot of the eval results — **not** a live database
- One-time batch eval to produce the demo data
- Trap Street Wall content is hand-curated markdown
- Re-eval is a script the team runs manually, not a service

**Why this is OK:** The demo doesn't need real-time updates. The
audience won't know whether the data refreshed at 8am or last week. What
they care about is whether the data is *real*. Static + reproducible
beats real-time + brittle.

### Eval pipeline (the actual research effort)

This is the part that has to be real. ~$1,500 in compute to produce
defensible data:

- 200 résumé/JD pairs, hand-curated by Ruqi + 1 contractor
- 20 of them are trap-street probes (planted falsehoods)
- 8–10 tools run against the full set
- Pydantic Evals + LLM judge does the scoring
- 100% of "fabrication" claims human-verified before publication
- Results frozen as `data/eval-2026-05.json` — committed to repo for
  reproducibility

---

## 4-week sprint

| Week | Theme | Deliverable |
|---|---|---|
| **W-31 → W-25 (Apr 28 – May 4)** | Story + foundation | Demo arc locked. Speaker prep delivered. Web scaffold with locked design. Eval pipeline runnable end-to-end against 1 tool. |
| **W-24 → W-18 (May 5 – May 11)** | Data | All 200 tasks labeled. All 8 tools evaluated. First fabrications caught. Trap Street Wall has 3 candidate cases. |
| **W-17 → W-11 (May 12 – May 18)** | Polish | All 5 demo screens pixel-perfect. Brand surfaces match brand-sheet-v1. Mobile-responsive. Internal demo dress rehearsal. |
| **W-10 → W-3 (May 19 – May 26)** | Rehearsal | Ruqi runs the demo cold 5+ times. Backup laptop. Backup recording. Press kit ready. Discord + GitHub primed. |
| **W-2 → W-0 (May 27 – May 29)** | Stage | Final dry run. Travel. **SHOW.** |

---

## Roles

| Role | Headcount | Owns |
|---|---|---|
| Ruqi (CEO, presenter) | 1 | Narrative, on-stage delivery, eval task curation |
| CTO (you) | 1 | Demo architecture, integration, live-event tech support |
| Frontend eng | 1 | All five demo screens, brand fidelity |
| Backend / eval eng | 1 | Eval pipeline, scoring, data freezing |
| Designer | 0.5 | Trap Street Wall polish, share cards, slide assets |

**Headcount is tight. The default failure mode is "we built a beautiful
website with no real data behind it." Backend / eval engineering is the
single most precious resource — protect it.**

---

## Budget

| Item | Cost |
|---|---|
| 3 engineers × 4 weeks (contractor rates) | ¥120–180K |
| Designer × 4 weeks part-time | ¥20K |
| Eval compute (8 tools × 200 tasks + judges) | ¥10–15K (~$1,500 USD) |
| Tool subscriptions for benchmarking (Rezi, Huntr, etc.) | ¥3K |
| Travel for Ruqi (London) — likely already covered | — |
| Buffer | ¥30K |
| **Total** | **¥185–250K** |

---

## Three "if-this-fails" backstops

The demo can't fail on stage. Backups are mandatory:

1. **Backup network**: Local copy of the entire site running on Ruqi's
   laptop. If London venue Wi-Fi dies, she serves it from `localhost`.
2. **Backup video**: Pre-recorded 5-minute demo as MP4. If the live demo
   bricks, she narrates the video instead.
3. **Backup laptop**: Second machine, full setup mirrored. If primary
   laptop fails, swap and continue.

All three rehearsed by May 25. No exceptions.

---

## Day-of KPIs (May 29)

| Metric | Target |
|---|---|
| Audience members who scan the Discord QR | 50+ |
| GitHub stars in 24h post-event | 500+ |
| Twitter / X mentions of `@trapstreet_run` | 30+ |
| Anthropic team members in audience who DM Ruqi | 3+ |
| Press / blog post coverage in week after | 1+ |

---

## Post-May-29

If the demo lands, the project pivots back to community-edition shipping
per [`v0-mvp.md`](v0-mvp.md), now with:

- A real audience funnel from the talk
- Press credibility from the venue
- Anthropic team awareness (potentially partnership doors)
- Content (recording, slides, screenshots) for evergreen marketing

If the demo doesn't land, the eval data and code we built still has value
— pivot to publishing the data as a research blog post and rebuild
momentum from there.

Either way: **the data is the asset, not the talk**.
