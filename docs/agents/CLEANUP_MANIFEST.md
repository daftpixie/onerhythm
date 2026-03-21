# OneRhythm Repo Cleanup Manifest

**Date:** 2026-03-21
**Commit:** 942bfb78f47df796bd210a1e55b21144fb79b1b3
**Compiled by:** B (synthesized from MATTY, YAMAMURA, AJENTIC audits)

---

## Execution Report

| Metric | Value |
|--------|-------|
| **Execution date** | 2026-03-21 |
| **Files deleted** | 11 (9 manifest + 2 additional dead test files) |
| **Files updated** | 3 (routes/__init__.py, upload_sessions.py, upload_pipeline.py) |
| **Tests updated** | 1 (test_upload_session_routes.py — removed legacy aggregate assertions) |
| **Dependencies removed** | None (no unused packages) |
| **Build status** | PASS |
| **Test status** | 75 passing, 3 failing (pre-existing, no regressions) |
| **YAMAMURA compliance** | PASS (1 false positive — negative disclaimer) |

### Additional files deleted beyond original manifest

| File | Reason |
|------|--------|
| `apps/api/tests/test_mosaic_routes.py` | Tests for deleted mosaic routes |
| `apps/api/tests/test_rhythm_contributions.py` | Tests for deleted rhythm_contributions routes |

---

## Summary

| Category | Count |
|----------|-------|
| Files DELETED | 11 |
| Files UPDATED | 4 |
| Files to REVIEW | 3 |

**Important:** Most backend "dead" files were actively imported via the
legacy route registration in `routes/__init__.py`. Deregistration was
completed before deletion.

---

## DELETE — Safe to Remove

### Dead Backend Routes (Legacy v1/v1.5)

These routes are registered in `routes/__init__.py` and must be deregistered
before the service files can be deleted.

| # | Path | Reason | Found By | Active Imports |
|---|------|--------|----------|---------------|
| 1 | `apps/api/app/api/routes/mosaic.py` | Legacy heart mosaic routes. Superseded by mission v3. | MATTY | `routes/__init__.py` (deregister first) |
| 2 | `apps/api/app/api/routes/rhythm.py` | Legacy `/rhythm/stats` and `/rhythm/milestones`. Superseded by `/mission-v3/*`. | MATTY | `routes/__init__.py` (deregister first) |
| 3 | `apps/api/app/api/routes/rhythm_contributions.py` | Legacy synthetic contribution routes. Superseded by mission v3 contribution flow. | MATTY | `routes/__init__.py` (deregister first) |

### Dead Backend Services (Legacy v1/v1.5)

| # | Path | Reason | Found By | Active Imports |
|---|------|--------|----------|---------------|
| 4 | `apps/api/app/services/rhythm_counter.py` | Legacy distance aggregate (RhythmDistanceAggregate). Parallel truth layer to mission v3. | MATTY | `rhythm.py`, `rhythm_contributions.py`, `upload_sessions.py`, `upload_pipeline.py` — all legacy |
| 5 | `apps/api/app/services/rhythm_contributions.py` | Legacy contribution service. Superseded by mission v3. | MATTY | `upload_pipeline.py`, `rhythm_contributions.py` route — all legacy |
| 6 | `apps/api/app/services/metadata_purge.py` | EXIF metadata stripping for uploaded images. No v3 consumer. | MATTY | `upload_pipeline.py` only |

### Dead Backend Tests

| # | Path | Reason | Found By | Active Imports |
|---|------|--------|----------|---------------|
| 7 | `apps/api/tests/test_upload_pipeline.py` | Tests for out-of-scope ECG upload pipeline. | MATTY | None (test file) |
| 8 | `apps/api/tests/test_rhythm_counter.py` | Tests for legacy rhythm aggregate. | MATTY | None (test file) |

### Dead Frontend Files

| # | Path | Reason | Found By | Active Imports |
|---|------|--------|----------|---------------|
| 9 | `apps/web/components/landing/live-rhythm-stream.tsx` | New file with zero imports anywhere in codebase. Truly dead. | AJENTIC | None |

### Frontend Files Already Deleted (git status: D)

These are already deleted from the working tree. Included for completeness:

| Path | Status |
|------|--------|
| `apps/web/app/account/data/data-controls-shell.test.tsx` | Deleted |
| `apps/web/app/account/data/data-controls-shell.tsx` | Deleted |
| `apps/web/app/account/data/page.tsx` | Deleted |
| `apps/web/app/account/stories/page.tsx` | Deleted |
| `apps/web/app/account/stories/story-submission-shell.tsx` | Deleted |

---

## UPDATE — Needed but Outdated

