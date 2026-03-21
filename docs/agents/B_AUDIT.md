# B Project Health Report — Synthesis & Prioritized Action Plan

**Agent:** B — Project Management, Documentation & Quality
**Date:** 2026-03-21
**Commit:** 942bfb78f47df796bd210a1e55b21144fb79b1b3
**Inputs:** MATTY_AUDIT.md, YAMAMURA_AUDIT.md, AJENTIC_AUDIT.md, PRD v3

---

## Overall Health: YELLOW

| Metric | Value |
|--------|-------|
| PRD v3 Acceptance Tests | **7/10 passing** |
| Critical blockers | **0** |
| High-severity findings | **3** |
| Medium-severity findings | **6** |
| Dead files to clean up | **12** |
| Test suites | 22 passing, 2 failing (web); API suite blocked by local migration issue |

---

## 1. Documentation Inventory

| Document | Location | Exists? | Current? | Quality (1-5) |
|----------|----------|---------|----------|---------------|
| README.md | `/README.md` | Yes | Yes — reflects PRD v3 migration | 4 |
| CLAUDE.md | `/CLAUDE.md` | Yes | Yes — rewritten for v3 | 5 |
| CHANGELOG.md | `/CHANGELOG.md` | Yes | Partial — only `[Unreleased]`, no versioned releases | 2 |
| TECH_DEBT.md | `docs/TECH_DEBT.md` | **No** | — | — |
| ADRs | `docs/adr/` | Yes | 6 ADRs (0001–0006), last is mission-v3 truth layer | 3 |
| API docs | — | **No** | No structured API documentation exists | 0 |
| Component docs | — | **No** | No component documentation exists | 0 |
| Deployment guide | `docs/launch/railway-supabase-first-deployment.md` | Yes | Partial — covers initial Railway+Supabase setup only | 2 |
| Runbook | — | **No** | No operational runbook exists | 0 |
| PRD v3 | `docs/prd/OneRhythm_PRD_v3.md` | Yes | Yes — authoritative | 5 |
| Brand Guidelines v2 | `docs/content/OneRhythm_Brand_Guidelines_v2.pdf` | Yes | Yes | 5 |
| Architecture docs | `docs/architecture/` | Yes | 5 files — auth, data backbone, mosaic, upload, mission v3 | 3 |

### Documentation Gaps

- **TECH_DEBT.md**: Does not exist. Created as part of this audit (see below).
- **API documentation**: 68+ endpoints across 16 route groups with zero structured documentation.
- **Component documentation**: 107 .tsx components with no props/usage docs.
- **Runbook**: No operational procedures for chain repair, aggregate rebuild, generation failure, or moderation escalation.
- **CHANGELOG**: Never been versioned. Only `[Unreleased]` section exists.

---

## 2. Test Coverage Assessment

### Web Tests (Vitest)

| Metric | Value |
|--------|-------|
| Test files | 24 total |
| Passing | 22 files, 75 tests |
| Failing | 2 files, 3 tests |
| Coverage | Not measured (no `--coverage` configured) |

**Failing tests** (pre-existing, not caused by recent changes):
1. `apps/web/components/contribute/reveal-shell.test.tsx` — 2 tests
2. `apps/web/app/research/pulse/[slug]/page.test.tsx` — 1 test (expects "Primary source" text not rendered)

### API Tests (Pytest)

| Metric | Value |
|--------|-------|
| Status | **BLOCKED** — local SQLite migration fails at migration 0003 |
| Note | Tests require PostgreSQL-compatible DB; SQLite lacks required features |

### Critical Path Test Coverage

| Critical Path | Has Tests? | Adequate? |
|---------------|-----------|-----------|
| Distance accounting (0.75m) | Yes — CHECK constraints + service tests | PARTIAL — no reconciliation test |
| Contribution creation | Yes — mission v3 flow tests | Yes |
| Chain ordering integrity | Yes — unique index + sequential assignment | PARTIAL — no gap detection test |
| Milestone threshold detection | Yes — service layer tests | PARTIAL — no edge-case tests |
| Share card generation | No — no visual regression tests | **NO** |
| Auth flow | Yes — session tests | Yes |
| Moderation pipeline | Yes — crisis/profanity detection tests | Yes |

---

## 3. Dependency Health

### Root Monorepo

| Package | Current | Latest | Severity |
|---------|---------|--------|----------|
| turbo | 2.8.16 | 2.8.20 | Minor |

### Web App (`apps/web`)

