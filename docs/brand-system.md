# Brand System v1.0 — LOCKED

This is the canonical brand specification. Any visual deviation from this
document must be explicitly approved by the CTO. Brand sheet image lives at
[`../assets/brand/brand-sheet-v1.png`](../assets/brand/brand-sheet-v1.png).

---

## 0. Naming, in one paragraph

The brand is **Trap Street**. The domain is **trapstreet.run**. The product
positioning is **"the H4 for AI workflows"** — where **H4 = Harrison's
Chronometer No. 4** (1761), the navigation clock that solved the longitude
problem and gave sailors *truth* instead of theories. **Never** backronym
H4 into Hierarchical/Hybrid/etc. The H4 etymology is a typography sample
on the brand sheet; it is non-negotiable.

---

## 1. Logo

| Variant | Use |
|---|---|
| **Primary** — pixel manta + `trapstreet.run` wordmark, blue glyph on dark | Web header, marketing |
| **Icon Only** — pixel manta in a rounded square | Favicons, social avatars, app icons |
| **Monochrome** — solid black manta | Single-color print, light backgrounds |
| **Reverse** — outlined manta on white | Stickers, swag, embroidery, dark-on-light contexts |

The wordmark splits color: `trapstreet` in neutral text color, `.run` in
brand blue. This is the only acceptable wordmark color split.

The mascot is the **friendly pixel manta ray**. The sad-manta-in-glass is
reserved for **error states only** (see [`../assets/error-states/README.md`](../assets/error-states/README.md)).

---

## 2. Color palette

### Neutrals (UI scaffolding)

| Token | Hex | Use |
|---|---|---|
| `bg-0` | `#0D1117` | Page background (dark) |
| `bg-1` | `#161B22` | Surface 1 (cards) |
| `bg-2` | `#21262D` | Surface 2 (raised) |
| `bg-3` | `#30363D` | Borders, dividers |
| `text-3` | `#8B949E` | Tertiary text |
| `text-2` | `#C9D1D9` | Secondary text |
| `text-1` | `#F0F6FC` | Primary text |

### Brand blues (action, links, highlights)

| Token | Hex | Use |
|---|---|---|
| `brand-700` | `#1F6FEB` | Primary buttons, primary links |
| `brand-500` | `#58A6FF` | Hover states, accent text |
| `brand-300` | `#79C0FF` | Subtle highlights, chip backgrounds |
| `brand-100` | `#A5D6FF` | Active state surfaces |

### Semantic

| Token | Hex | Use |
|---|---|---|
| `success` | `#3FB950` | Pass status, score going up |
| `error` | `#F85149` | Fail status, **CAUGHT stamp**, banned tier |
| `warning` | `#D29922` | Partial / Unstable status |
| `info` | `#A371F7` | Informational chips, neutral notices |
| `brand` | `#58A6FF` | Branded callouts |

---

## 3. Typography

| Role | Font | Size / Line height |
|---|---|---|
| Display (H4 callout) | Inter Bold | 96 / 96 |
| H1 | Inter Bold | 32 / 40 |
| H2 | Inter Bold | 24 / 32 |
| H3 | Inter SemiBold | 18 / 28 |
| Body | Inter Regular | 14 / 22 |
| Caption | Inter Regular | 12 / 16 |
| Code | JetBrains Mono | 13 / 20 |

### Required typography sample on every brand-system reference

```
H4

Harrison's Chronometer No. 4

Our evaluation harness measures what matters:
accuracy, cost, stability, and truthfulness.
```

This sample anchors the brand to its origin story. When in doubt, this block
goes on the page.

---

## 4. Iconography

Style: **1.5px stroke**, square-cornered geometric, light-on-dark.

### Action set
`Run · Tasks · Leaderboard · Wall · Traps · Audit · Settings · More`

### Status set
`Pass · Fail · Partial · Running · Queued · Unstable · Banned · Info`

### Utility set
`Search · Filter · Sort · Download · Share · Link · Copy · Calendar`

**Never substitute generic icon libraries** (Heroicons, Lucide) for the action
or status sets — those carry product semantics ("Wall," "Traps," "Banned")
that Trap Street defines and competitors don't. Utility set may use Lucide
as fallback if a custom icon doesn't exist yet.

---

## 5. Trust Tiers — the most important brand asset

Three hexagonal badges with a manta inside and a metallic ribbon below.
Each tier represents **what kind of evidence backs the score**, not what
"quality" the tool is.

| Tier | Badge | Evidence | Tasks evaluated on | Cost to us |
|---|---|---|---|---|
| 🥉 **Bronze** | Bronze hex + manta + 1-star bronze ribbon | **Self-reported** via OSS CLI | Public only | $0 |
| 🥈 **Silver** | Silver hex + manta + 1-star silver ribbon | **Audited** — we re-run 10–20% sample | Public + sampled held-out | ~$2/run |
| 🥇 **Gold** | Gold hex + manta + 2-star gold ribbon | **We ran the full eval** | Public + held-out + Live Mode | ~$20/run |

### CRITICAL: tier copy must describe EVIDENCE, not capability