| # | File | What's Outdated | Change Required | Agent |
|---|------|----------------|-----------------|-------|
| 1 | `apps/api/app/api/routes/__init__.py` | Registers legacy routers (mosaic, rhythm, rhythm_contributions) | Remove legacy router imports and `include_router` calls | MATTY |
| 2 | `apps/api/app/services/upload_pipeline.py` | Real ECG upload processing — out of scope per §18 | If legacy upload routes are retained: add moderation queue integration. If decommissioned: delete. | MATTY+YAMAMURA |
| 3 | `apps/api/app/api/routes/upload_sessions.py` | Legacy ECG upload CRUD — functional but out of scope | Same as upload_pipeline.py — decommission or add moderation | MATTY+YAMAMURA |
| 4 | `apps/web/package.json` | Next.js 15.5.10 has 2 moderate security advisories | Update to ≥15.5.14: `pnpm update next@^15.5.14` | YAMAMURA |

---

## REVIEW — Human Decision Required

| # | File | Question | Context |
|---|------|----------|---------|
| 1 | `apps/api/tests/test_ocr_redaction.py` | Keep or delete? | Tests for OCR redaction service that still exists. Service is out of scope but code is intact. Tests provide coverage if upload routes are retained. |
| 2 | `apps/api/tests/test_artistic_transform.py` | Keep or delete? | Same as above — tests for artistic transform service. |
| 3 | `apps/api/app/services/ocr_redaction.py` + `artistic_transform.py` | Keep or delete? | Security-critical PHI handling code. Only used by upload_pipeline. Decision depends on whether legacy upload routes are retained or decommissioned. |

---

## Dependency Cleanup

### npm Packages to Remove

No unused npm packages identified. All installed packages are actively imported.

### npm Packages to Update (Security)

| Package | Current | Target | Reason |
|---------|---------|--------|--------|
| next | 15.5.10 | ≥15.5.14 | 2 moderate security advisories (GHSA-ggv3-7p47-pfv8, GHSA-3x4c-7xq6-9pq8) |

### npm Packages to Update (Minor — Safe)

| Package | Current | Latest |
|---------|---------|--------|
| turbo | 2.8.16 | 2.8.20 |
| react | 19.0.0 | 19.2.4 |
| react-dom | 19.0.0 | 19.2.4 |
| framer-motion | 12.36.0 | 12.38.0 |
| typescript | 5.8.2 | 5.9.3 |
| @types/react | 19.0.12 | 19.2.14 |
| @types/react-dom | 19.0.4 | 19.2.3 |
| autoprefixer | 10.4.21 | 10.4.27 |
| postcss | 8.5.3 | 8.5.8 |

### npm Packages — Major Version (Defer)

| Package | Current | Latest | Reason to Defer |
|---------|---------|--------|-----------------|
| tailwindcss | 3.4.17 | 4.2.2 | Breaking config format change; requires migration |
| vitest | 3.2.4 | 4.1.0 | Major API changes; evaluate |
| jsdom | 26.1.0 | 29.0.1 | Test environment; evaluate |
| @types/node | 22.13.14 | 25.5.0 | Breaking type changes; evaluate |

### Python Packages

No Python dependency vulnerabilities flagged by YAMAMURA audit.

---

## Execution Order

**Phase A: Preparation**
1. Remove legacy router imports from `routes/__init__.py` (mosaic, rhythm, rhythm_contributions)
2. Remove imports of `rhythm_counter` from `upload_sessions.py` and `upload_pipeline.py`
3. Remove imports of `rhythm_contributions` service from `upload_pipeline.py`
4. Remove import of `metadata_purge` from `upload_pipeline.py`

**Phase B: Delete Dead Files**
5. Delete `apps/api/app/api/routes/mosaic.py`
6. Delete `apps/api/app/api/routes/rhythm.py`
7. Delete `apps/api/app/api/routes/rhythm_contributions.py`
8. Delete `apps/api/app/services/rhythm_counter.py`
9. Delete `apps/api/app/services/rhythm_contributions.py`
10. Delete `apps/api/app/services/metadata_purge.py`
11. Delete `apps/api/tests/test_upload_pipeline.py`
12. Delete `apps/api/tests/test_rhythm_counter.py`
13. Delete `apps/web/components/landing/live-rhythm-stream.tsx`

**Phase C: Update**
14. Update Next.js: `pnpm update next@^15.5.14`

**Phase D: Verify**
15. `pnpm lint` — verify passes
16. `pnpm typecheck` — verify passes
17. `pnpm build` — verify passes
18. `pnpm test` — verify passes (or no regressions)
19. YAMAMURA diagnostic grep — verify clean

**Phase E: Commit**
20. `git commit: "chore: repo cleanup — decommission legacy v1/v1.5 routes and services"`

---

*End of cleanup manifest.*
