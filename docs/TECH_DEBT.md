# Technical Debt Inventory

**Created:** 2026-03-21
**Last reviewed:** 2026-03-21
**Source:** Bootstrap audit synthesis (MATTY, YAMAMURA, AJENTIC, B agents)

---

## Categories

- **Architecture** — structural decisions that limit scalability or correctness
- **Security** — defense-in-depth gaps or hardening needed
- **Accessibility** — WCAG compliance gaps
- **Quality** — test coverage, documentation, observability
- **Cleanup** — dead code, outdated dependencies, legacy surfaces

---

## Architecture

| # | Item | Impact | Effort | Priority | Agent |
|---|------|--------|--------|----------|-------|
| A1 | **Synchronous FAL.ai generation** — art generation runs in FastAPI request thread (up to 45s timeout). Under viral load, all worker threads will block. PRD v3 §12.2 specifies Modal/worker queue. | High — blocks scaling | L | P1 | MATTY |
| A2 | **Local filesystem art storage** — art assets stored on API server disk. Lost on redeploy. No CDN. No horizontal scaling. | High — data loss risk | M | P0 | MATTY |
| A3 | **SSE polling instead of Supabase Realtime** — 5s database polling instead of event-driven push. Adequate for beta, will not scale. | Medium — UX + scale | L | P2 | MATTY |
| A4 | **Two parallel truth layers** — legacy RhythmDistanceAggregate (v1.5) and MissionAggregate (v3) track distance independently. No data shared. Frontend uses v3 only. Legacy endpoints remain active. | Medium — confusion risk | M | P2 | MATTY |
| A5 | **No aggregate reconciliation** — no automated check that `MissionAggregate.total_distance_m == COUNT(contributions) × 0.75`. A partial transaction failure could cause permanent drift. | High — truth layer risk | S | P0 | MATTY |
| A6 | **No admin endpoints** — chain repair, aggregate rebuild, moderation review all require direct DB access. No operational tooling. | Medium — operational risk | M | P0 | MATTY |
| A7 | **MissionAggregate missing persisted computed fields** — `total_distance_km`, `earth_progress_pct`, `moon_progress_pct` computed at query time instead of persisted. Fragile and duplicates logic. | Low — consistency risk | S | P2 | MATTY |
| A8 | **No chain visual continuity** — `start_y_px`/`end_y_px` fields exist on ArtAsset but generator doesn't fetch prior segment endpoint. Segments are visually independent. | Low — aesthetic only | M | P2 | MATTY |

---

## Security

| # | Item | Impact | Effort | Priority | Agent |
|---|------|--------|--------|----------|-------|
| S1 | **CORS method/header wildcards** — `allow_methods=["*"]`, `allow_headers=["*"]` in production. Origin list is correct but method/header wildcards are overly permissive. | Medium — attack surface | S | P0 | YAMAMURA |
| S2 | **Legacy upload routes lack moderation** — upload_sessions `first_name` and `location_label` fields have regex sanitization but no crisis/profanity moderation queue integration. | Medium — trust risk | M | P1 | YAMAMURA |
| S3 | **Next.js 15.5.10 advisories** — 2 moderate CVEs (cache poisoning, disk cache exhaustion). Patched in 15.5.14. | Medium — exploitable | S | P0 | YAMAMURA |
| S4 | **No Content-Security-Policy header** — response security middleware sets X-Frame-Options, HSTS, etc. but not CSP. XSS defense-in-depth gap. | Low — defense-in-depth | S | P1 | YAMAMURA |
| S5 | **RLS without explicit policies** — deny-by-default works for privileged API connections but blocks any future Supabase client SDK usage. | Low — blocks future work | M | P2 | YAMAMURA |
| S6 | **5 route groups lack rate limiting** — Profiles, Consent, Stories, Export, Delete. All auth-gated, reducing abuse surface. | Low — auth-gated | S | P2 | YAMAMURA |

---

## Accessibility

