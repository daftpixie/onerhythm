# Public-source readiness — 16 November 2026

**Published for public source review.** The repository is public, and
[v0.1.1](https://github.com/daftpixie/onerhythm/releases/tag/v0.1.1) was
published as a prerelease on 16 November 2026 at 7:19 p.m. Eastern.
The tag resolves to reviewed commit
`2aa82e7760dd0886ad903af1e258f028592aea04`; all three CI jobs passed on it.
The active main ruleset is now protecting the public repository. The member
service remains closed; this is a pre-launch Apache-2.0 prototype.

## Merged result

- [PR #3](https://github.com/daftpixie/onerhythm/pull/3), the SDK 58/security,
  evidence and privacy-wording repair, merged as
  `324909da8b1f9167418bcb7271f971e8dc548984`.
- [PR #1](https://github.com/daftpixie/onerhythm/pull/1) closed as superseded
  after #3 merged.
- [PR #2](https://github.com/daftpixie/onerhythm/pull/2), the founder-paper links,
  was rebased onto that main, retested and merged as
  `7641bd202bea7f756e25fca5d8bf34ac3eeb7c7b`.
- The merged application source tree matched the tested combined candidate:
  `713703bdec9a603fe65c5b68a5c68839eff1a202`. This release-record update changes
  documentation only; its own PR carries the final documentation CI evidence.
- Version 0.1.1 is prepared in package/app configuration. The original
  `v0.1.0` tag remains at `0caa32be29e533247c4ff1623e90ed1744c771c4`.
  The private development archive is separate and has not been published.

## Evidence and limits

| Check | Result |
|---|---|
| Fresh install / lint / TypeScript | Pass on the reviewed source. Node 24.22.1 locally; Node 22 in CI. |
| Application tests | 680 pass across 59 suites with the founder-paper change. The SDK repair alone passed 672; intermediate SDK 57 also passed 672. |
| Landing-mode tests | 678 pass; two form tests intentionally excluded by the existing CI filter. Separate assertions pin the form's absence. |
| Expo doctor | 20/20. Splash uses its supported plugin; Android mask uses an existing square icon. |
| Exact-head CI | All three jobs and DCO passed after sign-off for #3 and again for #2 after its rebase. Application, database and Docker/container checks are included. |
| Source safeguards | Seven guards pass. Gitleaks 8.30.1 found no credentials in the reviewed branch histories and staged source candidates. Subsequent rebases/merges preserved those source bytes; no new full-history local scan is claimed. |
| Static export / serving | Landing export without Supabase settings or external script sources; ten Caddy status/security-header checks pass. Missing hashed JS is 404/no-store, hashed JS immutable, font license served, no cookies. |
| Read-only source reviews | Accessibility and privacy PASS on the repair; accessibility PASS on the founder-paper additions. |
| Founder verification | On 16 November, Matthew reports accessibility working and explicitly directs source publication. Browser/reader versions were not supplied. This is user-reported verification, not an independent Codex keyboard/reader pass or a WCAG certification. |
| Contributor rights | Matthew confirmed the DCO and authorized sign-off. Both contributions carry the real-name sign-off and the same-account GitHub alias; DCO passed. |

Relevant passing runs:
[#3 signed head](https://github.com/daftpixie/onerhythm/actions/runs/43958583404),
[#3 merged main](https://github.com/daftpixie/onerhythm/actions/runs/43979571399),
[#2 rebased head](https://github.com/daftpixie/onerhythm/actions/runs/43979866170).
Use each PR's checks for the exact commit and final status.

The execution computer is currently unavailable. No new local browser,
database, native-device or container run is claimed after that loss of access.
Native mobile rendering/distribution, hosted member data, processor contracts
and Railway logs were not verified by this review.

## Findings addressed

- Supported Expo 56 → 57 → 58 migration, aligned with React 19.3 / RN 0.88.1.
  No forced downgrade or incompatible transitive security override.
- Population figures now match vision references 35/38/39: dated AF/flutter
  estimate, approximately 13% AF anxiety, 22% depression and 12% ICD PTSD,
  with differing measures/estimates stated. Unsupported comparisons removed.
- Planned Supabase/private Google Sheet/email handling disclosed before the
  list can reopen. No completed legal review or executed terms invented.
  Sensitive inferences acknowledged without declaring a legal classification.
- Apache-2.0, contributor terms and trademark boundary retained; bundled font
  OFL included in served output. Not an exhaustive dependency-license opinion.

The reviewed npm audit moved from 43 affected packages (1 critical, 16 high,
20 moderate, 6 low) to 23 (0 critical, 0 high, 22 moderate, 1 low). These are
affected-package counts with inherited ratings, not independent demonstrated
exploits. Remaining glob/minimatch/deepmerge paths involve build/test tooling
and Expo fingerprinting. Caddy serves static output and does not run Node.
Recheck audit at release; no vulnerability-free claim is made.

After merge, Dependabot attempted glob/minimatch security updates and reported
`security_update_not_possible`. These are the disclosed residual dependency
paths, not failures of the three project CI jobs. Follow compatible upstream
fixes; do not force breaking overrides merely to hide the ratings.

## Publication verification

- `daftpixie/onerhythm` is **public**; `daftpixie/onerhythm-archive` remains
  **private**.
- The published `v0.1.1` release is **not a draft**, is marked **prerelease**,
  and its tag resolves to `2aa82e7760dd0886ad903af1e258f028592aea04`.
  The original `v0.1.0` tag remains unchanged.
- GitHub reports `main.protected: true`. Ruleset
  [main-public-source-safeguards](https://github.com/daftpixie/onerhythm/rules/27409052)
  is **Active**, targets the default branch main, and requires:
  PRs, DCO, `lint-typecheck-test`, `db`, `landing`, up-to-date branches and
  resolved review conversations. Force pushes and deletion are blocked.
- The bypass list is empty; GitHub reports the current maintainer can bypass
  **never**. Required independent approvals are **zero** for this
  sole-maintainer workflow; this setting does not require a second human.
- [Final release-commit CI](https://github.com/daftpixie/onerhythm/actions/runs/43981803040)
  passed all three jobs. Later documentation updates do not move the tag.

Private vulnerability reporting and secret push protection were **not verified**
through this connection: the specific read endpoint is not exposed, and the
public security page could not be fetched. No enabled/disabled state is
inferred. The email security-report fallback in SECURITY.md remains documented.
Dependabot alerts/security updates, malware alerts, web-based sign-off and the
repository description were verified during the earlier administration review.

## Member launch stays blocked

Legal/privacy review, processor terms and retention, hosted database setup and
grants, published floor/gate pages, moderator/appeals and crisis staffing,
operational verification and broader assistive-technology/device testing remain
governed by ADR 0021 and PRODUCTION_READINESS. No member launch gate is marked
met here. No clinical effectiveness, regulatory clearance, penetration-test
assurance or production approval follows from publishing source.
