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