| # | Item | Impact | Effort | Priority | Agent |
|---|------|--------|--------|----------|-------|
| X1 | **Reduced-motion coverage at 15%** — 88 files with animations, only 13 gate on `prefers-reduced-motion`. Most Framer Motion `motion.div` usage is ungated. User base skews 60-80+ years. | High — WCAG violation | M | P1 | AJENTIC |
| X2 | **1 aria-live region in entire app** — only the medical disclaimer in `packages/ui`. Realtime mission counters, contribution feeds, and SSE-driven updates have no screen reader announcements. | Medium — screen reader UX | S | P1 | AJENTIC |
| X3 | **No mobile 2D fallback for globe** — mission control scene has no fallback for devices without WebGL or with insufficient GPU performance. | Medium — mobile UX | M | P1 | AJENTIC |
| X4 | **No skip navigation link** — users must tab through header to reach main content. | Low — keyboard UX | S | P2 | AJENTIC |
| X5 | **Muted text contrast unverified** — `--color-text-muted` may be below 4.5:1 ratio on some surface levels. Needs manual verification. | Low — potential violation | S | P2 | AJENTIC |

---

## Quality

| # | Item | Impact | Effort | Priority | Agent |
|---|------|--------|--------|----------|-------|
| Q1 | **2 failing web test suites** — reveal-shell.test.tsx (2 tests) and research/pulse/[slug]/page.test.tsx (1 test). Pre-existing failures. | Low — test credibility | S | P1 | B |
| Q2 | **API test suite blocked locally** — SQLite migration failure at 0003. Tests require PostgreSQL-compatible DB. | Medium — CI gap | M | P1 | B+MATTY |
| Q3 | **No test coverage tracking** — no `--coverage` configuration. Target is ≥80% for critical paths. | Medium — visibility gap | S | P2 | B |
| Q4 | **No join-to-share-ready instrumentation** — PRD v3 targets p95 <12s. No measurement exists. FAL.ai timeout is 45s. | Medium — SLA blind spot | S | P1 | MATTY |
| Q5 | **No visual regression tests for share cards** — OG image generation has no automated visual testing. | Low — regression risk | M | P2 | B |
| Q6 | **No API documentation** — 68+ endpoints across 16 route groups with zero structured docs. | Medium — onboarding | L | P2 | B |
| Q7 | **No operational runbook** — no documented procedures for chain repair, aggregate rebuild, generation failure, or moderation escalation. | Medium — incident response | M | P2 | B |
| Q8 | **CHANGELOG never versioned** — only `[Unreleased]` section. No semantic versioning applied. | Low — release hygiene | S | P2 | B |

---

## Cleanup

| # | Item | Impact | Effort | Priority | Agent |
|---|------|--------|--------|----------|-------|
| C1 | **Legacy v1/v1.5 routes still registered** — mosaic, rhythm, rhythm_contributions routes serve stale/independent data. See CLEANUP_MANIFEST.md. | Low — confusion | M | P2 | MATTY |
| C2 | **Legacy upload pipeline intact** — metadata_purge, ocr_redaction, artistic_transform, upload_pipeline, upload_sessions — all out of scope per §18. | Low — attack surface | M | P2 | MATTY+YAMAMURA |
| C3 | **Dead frontend component** — `live-rhythm-stream.tsx` has zero imports. | None — dead code | S | P2 | AJENTIC |
| C4 | **Missing canonical brand phrase** — "pain is not a competition" appears 0 times in codebase. Should be in `site-copy.ts`. | Low — brand gap | S | P2 | AJENTIC |
| C5 | **No Heading/DataText guardrail components** — typography enforcement relies on developer discipline, not component constraints. Zero violations exist today. | Low — future drift risk | S | P2 | AJENTIC |
| C6 | **5-6 component files with hardcoded hex** — non-Three.js components that should use CSS variables. | Low — token drift | S | P2 | AJENTIC |

---

## Priority Distribution

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | 5 | Must fix before launch |
| P1 | 10 | Should fix quickly — degrades experience or safety |
| P2 | 17 | Fix when possible — tech debt |

---

*Next review: 2026-06-21 (quarterly)*
