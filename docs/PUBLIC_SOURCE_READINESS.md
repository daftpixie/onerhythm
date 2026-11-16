# Public-source readiness — 16 November 2026

**Decision: technical fixes prepared; publication gates remain open.** This is
an Apache-2.0 pre-launch prototype for public scrutiny. Publishing source and
opening the member platform are separate decisions. This review establishes
neither clinical effectiveness nor regulatory or production approval.

## Reviewed source

Repository: `daftpixie/onerhythm`. Baseline `main` and `v0.1.0` both point to
`0caa32be29e533247c4ff1623e90ed1744c771c4`. The repository remains private.
All 380 baseline files and the signed root commit were verified against Git
hashes. The private development archive is separate. PR #3 now prepares
version 0.1.1; PR #2 remains separate. ADR 0025 records the completion work.

## Evidence on the version 0.1.1 candidate

| Check | Result and limit |
|---|---|
| Install | Fresh `npm ci --legacy-peer-deps` succeeds. Node 24.22.1 locally; Node 22 in CI. |
| Lint / TypeScript | Pass. New React Native ref types retain the same focus behavior. |
| Application tests | 672 pass across 58 suites. The intermediate SDK 57 migration also passed all 672 before SDK 58. |
| Landing-mode tests | 670 pass, two updates-form tests intentionally excluded by the existing CI filter; separate tests pin the form's absence. |
| Expo configuration | `expo-doctor`: 20/20 pass. Splash uses its supported plugin; Android mask uses an existing square icon. No native device rendering is claimed. |
| Landing export | Pass with landing mode and no Supabase settings. No project/key material or externally hosted script was found. |
| Static serving | Caddy 2.10.2 and the repository configuration: ten status/header checks pass, including SPA fallback, missing JS 404/no-store, immutable hashed JS, font license and no cookies. Only the local document root/port differs. |
| Source review | Read-only accessibility and privacy reviews PASS on the changed source. These are not manual assistive-technology or legal approvals. |
| License | Apache-2.0, contributor terms and trademark boundary present; full bundled font OFL text included in served files. Not an exhaustive dependency license opinion. |

The original compatible repair passed all three jobs in GitHub run
[43925327832](https://github.com/daftpixie/onerhythm/actions/runs/43925327832),
including 346 pgTAP assertions, 53 integration tests, Docker build and container
smoke. **That run predates the SDK 58 completion.** The updated PR must pass
all three jobs again. This workspace has no Docker, so no local database or
container result is claimed. The PR body records the latest exact-commit run.

Gitleaks 8.30.1 found no credentials in the reviewed root/branch histories and
original repair. Repeat the staged-candidate and all-ref scans before
publication; a credential scan is not proof that every personal detail is absent.
All seven source guards passed the baseline and original repair; repeat them
over the final candidate.

## Findings addressed

- **Supported dependencies:** migrate Expo 56 → 57 → 58, with aligned React
  19.3 / React Native 0.88.1. No incompatible security override or SDK downgrade.
- **Audit:** baseline 43 affected packages (1 critical, 16 high, 20 moderate,
  6 low); final SDK 58 lockfile 23 (0 critical, 0 high, 22 moderate, 1 low).
  These are affected package counts, including inherited ratings, not 23
  independent demonstrated exploits.
- **Evidence:** AF/flutter prevalence now has its 2021 date and both conditions;
  AF anxiety is about one in eight, depression about one in five, consistent
  with vision references 35/38/39. Measures and estimates vary. Unsupported
  hospital-share and comparative PTSD claims were removed.
- **Privacy:** planned Supabase/private Google Sheet/email processing is
  disclosed subject to reviewed written terms and publication before opening.
  No legal engagement or completed review is invented. Sensitive inferences
  are acknowledged without declaring a legal classification. The form stays off.

Residual advisories concern `glob` traversal/cancellation, `minimatch` matching
amplification and low-rated `deepmerge` prototype poisoning, inherited through
Jest/coverage tools and Expo fingerprinting. These are build/test dependency
paths in this deployment; Caddy serves static output and does not run Node.
This bounds exposure; it does not make the advisories disappear. Recheck audit
at release and follow upstream compatible fixes. No attack on the live site
was demonstrated.

## Publication gates still open

| Gate | Concrete completion |
|---|---|
| Exact-commit CI | All three PR jobs green after the last code/lockfile change. |
| Contributor declaration | Obtain the contributor's DCO rights attestation and add the matching sign-off; rerun DCO and CI. An automated review cannot supply that personal declaration. |
| Keyboard / screen reader | Check landing, privacy, contact, country-help and crisis-sheet opening/closing/focus; record browser/reader and result. Local Chromium could not start under a socket restriction; the shared browser could not reach the local preview. No manual pass is claimed. The repository's pre-merge accessibility gate remains outstanding. |
| Repository administration | `main` was unprotected; rulesets require a public repository or upgraded plan. On publication, require PRs, DCO and the three CI jobs; block force pushes/deletion. Verify private vulnerability reporting, Dependabot alerts/security updates and push protection. |
| Description / visibility / release | Replace `missing-is-not-zero` with a plain project description; make only this release repository public, keep the archive private; publish the new reviewed tag without moving `v0.1.0`. |

Recommended PR order: **#3 first; close #1 as superseded after #3; #2 next**,
with its session-log conflict resolved and tests rerun against #3. The dependency
update in #1 is already included. PR #2 adds research links; it is optional for
source publication. Release steps and draft notes: `releases/0.1.1.md`.

The live `https://onerhythm.org/` returned 200 with CSP, HSTS, no-referrer,
permissions and nosniff on 16 November. It has not been updated by this work.
A response does not verify Railway logs or processor terms. No hosted member
database, processor contract or mobile release was inspected.

## Member launch stays blocked

Legal/privacy review, processor terms and retention, published floor/gate pages,
moderator and appeals staffing, hosted database setup, manual assistive-technology
checks and operational verification remain governed by ADR 0021 and
PRODUCTION_READINESS. No launch gate is marked met here. This is a focused
source-release review, not a penetration test or comprehensive research audit.
