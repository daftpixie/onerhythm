# OneRhythm — Session log

Each working session adds an entry here: what changed, the key decisions,
and the next step.

## 2026-11-04 — First public release (v0.1.0)

OneRhythm's first public release, under the Apache License 2.0
([ADR 0024](adr/0024-apache-2-and-fresh-history-release.md)). Built by
`scripts/release/export.sh` from commit `1c91ca3` of the private
repository. Earlier working history is kept privately by VT Infinite, Inc.

- **What this is:** an open-source peer-support platform for people living
  with cardiac arrhythmia and the people who care for them, released as a
  prototype for others to read, check and build on.
- **Not launched:** the public web build is the landing page only
  ([ADR 0023](adr/0023-railway-landing-only-web-host.md)). The member
  platform stays gated until its launch gates are met
  ([ADR 0021](adr/0021-appeals-and-launch-gates.md)).
- **Where decisions live:** [`docs/adr/`](adr/), and the plan for each
  phase in `.claude/plans/`.
- **Left out of this release,** with reasons: `scripts/release/EXCLUDE`.

**Next:** work continues in this repository, by pull request.

## 2026-11-07 — Links to the founder's papers

The founder asked for his two papers to be linked from the landing page.

- **What changed:** "Who built it" now ends with one plain paragraph and two
  links to the papers on Zenodo. The founder's own two paragraphs above it
  are unchanged. Plan: `.claude/plans/landing-founder-papers.md`.
- **Key decisions:** the case report is linked by a plain description, not
  by its title. The title names his diagnosis and procedure, and
  [ADR 0016](adr/0016-landing-copy-and-transparency-removal.md) §3 keeps
  those off the landing page. Using the title would mean changing ADR 0016,
  and that is the founder's call. The paragraph says the papers talk about
  suicide, so 988 is in the same paragraph.
- **After the accessibility review** (pass, with notes): the case report's
  link says "by Matthew J Adams" rather than "he", so it makes sense on its
  own in a screen reader's list of links. The paragraph also points to the
  help button, as the crisis paragraph above it does.
- **Tests:** `tests/web/landing-founder-papers.test.tsx`, 8 tests. They
  failed first (5 of 7 failed before the change; after the review, 3 of 8
  failed before the copy changed), then all passed. The rn and web suites
  pass in both site modes. The db suite needs a local Supabase
  stack and was not run in this session; CI runs it.

**Next:** the founder reviews the pull request. Making the repository public
is step 10 of `docs/RELEASE_FRESH_HISTORY.md`, and only he takes it.

## 2026-11-16 — Public-source readiness review and compatible dependency repair

Reviewed baseline `0caa32b`, the release tag and both other branch tips.
Gitleaks found no credentials across their three commits. Baseline application
tests: 672/672. npm audit identified 43 affected packages, including one
critical and 16 high ratings.

The proposed repair refreshes the lockfile within declared version ranges,
adds the test-renderer types explicitly, and transforms standard-navigation's
ESM build in Jest without changing assertions. All 672 application tests pass;
landing mode has 670 passing and two intentionally excluded form tests. The
landing export and native-Caddy smoke checks pass. The font's OFL text is now
included in the served files.

The dependency report is improved, not clean: 23 affected packages remain,
including six high ratings. `docs/PUBLIC_SOURCE_READINESS.md` records those
paths, the evidence/citation and privacy-wording gaps, repository controls,
and which results came from existing CI rather than a new local run.

**Decision:** keep source publication and member launch separate. Hold the
visibility change while release findings remain; do not force incompatible
dependency upgrades to hide the audit. The founder-papers PR remains separate.

**Next:** review the repair PR, resolve the remaining dependency paths and
public wording, obtain the required contributor sign-off, and verify the
repository controls at publication. Member launch still requires its own gates.

## 2026-11-16 — Complete the public-source candidate (ADR 0025)

Upgraded Expo incrementally through SDK 57 and 58; all 672 application tests
pass at both steps. Aligned React 19.3 / RN 0.88.1, ref types, asynchronous
router test helpers and explicit renderer/asset compatibility dependencies.
Expo doctor passes 20/20. Prepared version 0.1.1; preserved the old release tag.

Corrected the public figures to the existing cited reviews and removed
unsupported comparisons. Replaced absolute processor/privacy claims with the
planned processing path and unopened-list conditions. Privacy and accessibility
source reviews PASS; no manual screen-reader or legal approval is inferred.

Fresh install, lint, types, 672 application tests, 670 landing-mode tests and
production export pass. Ten Caddy status/header checks pass. Audit now reports
zero critical/high, 22 moderate and one low affected packages. Remaining paths
are recorded. Updated GitHub CI must prove the database and Docker image again.

**Next:** finish exact-commit CI, contributor DCO and manual accessibility
gates; then #3, close superseded #1, #2 if included. Configure repository
controls/visibility and publish the reviewed 0.1.1 prerelease. The shared
browser cannot reach the local preview; no keyboard/reader pass is claimed.
Member launch remains gated.

## 2026-11-16 — Founder-paper branch prepared against SDK 58

Applied the research-link change to the exact PR #3 candidate, retaining the
7 November and both 16 November entries in chronological order. Clarified
working-paper status without claiming no researcher has read the work.
The two updated copy assertions failed before the wording changed. The
founder's original paragraphs, both Zenodo record URLs and the safety
affordances are unchanged. Recheck CI, DCO and manual accessibility before
merging after #3.

## 2026-11-16 — Founder acceptance and source-release merges

Matthew confirmed accessibility working and explicitly directed source
publication. This is recorded as founder verification; browser/reader versions
were not supplied and no independent Codex manual pass is claimed.

DCO was confirmed and applied. Both signed candidates passed DCO and all three
CI jobs. #3 merged as `324909d`; #1 closed as superseded. #2 was rebased onto
that main, passed all checks again in run 43979866170, and merged as
`7641bd2`. Its merged tree matches the tested combined candidate. The old
v0.1.0 tag remains unchanged. This follow-up changes release documentation only.

The repository was last verified private. Active main rules are saved but
GitHub warns they are unenforced on the private plan. Visibility,
public-control verification and the v0.1.1 prerelease remain pending because
the connection exposes no administration/release writes and the browser
computer is unavailable. Prepared notes and exact steps are in
`docs/releases/0.1.1.md`; the dated readiness file now reflects completed work.

The member service remains closed. Source publication does not clear its
legal, privacy, staffing, hosted-data or operational launch gates.