| Package | Current | Latest | Severity | Notes |
|---------|---------|--------|----------|-------|
| next | 15.5.10 | 16.2.1 | **MAJOR** | 2 moderate security advisories; patch to 15.5.14 minimum |
| react | 19.0.0 | 19.2.4 | Minor | |
| react-dom | 19.0.0 | 19.2.4 | Minor | |
| tailwindcss | 3.4.17 | 4.2.2 | **MAJOR** | Breaking changes; defer |
| typescript | 5.8.2 | 5.9.3 | Minor | |
| framer-motion | 12.36.0 | 12.38.0 | Minor | |
| vitest | 3.2.4 | 4.1.0 | **MAJOR** | Breaking changes; defer |
| jsdom | 26.1.0 | 29.0.1 | **MAJOR** | Breaking changes; defer |
| @types/node | 22.13.14 | 25.5.0 | **MAJOR** | Breaking type changes; evaluate |
| @types/react | 19.0.12 | 19.2.14 | Minor | |
| @types/react-dom | 19.0.4 | 19.2.3 | Minor | |
| autoprefixer | 10.4.21 | 10.4.27 | Minor | |
| postcss | 8.5.3 | 8.5.8 | Minor | |

**Summary:** 13 outdated packages. 4 major version jumps (defer: tailwindcss, vitest, jsdom, @types/node). **1 security-critical**: Next.js 15.5.10 → 15.5.14 minimum.

### Python API

Not audited via `pip list --outdated` in this phase. YAMAMURA flagged no Python dependency vulnerabilities.

---

## 4. PRD v3 Acceptance Test Status

| # | Test | Status | Evidence |
|---|------|--------|----------|
| 1 | First-time user: land → contribute → share < 2 min | **PARTIAL** | Flow exists end-to-end. Join-to-share time not instrumented. FAL.ai timeout is 45s. |
| 2 | No real ECG upload path anywhere | **PASS** | Synthetic-only contribution flow. Legacy upload routes exist but are out-of-scope per §18. |
| 3 | Every contribution increments by exactly 0.75 m | **PASS** | Database CHECK constraints enforce `distance_m = 0.75`. Named constant. Zero violations. |
| 4 | Homepage counters update without page refresh | **PARTIAL** | SSE polling every 5s. Not true realtime (PRD specifies Supabase Realtime Broadcast). Functionally works. |
| 5 | Mission view scales without per-contribution heavy objects | **PASS** | InstancedMesh for contribution points. LOD-capable scene graph. |
| 6 | Visually aligned with dark, luminous brand system | **PASS** | Complete CSS token system. Bioluminescent Futurism applied. Zero forbidden phrases. |
| 7 | Never diagnostic or clinical decision support | **PASS** | Zero diagnostic language violations. Medical disclaimer deployed on all educational surfaces. |
| 8 | Country analytics rank by distance | **PASS** | `CountryAggregate.total_distance_m` indexed. API sorts by distance. |
| 9 | Result state encourages immediate sharing | **PASS** | SharePanel component on result page. Platform-specific share buttons. OG image generation. |
| 10 | Mobile users get coherent mission experience | **PARTIAL** | Mission control renders on mobile. No 2D fallback for low-end devices. |

**Score: 7 PASS, 3 PARTIAL, 0 FAIL**

---

## 5. Cross-Agent Finding Summary

### From MATTY (Backend)

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| M1 | Missing Supabase Realtime Broadcast | High | SSE polling is functional substitute |
| M2 | Missing worker/queue infrastructure | High | Synchronous FAL.ai calls block under load |
| M3 | MissionAggregate missing computed fields | Medium | Computed at query time — fragile |
| M4 | Missing admin endpoints | Medium | Manual DB-only for chain repair, aggregate rebuild |
| M5 | No aggregate reconciliation | Medium | No drift detection between aggregate and COUNT×0.75 |
| M6 | Art assets stored locally | High | Lost on redeploy, no CDN |
| M7 | Two parallel truth layers | Medium | Legacy v1.5 + mission v3 — confusing |
| M8 | No chain visual continuity | Low | start_y/end_y not linked between segments |

### From YAMAMURA (Security)

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| Y1 | CORS method/header wildcards | High | Overly permissive in production |
| Y2 | Legacy upload missing moderation | High | Crisis/profanity not checked on legacy fields |
| Y3 | Next.js 15.5.10 advisories | Medium | 2 moderate CVEs, patch available |
| Y4 | No CSP header | Medium | XSS defense-in-depth gap |
| Y5 | RLS without explicit policies | Medium | Blocks future Supabase client SDK usage |
| Y6 | 5 route groups lack rate limiting | Low | All auth-gated, reduced risk |

