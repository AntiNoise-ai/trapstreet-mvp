# Speaker Prep — 30 April 2026

> **Goal of this document:** equip Ruqi to walk into the 30 Apr speaker
> prep call (3–3:30pm BST, with `wkasekende@googlemail.com`) with a
> coherent narrative, professional artifacts, and a confidence-inspiring
> answer to every reasonable question.

The prep call is **not** the demo — it's the moment the event organizers
decide what kind of speaker Ruqi is. The artifacts here exist to answer
their questions and reduce their risk of putting her on stage.

---

## What Ruqi must walk in with

A 30-minute call typically covers:
1. *Who are you and what's the talk about?* (5 min)
2. *Walk us through your slides at a high level.* (10 min)
3. *Logistics — A/V, timing, recording, Q&A.* (10 min)
4. *What can the event team help you with?* (5 min)

Ruqi needs answers prepared for each of those four blocks.

---

## Block 1: 30-second pitch (memorize verbatim)

> *"I'm Ruqi, CEO of AntiNoise. We're building Trap Street — the H4 for
> AI workflows. Most AI tool benchmarks today are vibes. Our platform
> plants verifiable truths inside real tasks and exposes which tools
> finish the job and which ones fabricate. The talk is a live demo where
> I show three popular paid AI tools that invented work history on a
> résumé, and one open-source script that beat all of them."*

That paragraph hits: who, product positioning, the differentiator
(traps), the demo's punchline (specific shocking number), and the
underdog story (open-source beats paid).

---

## Block 2: The talk arc (one slide, one minute per beat)

| # | Beat | Time | What's on screen |
|---|---|---|---|
| 1 | The number | 30s | "**4 of 8 paid AI tools fabricated work history.**" Static slide. |
| 2 | Why this matters | 60s | The H4 / Harrison story slide — the etymology |
| 3 | What we built | 60s | Trap Street brand surface — manifesto + the four verbs |
| 4 | Live: leaderboard | 60s | Live `trapstreet.run` — Resume Tailoring leaderboard |
| 5 | Live: tool detail | 45s | Click into a Gold-tier paid tool that fabricated |
| 6 | Live: Trap Street Wall | 90s | The CAUGHT screen with three real fabrications |
| 7 | How it works | 60s | One slide: three trust tiers, evidence-framed |
| 8 | Open source pitch | 45s | GitHub link, Discord QR, "submit your tool" |
| 9 | Closing | 30s | One line: *"Truth, not theories. That's what H4 was. That's what we are."* |

**Total runtime:** ~7 minutes. Most conferences allow 8–12; this leaves
room for breathing.

---

## Block 3: Logistics answers

Pre-write these so Ruqi doesn't have to think on the call:

| Question | Answer |
|---|---|
| Live demo or pre-recorded? | **Live**, with pre-recorded backup |
| A/V needs | Laptop with Chrome, HDMI/USB-C, presenter remote, no audio |
| Internet dependency? | Yes for live demo. **Backup is local copy**, no network needed |
| Slide format? | PDF + Keynote, ratio 16:9 |
| Recording rights? | Yes, please record and share |
| Q&A | 5 minutes welcome — anticipated questions prepared |
| Sponsorship / branding | Just our logo on title slide, no co-branding |
| Demo timing | 7 min content + 5 min Q&A = 12 min |

---

## Block 4: Anticipated questions + answers

The organizer will spot-check Ruqi for credibility. These are the questions
that matter:

### Q: "How is this different from Hugging Face's Open LLM Leaderboard?"

> *"HF tests models. We test workflows. A workflow is a prompt + tools +
> orchestration glued together — what you actually deploy. Models are a
> commodity layer beneath. Also: HF leaderboards collapsed into vibes
> because of self-reporting. Our three trust tiers — Bronze for
> self-reported, Silver for audited, Gold for our full eval — solve that
> head-on."*

### Q: "How do you score things you can't reproduce — closed APIs?"

> *"Two answers. One: for closed APIs we run them ourselves at Gold tier
> and freeze the trace. Anyone can audit our trace. Two: every score
> includes the model version, the date, and the random seed. If a vendor
> changes their model, the score is invalid until re-run. We rotate
> evals monthly."*

### Q: "What stops people from gaming your benchmark?"

> *"Three layers. Public tasks anyone can train on. Held-out tasks
> rotated monthly. Live Mode tasks pulled fresh today — SEC filings,
> LinkedIn JDs — that no model can have trained on. And we plant trap
> streets — verifiable falsehoods inside the held-out set. Tools that
> fabricate trip the trap and land on our public Wall."*

### Q: "Who pays for this?"

> *"Three revenue streams. Verified Audit ($99–499/year for the Silver
> badge — like SOC 2 for AI tools). Priority Gold eval ($200/run for
> pre-launch validation). White-label private leaderboards for VCs and
> enterprise procurement. The community edition stays free forever."*

### Q: "Why open source?"

