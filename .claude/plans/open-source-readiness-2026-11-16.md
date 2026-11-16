# Public-source readiness review — 16 November 2026

Requested by the founder: check the current OneRhythm repository before making
it public and publishing more of the work around it. This authorizes a release
review and a reviewable repair branch; it does not open the member platform.

1. Verify the current remote commit, all branches, release tag and history.
2. Scan that history for credentials; review the public file set and licensing.
3. Reproduce install, lint, types, application tests and the landing export.
   Read the actual CI results for database and container checks.
4. Apply dependency fixes within the existing declared version ranges. Do not
   force an Expo downgrade or override incompatible transitive APIs merely to
   turn an audit report green.
5. Repair test-tool compatibility exposed by those updates without relaxing
   assertions. Include the bundled font's license in the web distribution.
6. Record remaining security, evidence, privacy and repository-settings gaps in
   `docs/PUBLIC_SOURCE_READINESS.md`, with separate source and member-launch
   decisions. Refresh the entry-point documentation.
7. Open a draft PR with evidence. Publication remains on hold while release
   blockers remain. The existing founder-papers PR is outside this repair.

Baseline: `0caa32be29e533247c4ff1623e90ed1744c771c4`.
Local review uses Node 24.22.1; repository CI uses Node 22. Docker is unavailable
in this review workspace, so database and container results must be attributed
to the GitHub runs, not claimed as new local runs.