### From AJENTIC (Frontend)

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| A1 | Reduced-motion coverage 15% | High | 88 animated files, 13 with motion gates |
| A2 | aria-live for realtime updates | Medium | Only 1 aria-live region (medical disclaimer) |
| A3 | Missing "pain is not a competition" | Low | Canonical brand phrase has 0 occurrences |
| A4 | No Heading/DataText components | Low | Typography enforced by convention, not code |
| A5 | Missing mobile 2D fallback | Medium | Globe scene has no low-end device fallback |
| A6 | 5-6 files with hardcoded hex | Low | Three.js files are known exception |
| A7 | No skip navigation link | Low | Accessibility gap |

---

## 6. Prioritized Action Plan

### P0 — Must Fix (Blocks Launch)

| # | Item | Domain | Agent | Effort |
|---|------|--------|-------|--------|
| 1 | Update Next.js to ≥15.5.14 | Security | YAMAMURA | S |
| 2 | Restrict CORS methods/headers to explicit list | Security | YAMAMURA | S |
| 3 | Move art assets to Supabase Storage or S3 | Infrastructure | MATTY | M |
| 4 | Add aggregate reconciliation (verify COUNT×0.75) | Truth layer | MATTY | S |
| 5 | Add admin endpoints: rebuild aggregates, repair chain | Operations | MATTY | M |

### P1 — Should Fix Quickly (Degrades Experience)

| # | Item | Domain | Agent | Effort |
|---|------|--------|-------|--------|
| 6 | Add prefers-reduced-motion to all Framer Motion animations | Accessibility | AJENTIC | M |
| 7 | Add aria-live regions for realtime mission counters | Accessibility | AJENTIC | S |
| 8 | Add mobile 2D fallback for globe scene | Frontend | AJENTIC | M |
| 9 | Add async generation queue (Modal/worker) | Infrastructure | MATTY | L |
| 10 | Add CSP header to API responses | Security | YAMAMURA | S |
| 11 | Fix 2 failing web test suites | Quality | B | S |
| 12 | Decommission legacy upload routes OR add moderation | Security | YAMAMURA+MATTY | M |
| 13 | Instrument join-to-share-ready time (p95 target: 12s) | Observability | MATTY | S |

### P2 — Fix When Possible (Tech Debt)

| # | Item | Domain | Agent | Effort |
|---|------|--------|-------|--------|
| 14 | Replace SSE polling with Supabase Realtime Broadcast | Infrastructure | MATTY | L |
| 15 | Decommission legacy truth layer (rhythm_counter, rhythm routes) | Cleanup | MATTY | M |
| 16 | Create Heading and DataText guardrail components | Design system | AJENTIC | S |
| 17 | Add "pain is not a competition" to content modules | Brand | AJENTIC | S |
| 18 | Add skip navigation link | Accessibility | AJENTIC | S |
| 19 | Migrate hardcoded hex in non-Three.js components | Design system | AJENTIC | S |
| 20 | Add explicit RLS policies for future client SDK usage | Security | YAMAMURA+MATTY | M |
| 21 | Create API documentation | Documentation | B | L |
| 22 | Create operational runbook | Documentation | B | M |
| 23 | Add visual regression tests for share cards | Quality | B | M |
| 24 | Add chain gap detection test | Quality | B+MATTY | S |
| 25 | Verify muted text contrast ratio (4.5:1) | Accessibility | AJENTIC | S |
| 26 | Stories-format OG images (1080×1920) | Share engine | AJENTIC | M |
| 27 | Rate limit remaining 5 auth-gated route groups | Security | YAMAMURA | S |

### CLEANUP — Dead File Removal

See `docs/agents/CLEANUP_MANIFEST.md` for the complete manifest with execution order.

---

## 7. Risk Assessment

### Launch Readiness

| Gate | Status |
|------|--------|
| Core contribution flow | READY |
| Distance accounting | READY (database-enforced) |
| Non-diagnostic posture | READY (zero violations) |
| Brand alignment | READY |
| Security baseline | CONDITIONAL (Next.js update + CORS fix) |
| Accessibility | NOT READY (reduced-motion gap) |
| Scalability | NOT READY (synchronous processing, local storage) |
| Observability | NOT READY (no p95 instrumentation) |

### Verdict

The product is **functionally complete for a controlled beta launch** with the P0 items resolved. The P0 list is small (5 items, ~2-3 days of work) and addresses security, operational safety, and data durability.

Scaling infrastructure (P1 items 9, 14) should be in place before any viral marketing push. The synchronous FAL.ai processing and local file storage are the two architectural constraints that will fail under load.

---

*End of B project health report.*
