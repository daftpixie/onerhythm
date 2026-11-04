# ADR 0016 — Landing copy: pooled statistics, no founder diagnosis, no open-books page

Status: Accepted as the August design record; current entity and public-copy corrections recorded 2026-09-26
Date: 2026-08-09
Relates: ADR 0007 (PBC posture, vocabulary); ADR 0008 (the in-repo ledger —
**superseded in part by this ADR**); ADR 0011 (landing page and updates list);
Brand v3 §9 (voice); `docs/PRODUCTION_READINESS.md` (Tier 1).

Four founder decisions taken on the landing copy during final review before
deployment to onerhythm.org. Nothing about the member platform changes.

---

## 1. The statistics: single-study → pooled

**The page used to say** that among people living with an arrhythmia, clinical
anxiety runs around 88% and depression around 71%.

Those figures came from **one 222-person study**. They are the highest numbers in
the literature by a wide margin, and a reader who went looking would not find
them again. On a page whose entire argument is "we will be straight with you",
citing the most alarming available number is a poor trade even when the number is
real.

**The page now leads with scale, then with pooled psychological burden.**

### What the page says, and where each figure comes from

| On the page | Source |
|---|---|
| More than **50 million** people worldwide live with atrial fibrillation, the most common heart-rhythm problem | GBD 2021: 52.55M AF/atrial-flutter cases. An earlier GBD cycle reported 59.7M; the page uses the conservative "more than 50 million" that both support. |
| about **a third** of arrhythmia-related hospital stays | AF's share of arrhythmia-related hospitalisations. Used to gesture at the wider arrhythmia population without asserting a total we cannot source as tightly. |
| about **one in four** with anxiety that is more than everyday worry | Pooled prevalence of clinically significant anxiety in AF, 25.2%. |
| about **one in five** with depression | Pooled prevalence, 20.1%. |
| about **one in eight** with post-traumatic stress among people with an implanted defibrillator | Meta-analysis, ~40,000 ICD patients: PTSD 12.4%, several times general-population rates. |
| "Studies don't all land on the same numbers, and we won't pretend they do" | Broader reviews span depression 22–40% and anxiety 13–30%. Rather than print a range on a front door, the page acknowledges the disagreement in one sentence. |
| **16 of 78** selected symptomatic AF patients at a tertiary center reported suicidal ideation | The old landing copy generalized this as “one in five people with symptoms.” That generalization was removed in September 2026; the crisis resources remain. |

### Three decisions inside the rewrite

**"100 million people live with an arrhythmia" is NOT on the page.** It is a
softer figure than the AF numbers and we cannot point at it as tightly. This page
carries only what we can point at.

**The ICD meta-analysis contributes PTSD only.** In that same analysis anxiety is
22.6% and depression 15.4% — both *lower* than the AF pooled figures. Any
"and it's worse still if you have a device" framing would therefore have been
false. PTSD is the figure that genuinely runs several times general-population
rates, so it is the only one quoted. This is recorded because the tempting
sentence is the wrong one, and someone will be tempted again.

**The 3.2× five-year mortality finding for elevated PTSD in ICD patients is
deliberately excluded.** It is true, and it is our single strongest line for
investors and grant reviewers. It is not going on the front door. The reader here
may have been diagnosed this week; telling that person, unprompted, that their
distress predicts their death is a different duty of care from the one we owe a
grant panel. **It belongs in the one-pager. It does not belong on this page.**

**The suicide line moved.** It used to sit in the statistics paragraph, three
paragraphs above the crisis resources. It now opens the crisis paragraph, so a
reader meets "what to do about it" in the same breath. The adjacency is a safety
property, not a layout preference, and both the source comment and a test say so.

The framing that follows the numbers is unchanged — these are about a population
and not about you, nobody here will tell you how you feel, the people standing
next to a patient belong here too. That framing was the best thing on the page.
Only the numbers changed.

**One copy pass came out of the a11y review**, which read the first draft of the
second paragraph as running above the ~8th-grade bar in `.claude/rules/a11y.md`:
three long clinical terms inside one compound sentence. The figures did not
change; the sentences were split so each carries one term. Reading level is AAA
under WCAG (SC 3.1.5) and so not a build-blocker, but plain language is this
project's own rule and the audience is the reason for it.

