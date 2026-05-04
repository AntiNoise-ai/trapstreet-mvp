# V0 MVP Plan — 6 weeks, 2–3 people

> ⚠️ **DEPRECATED 2026-04-28.** This plan is preserved for reference but is
> no longer the active phase-1 plan. The project is now optimizing for
> Ruqi's on-stage demo at the Claude Code London Event (May 29, 2026).
> See [`demo-may29.md`](demo-may29.md) for the active plan and
> [`speaker-prep-apr30.md`](speaker-prep-apr30.md) for the immediate
> 48-hour deliverable for the speaker prep call.
>
> The Resume Tailoring track and the headline target below are still the
> right product bet — the change is the *delivery moment*, which moves
> from "Twitter launch" to "London stage."

**Goal:** ship one viral moment around the **Resume Tailoring** track.
**Headline target:** *"We tested 8 resume AI tools. 4 fabricated work history.
The #1 tool wasn't the $29/month one."*

**Domain:** [trapstreet.run](https://trapstreet.run) (registered)

---

## Scope (what's in V0)

- One track: Resume Tailoring
- 200 tasks (20 public + 160 held-out + 20 trap-street)
- 8 pre-loaded benchmark products at **🥇 Gold** tier (we run them)
- Public **🥉 Bronze** path open via `npx @trapstreet/cli`
- Public pages: Home, Track leaderboard, Tool detail, Trap Street Wall, Playground
- Builder pages: Bronze upload + Silver request portal (no dashboard yet)
- Stack: Pydantic Evals + self-hosted Langfuse + Next.js

## Explicitly out of scope (deferred to V1)

- Live Mode (daily fresh tasks) — V1
- Agent Arena (live head-to-head) — V1
- Embeddable badges — V1
- CI hooks — V2
- Weekly Drift Report — V1
- Judge the Judge dashboard — V1
- Builder dashboard — V1
- More than one track — V1+

---

## Week-by-week

| Week | Stream A: Tasks | Stream B: Backend | Stream C: Frontend |
|---|---|---|---|
| 1 | Hire/brief labeler. Define task schema. Source 50 JDs + 50 résumés. Plant 5 trap-street tasks. | Langfuse self-hosted. Postgres + Redis. Pydantic Evals adapter spike. | Next.js scaffold, brand setup, manta mascot, Trap Street logo lockup. |
| 2 | Label first 100 tasks (jd + resume + ground_truth). | `@trapstreet/cli` Bronze upload v0 + signature verification. Replay path. | Home page (static), Track page skeleton with 3-tier badges. |
| 3 | Label remaining 100. 15 more trap-street tasks. Internal QA pass. | All 5 graders in `trapstreet-core` (Pydantic Evals). Silver audit logic. | Tool detail page. Trap Street Wall. |
| 4 | Held-out split: 20 public / 160 held-out / 20 trap. Ground-truth review with 1 hiring manager + 1 résumé writer. | Gold runner. Self-eval all 8 benchmark products end-to-end. Fix scoring bugs. | Playground (drag résumé → top-3 Gold tools tailor live). |
| 5 | Final task locks. Backup pool of 50 extras. | Bronze→Silver promotion logic. Trap-street trip detection. Cheating-log writer. | Submission portal (Bronze + Silver request). Polish all pages. End-to-end test. |
| 6 | — | Production deployment. Domain → trapstreet.run. SSL. Monitoring. | **Launch.** Pre-load 8 products at Gold. Twitter / 小红书 / HN posts ready. |

---

## Roles

| Role | Headcount | What they own |
|---|---|---|
| CTO (you) | 1 | Architecture, launch comms, viral hook |
| Backend eng | 1 | Stream B (CLI, runner, graders, Langfuse integration, audit) |
| Frontend eng | 1 | Stream C (all pages, brand, Trap Street Wall) |
| Labeler / domain expert | 0.5 (contractor) | Stream A (200 tasks + ground truth + traps) |

---

## Budget estimate

| Item | Cost |
|---|---|
| 2 engineers × 6 weeks (contractor rates) | ¥80–120K |
| Labeler (200 tasks + 20 traps) | ¥15K |
| Gold pre-load eval costs (8 products × 200 tasks × judge) | ¥3K |
| Infrastructure (Vercel, Railway, OpenAI judge) | ¥2K |
| Domain (trapstreet.run paid), brand polish, manta-ray vector redraw | ¥5K |
| Buffer | ¥15K |
| **Total** | **¥120–160K** |

---

## Launch-day checklist

- [ ] 8 benchmark products pre-loaded at 🥇 Gold tier
- [ ] At least 3 trap-street trips captured for Trap Street Wall
- [ ] One headline-quality fabrication example saved as the launch graphic
- [ ] `@trapstreet/cli` published to NPM, smoke-tested by 2 external users
- [ ] `trapstreet-tasks` GitHub repo public + 20 public tasks visible
- [ ] Twitter thread drafted (10 tweets, hooked on the fabrication number)
- [ ] 小红书 post drafted (visual-first, leaderboard screenshot)
- [ ] HN Show HN post drafted (technical angle, links to open repos)
- [ ] Submission portal accepts Bronze uploads
- [ ] Trap Street Wall page populated and shareable
- [ ] Status page live
- [ ] Discord open, 3 maintainers ready to triage

---

## Day-1 KPIs

| Metric | Target | Stretch |
|---|---|---|
| Unique visitors | 30K | 100K |
| Playground submissions | 1K | 5K |
| Bronze submissions (external builders) | 10 | 50 |
| Silver audit requests | 3 | 10 |
| HN front page | top-30 | top-10 |
| Press mention | 1 | 3 |

If we hit base targets, V1 work starts week 7. If we miss, we hold V0
two more weeks and iterate the headline before pushing V1.

---

## Risk register

| Risk | Mitigation |
|---|---|
| Ground truth quality is the headline | 100% of "fabrication" claims double-checked by 2 humans before launch |
| Benchmark products' ToS blocks automated calls | Use official API tiers / public web flows. Document. |
| LLM judge disagrees with humans on edge cases | Publish 10% human-spot-check sample with launch ("Judge the Judge" preview) |
| Trap-street probes too obvious / not obvious enough | Pilot with 2 internal volunteers running tools against traps before locking |
| Bronze CLI signature scheme abused | Sign with rotating key tied to harness version; rotate quarterly |
| One product threatens legal | Stick to factual, reproducible reporting. Offer to re-run on demand. |

---

## What V0 deliberately leaves on the table

The three-tier model is **partially live in V0**:
- 🥇 Gold: 8 pre-loaded benchmark products only. We run them all manually.
- 🥈 Silver: portal accepts requests, audit pipeline exists, but no paid tier yet.
  Audits run free for V0 to seed the badge.
- 🥉 Bronze: fully open via CLI from day one — this is the long-tail funnel.

Live Mode (the un-cheatable daily-fresh tasks) is **not** in V0. Held-out + trap
streets are sufficient for the launch headline. Live Mode is a V1 unlock.