> *"Trust. The eval is only credible if it's reproducible. Anyone can
> clone our repo, run the harness against their own data, and verify our
> scores. That's how we earn the right to have a Wall."*

### Q: "What if a vendor sues?"

> *"We only publish factual, reproducible findings. Every fabrication
> claim is human-double-verified before it goes on the Wall. If a vendor
> contests, we offer a re-run with their team observing. So far the
> conversations have been the opposite — vendors want to be on our
> leaderboard."*

### Q: "Are you AI? Are you using Claude?"

> *"Yes. The LLM-as-judge step uses Claude and GPT-4o for cross-checking.
> All judge prompts are open source. We disclose every model used, every
> version, every cost in the public traces."*

### Q: "When can people use this?"

> *"You can use trapstreet.run today — the leaderboard prototype is
> already live, and the source for the site is open at
> github.com/AntiNoise-ai/trapstreet-landing. The full community
> edition — OSS harness, the public task pool, real submission API —
> launches with this talk on May 29 from the same org."*

---

## What Ruqi sends BEFORE the prep call (ideal: by Wed evening 29 Apr)

A short email to the organizer with three attachments:

1. **One-paragraph speaker bio** (already in her LinkedIn — copy-paste)
2. **Talk title and abstract** (200 words)
3. **Brand sheet PDF** ([`assets/brand/brand-sheet-v1.png`](../assets/brand/brand-sheet-v1.png))

### Suggested talk title

> **"H4 for AI Workflows: Building the Truth Layer for the Age of Agents"**

### Suggested abstract (200 words)

> Most AI benchmarks are vibes. Models score 90% on a leaderboard, then
> fail silently in production. Workflows — the prompt-tool-agent
> assemblies we actually deploy — have it worse: they fabricate work
> history on résumés, hallucinate API calls, cite papers that don't
> exist, and confidently do the wrong thing.
>
> In this talk I'll demo Trap Street, an open-source community
> evaluation harness for AI workflows. We borrow two ideas from history:
> Harrison's H4 chronometer (1761), which finally gave sailors *truth*
> instead of *theories* about their longitude; and trap streets,
> fictional roads cartographers planted in real maps to catch copycats.
>
> Live on stage I'll show real evals against eight popular résumé AI
> tools. Four of them fabricated work history that wasn't in the
> original. One open-source script ranked first. We'll walk through how
> we caught them, why our three-tier trust model (Bronze / Silver /
> Gold) makes the scores defensible, and how anyone in the audience can
> submit their workflow to the leaderboard from a single CLI command
> the same day this talk ends.
>
> Built on Pydantic Evals and Langfuse. Open source. Apache-2.0.
> github.com/AntiNoise-ai/trapstreet

---

## Pre-call checklist (Ruqi self-check, morning of 30 Apr)

- [ ] Memorize the 30-second pitch (Block 1)
- [ ] Read all four logistics answers out loud once
- [ ] Read all eight anticipated Q&A out loud once
- [ ] Have GitHub repo open in a browser tab
- [ ] Have brand sheet PNG open in a browser tab
- [ ] Have manifesto.md open in a browser tab
- [ ] Test mic + camera 30 min before
- [ ] Time zone confirmed: 3pm BST = 10pm CN time

---

## Failure modes to avoid

1. **Don't oversell.** If they ask "is the demo live working today?" the
   answer is *"the leaderboard with 2 tools is live today; full demo
   ready May 15 for our internal dry run."* Specific, honest, not hand-wavy.
2. **Don't mention internal numbers.** The talk is for the community, not
   the boardroom. Don't reveal target ARR, runway, or hiring plans.
3. **Don't compare publicly to a specific vendor.** "Tool X fabricated"
   is fine — you have the receipts. "Tool X is bad" without context is
   a lawsuit risk.
4. **Don't promise features that aren't on the May 29 demo.** Live Mode,
   embed badges, prediction markets — all V1+. Mention as roadmap, never
   as available.

---

## What we give Ruqi by 29 Apr evening

A package she can mention on the call:

- ✅ Public GitHub repo (screenshareable on the call):
   **`github.com/AntiNoise-ai/trapstreet-landing`** — Apache-2.0,
   Next.js source for the live site
- ✅ Live homepage at **`https://trapstreet.run`** — full prototype
   with leaderboard, how-it-works, Trap Street Wall, manta-ray mascot,
   HTTPS-enforced. No more 404 risk on the call.
- ✅ Internal product/working repo (`AntiNoise-ai/trapstreet`) stays
   private through May 29. The "OSS launch" is a beat tied to the
   talk, not a state we already advertise.
- ✅ Manifesto: `docs/manifesto.md`
- ✅ Brand sheet: `assets/brand/brand-sheet-v1.png`
- ⏳ Demo concept doc: this file + `demo-may29.md`

---

## After the call

Within 2 hours:
- Write down every question they asked verbatim
- Add new ones to this document's Q&A section
- Note any commitments made (recording terms, time slot, A/V specifics)
- Send a thank-you email with answers to anything unresolved
