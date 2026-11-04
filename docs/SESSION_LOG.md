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