| ❌ Wrong (capability-framed) | ✅ Right (evidence-framed) |
|---|---|
| "Works on basic tasks" | "Self-reported by builder" |
| "Reliable on real tasks" | "Audited — 10–20% re-run on our infra" |
| "Production proven" | "Full evaluation on our infra + Live Mode" |

The user's question is *"how do I know this score is real?"*, not *"how good
is the tool?"* The tier badges answer the first question. The score itself
answers the second.

→ See [`trust-tiers.md`](trust-tiers.md) for the full strategic rationale.

### Driftless escalation (V1+)

A fourth badge — **Driftless** — exists for tools that maintain Gold-tier
scores across N consecutive monthly evals. Visual: Gold hex with a small
laurel wreath overlay. Reserved as an aspirational target. Not in V0.

---

## 6. UI elements

### Button hierarchy

| Variant | Use |
|---|---|
| Primary (filled brand blue) | The single most important action on the page |
| Secondary (outlined) | Co-equal alternatives |
| Ghost (no border) | Nav and toolbar actions |
| Danger (red) | Destructive (delete submission, ban) |

### Tab system

The canonical primary navigation is:
`Overview · Leaderboard · Wall · Tasks · Traps · Settings`

`Wall` is the Trap Street Wall. `Traps` is the trap-task management view.
These two tabs are non-negotiable; they are why the brand has the name it has.

### Chips / tags

Default chip vocabulary: `open source · h4 · community · ai-native · reproducible · fair`

These are the SEO/positioning words. Use them, don't invent new ones.

---

## 7. Status indicators

```
Pass     ✓ green
Fail     ✗ red
Partial  ! yellow
Running  ↻ blue (animated)
Queued   ○ neutral
Unstable ⚠ yellow
Banned   ⊘ red — for tools removed for cheating
Info     ⓘ neutral
```

Banned is a real status. When a tool is caught fabricating in a trap, it
goes to Banned + lands on the Trap Street Wall.

---

## 8. Trap Street Wall — visual treatment

The Wall has a dedicated visual style:

- **Brick wall background pattern** (low contrast, dark)
- **Manta + red rubber stamp** "CAUGHT" overlay
- **Headline copy:** *"Cheaters get caught."*
- **Pattern reuse:** brick wall is also used for empty states inside admin
  ("nothing on the wall this week")

This is the most viral asset on the site. Treat it as a hero surface, not a
dashboard widget.

---

## 9. Code blocks

Use JetBrains Mono with our syntax highlighting palette. Result objects
follow this canonical schema:

```json
{
  "workflow": "QA RAG Pipeline",
  "dataset": "HotpotQA",
  "score": 0.892,
  "pass_rate": 0.861,
  "status": "pass"
}
```

Showing this schema reinforces "we measure what matters" — accuracy, pass
rate, status. Don't add fields that aren't actually scored.

---

## 10. Spacing & layout

8pt grid. Acceptable spacing tokens (px):

`8 · 16 · 24 · 32 · 40 · 48 · 56 · 64 · 72 · 80 · 96 · 128 · 192 · 256`

Anything between is forbidden — either round to the next step or split into
two stacked spacing tokens.

---

## 11. Borders & radius

Border weights: `1px · 1.5px · 2px`
Radius scale: `4px · 8px · 12px · 16px · Full`

Buttons: 8px radius.
Cards: 12px radius.
Pills/chips: Full radius.
Avatars/badges: 12px or Full.

---

## 12. Forbidden patterns (don't ship if you see this)

- **H4 backronymed into "Hierarchical / Hybrid / Human-in-the-Loop / High-trust"** — H4 is Harrison's chronometer, full stop
- **"Workflow infrastructure"** as positioning — we are eval / benchmark, not LangGraph
- **"Observability & tracing"** as our product — Langfuse does that, we use it
- **Generic dev-tool dashboard** that doesn't show Bronze/Silver/Gold + Wall + Trending
- **Capability-framed tier copy** ("works on basic tasks") — must be evidence-framed
- **Tier badges without manta inside** — the manta is the constant
- **Sad manta as primary mascot** — sad version is reserved for error states

---

## Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-28 | Locked Trap Street brand + brand sheet v1 | trapstreet.run domain registered; brand sheet captures all canonical specs |
| 2026-04-28 | H4 = Harrison's Chronometer No. 4 (etymology, NOT backronym) | Preserves manifesto integrity |
| 2026-04-28 | Three tiers (Bronze / Silver / Gold), evidence-framed copy | Aligns badges with strategic trust-tiers model |
| 2026-04-28 | Sad manta-in-glass → 404 only | Friendly manta is the primary mascot |
| 2026-04-28 | brand-sheet-v1.png archived to `assets/brand/` | Visual reference now committed alongside spec |
| 2026-04-28 | Adopted Harrison chronometer illustration in H4 Story panel | Reinforces etymology beyond text — designer addition, accepted |
| 2026-04-28 | Added positioning four-liner ("We don't fine-tune models...") to manifesto | Designer copy contribution; promoted to canonical |
| 2026-04-28 | Light theme acceptable as primary brand surface (alongside dark) | brand-sheet-v1 ships on light; dark mode parity required for product |
| 2026-04-28 | brand-sheet-v1.png replaced with corrected revision | CTO-confirmed alignment: tier copy + wordmark drift items resolved |
