# Manifesto

> *In the 18th century, navigation was a real problem.*
> *Everyone had theories. No one had truth.*
> *Until Harrison built H4, a clock that didn't drift.*
> *That changed everything.*
>
> ***We're building the H4 for AI workflows.***

— Original handwritten note: [`../assets/reference/h4-manifesto-handwritten.jpeg`](../assets/reference/h4-manifesto-handwritten.jpeg)

---

## Two stories. Same idea.

### Story 1 — The clock that didn't drift (1750s)

Through most of the 1700s, ships couldn't reliably tell where they were at sea.
Latitude was easy — the sun told you. Longitude was the killer: it required knowing
the time at a fixed reference point, but no clock survived the rolling, the
temperature swings, or the salt air. Ships ran aground. Empires lost fleets. The
British Parliament put up a prize bigger than most lifetime fortunes for anyone
who could solve it.

John Harrison, a self-taught carpenter, spent forty years building four clocks.
**H4** was the one that worked — accurate to within seconds across an Atlantic
crossing. Suddenly captains had **truth** instead of theories. Navigation stopped
being a debate.

### Story 2 — The street that wasn't there (1930s onward)

Mapmakers had a different but related problem: copycats. Print a map; a year
later your competitor sells the same map. How do you prove it?

Their answer was the **trap street**: a tiny, plausible-looking street drawn into
the map that doesn't actually exist on the ground. If a competitor's map shows
your trap street, the copy is exposed. The fake feature is the proof.

The most famous example is **Agloe, New York** — a paper town invented in 1930
by the General Drafting Company. Decades later a general store opened on the
exact spot and named itself after the fake town on the map. The fiction had
become real.

---

## Why both stories matter for AI

Today's AI workflow market has both problems at once:

- **Drift** — vendors quote benchmarks that don't survive a real task. Demos
  glitter; production silently fails. *We need an H4.*
- **Fabrication** — AI tools confidently invent work history, cite papers that
  don't exist, hallucinate API endpoints, and copy each other's outputs.
  *We need trap streets.*

Trap Street is the H4 for AI workflows, with cartographer's traps built in. We
plant verifiable truths inside real tasks. Workflows that finish the job pass
through cleanly. Workflows that fabricate or copy trip the trap.

The leaderboard isn't where opinions go to argue. It's where workflows go to
prove they exist.

---

## What we do, in four lines

> *We don't fine-tune models.*
> *We test claims.*
> *We run real tasks.*
> *We expose what works, what fails, and what lies.*

---

## Four verbs (from the original sketch)

1. **Define real tasks** — not synthetic, not gameable, not a multiple-choice quiz
2. **Explore tasks** — anyone can see what the world is being measured on
3. **Submit a task** — anyone can plug in a workflow and run it
4. **Run an eval** — automated, reproducible, transparent, audited

That's the entire product, in four verbs. Everything else is implementation
detail.

---

## What we will not do

- We will not run a vibes leaderboard.
- We will not let vendors self-grade without audit.
- We will not lock the eval logic behind a paywall — the harness is open source,
  the public task pool is open data, the audit methodology is public.
- We will not pretend a held-out test set stays held-out forever; we rotate.
- We will not score what we cannot reproduce.

The whole point is that someone, somewhere, can clone our repo and verify any
score on the leaderboard. That is the H4 standard. That is the trap street test.