Nothing is cited inline; this is a landing page, not a paper. The sources are
recorded in a comment above the copy in `app/index.tsx` **and** in the table
above, specifically so a future editor does not "improve" pooled figures back
into the single-study ones.

## 2. "getting this wrong would hurt people" → "getting this right matters"

Same sentence, same length, no hype added. The old clause named the harm; on a
page read by anxious people it invited them to imagine it. The claim we actually
want to make is about care taken, not damage avoided.

## 3. The founder's diagnosis and device are off the page

"I have ARVC and an implanted defibrillator" became "I live with an arrhythmia."
The point of *Built by a patient* — he built the thing he could not find — stands
without disclosing one person's condition to every visitor.

`app/index.tsx:162` was the only occurrence in any application or landing source
file. The remaining ARVC/ICD/ablation strings in the repository are test fixture
data (`tests/db/`, `tests/components/`) and unrelated prose in the PRD and older
ADRs; **per the founder, those are untouched — this is a landing-copy change.**

## 4. The `/transparency` page is removed; the ledger is not

**Founder's call:** for a platform that has not opened, publishing a cost table of
well under a dollar a month against zero member support reads as overcooked. Open
books earn their place when real money moves.

### Removed

- `app/transparency.tsx` (the route and screen)
- `src/components/RunwayMeter.tsx` (the runway meter)
- `src/lib/transparency/` (parse + coverage math, and the generated bundle)
- `scripts/gen-ledger.js` and the `gen:ledger` npm script
- the "Open books" section and its link on the landing page
- `tests/screens/transparency-screen.test.tsx` (render SLI),
  `tests/unit/transparency-math.test.ts`, `tests/unit/transparency-parse.test.ts`,
  `tests/unit/transparency-drift.test.ts`, `tests/components/RunwayMeter.test.tsx`

**Deleted, not skipped.** A skipped suite is the hollow-guarantee pattern ADR 0013
exists to prevent: it reports as a test that is not running.

### Kept — the decision on the ledger files (founder, asked explicitly)

`transparency/costs.yml`, `transparency/support/*.yml`, `transparency/README.md`
and **guard #6** (`.claude/hooks/ledger-append-only.sh`) all stay.

They render nothing and claim nothing. The repository is private as of
26 September 2026, so the record is auditable by authorized collaborators but
is not yet public accounting. The page remains removed. The guard still protects real files that are still being
appended to, so it is not a guard over nothing — which was the one incoherent
option, and the reason the question was asked rather than assumed. Restoring the
page in Phase 4 is then a re-add of the rendering layer.

The alternative considered and rejected: a clean sweep, removing the YAML and
retiring guard #6 (guards 7 → 6). Coherent, but it throws away a real record to
remove a page nobody has to look at.

### Consequences

- `docs/adr/0008-transparency-ledger.md` is **superseded in part**, not deleted.
  Its ledger half stands and is in force; its rendering half is history.
- **Restoring the page is a named Phase 4 prerequisite, alongside Stripe** —
  recorded as gap **G12** in `docs/PRODUCTION_READINESS.md`. When it returns it
  returns with a generator and a drift test, or not at all: a hand-maintained
  page that can silently disagree with the ledger is worse than no page.
- The August entity sentence was placed under **"Who runs it"**. It incorrectly
  described the PBC conversion as completed. The September correction says it
  is proposed and unfiled, subject to counsel review before member support.
- `README.md`, `CONTRIBUTING.md` and `transparency/README.md` now say plainly that
  the ledger exists and nothing renders it yet, and why. `transparency/README.md`
  in particular no longer instructs maintainers to run a generator that is gone.

## Tests

The landing suite's `links to the open books at /transparency` assertion is
replaced by its inverse — the link and the vocabulary must be **absent** — so the
page's return without the Phase 4 conditions is a failing test rather than a
quiet regression. Three assertions were added: the retired 88%/71% figures are
pinned absent while the pooled replacements are pinned present (so the test
cannot pass against a page carrying no numbers at all); the suicide sentence and
the crisis resources must be in the same `<Text>`; and the first-person copy must
not name a diagnosis or device. No test previously pinned the old statistics, so
nothing had to be amended to let the rewrite through.

## Verification

Full local gate green — see `docs/SESSION_LOG.md` for the counts, including the
re-measured reading measure and the a11y pass over the revised page.
