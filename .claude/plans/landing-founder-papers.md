# Landing: links to the founder's papers

Founder request, 7 November 2026: put the links to his papers on the OneRhythm
page.

## What changes

- `src/lib/site.ts`: `FOUNDER_PAPERS`, the two Zenodo records the founder gave.
  - <https://zenodo.org/records/23481586>: *The Mind Was Never Outside the
    Cardiac Story* (working paper, 19 October 2026).
  - <https://zenodo.org/records/23512374>: his patient-authored case report,
    version 5.2 (20 October 2026).
- `app/index.tsx`: under "Who built it", after the founder's two paragraphs
  (unchanged), one plain paragraph and the two links.

## Decisions

- **Third person.** The two paragraphs above are the founder's words, pinned
  verbatim. New copy does not speak for him.
- **The case report is linked by a description, not its title.** Its title
  names his diagnosis and procedure. ADR 0016 §3 keeps those off the landing
  page, and `tests/screens/landing-screen.test.tsx` pins it. Naming them would
  amend ADR 0016 §3, which is the founder's call, in its own ADR.
- **988 beside the mention of suicide.** The papers talk about suicide, so the
  paragraph that says so carries 988 in the same `<Text>` (ADR 0016). The
  existing adjacency test covers it.
- **Review status.** "These are working papers, not peer-reviewed articles"
  identifies publication status without claiming nobody else has read or
  reviewed them. Both Zenodo records identify working papers.
- **Links that say where they go.** Each accessible name starts with the
  visible text and names Zenodo (SC 2.5.3). They use the page's existing
  `ExternalLink` and quiet-link style (24px minimum target, SC 2.5.8).
- **After the a11y review (PASS WITH NOTES).** The case report's link says
  "by Matthew J Adams", not "he", so it still makes sense in a screen
  reader's list of links. The paragraph also points to the help button, as
  the crisis paragraph above it does, because 988 only helps in the US. A
  test title that claimed the link "says it leaves the site" now says what
  the test checks.

## Not in this change

- Making this repository public. That is step 10 of
  `docs/RELEASE_FRESH_HISTORY.md`, and only the founder does it.

## Tests

- `tests/web/landing-founder-papers.test.tsx`, 7 tests. Red first: 5 failed and
  2 passed before the implementation. The pre-commit hook runs the full suite
  and `--no-verify` is forbidden, so the red run is recorded here and in the
  pull request, and the tests land with the implementation (phase 1C and 1D
  precedent).
- After the a11y review, 8 tests. The changed paragraph and the new
  link-name test were written first: 3 failed and 5 passed against the page
  as it was, then all 8 passed.
- Vacuity: changing the case-report link text to name the procedure turns the
  ADR 0016 test red.
