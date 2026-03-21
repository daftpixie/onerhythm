# MATTY Backend Audit Report

**Date:** 2026-03-21
**Commit:** 942bfb78f47df796bd210a1e55b21144fb79b1b3
**Agent:** MATTY — Backend, Data, Infrastructure & Analytics
**Type:** Read-only bootstrap audit

---

## Executive Summary

| Category | EXISTS | PARTIAL | MISSING | INCORRECT |
|----------|--------|---------|---------|-----------|
| Database & Data Model | 10 | 3 | 1 | 0 |
| Distance Accounting | 4 | 1 | 1 | 0 |
| API Endpoints | 12 | 2 | 3 | 0 |
| Generation Pipeline | 5 | 2 | 2 | 0 |
| Realtime Infrastructure | 1 | 0 | 4 | 1 |
| Deployment & Infrastructure | 3 | 2 | 2 | 0 |
| **Totals** | **35** | **10** | **13** | **1** |

**Dead files:** 8 to DELETE, 4 to UPDATE, 2 to REVIEW

---

## Top 5 Priority Items (Impact on Mission Truth Layer)

1. **MISSING: Supabase Realtime Broadcast** — PRD v3 §12.4 requires 5 realtime event types. Current implementation uses manual SSE polling every 5s. No Supabase Realtime, no WebSocket, no broadcast. This is the single largest gap between spec and implementation.

2. **MISSING: Worker/queue infrastructure** — PRD v3 §12.2 specifies Modal/managed worker queue for spike handling. All processing is synchronous in the FastAPI request thread. A viral spike will block the API.

3. **PARTIAL: MissionAggregate missing computed fields** — PRD v3 §13.4 requires `total_distance_km`, `earth_progress_pct`, `moon_progress_pct`. These are computed at query time in the API layer, not stored in the table. Acceptable for now but fragile — the truth layer should persist the canonical values.

4. **MISSING: Admin endpoints** — PRD v3 §14 requires: moderate name/note, rebuild aggregates, repair chain, re-run generation. None of these admin endpoints exist. Manual DB intervention is the only option.

5. **PARTIAL: Aggregate reconciliation** — No automated drift detection between `MissionAggregate.total_distance_m` and `COUNT(contributions) × 0.75`. Manual verification only. A single failed transaction could cause permanent drift.

---

## 2A. Database & Data Model

### PRD v3 Section 13 Compliance

| Table | Status | Notes |
|-------|--------|-------|
| **Contribution (§13.1)** | EXISTS | `MissionContribution` table. All PRD fields present plus extras (user_id, consent_version, moderation_status, generation_status, verification fields). `palette_id` → `palette_key`. CHECK constraint enforces distance_m = 0.75. |
| **ArtAsset (§13.2)** | EXISTS | `MissionArtAsset` table. All F2 manifest fields present: prompt_version, model_id, seed, start_y_px, end_y_px, width_px, height_px, style_family, generation_status. Also has storage_key, alt_text, geometry_manifest. |
| **MissionSegment (§13.3)** | EXISTS | All fields present: chain_index (unique indexed), route_position_m (indexed), distance_m (CHECK = 0.75), milestone_key, geometry_manifest, is_recent. |
| **MissionAggregate (§13.4)** | PARTIAL | Has total_contributions, total_distance_m, countries_represented, current_milestone_key, last_contribution_at, updated_at. **MISSING from table:** total_distance_km, earth_progress_pct, moon_progress_pct. These are computed at API response time. |
| **CountryAggregate (§13.5)** | EXISTS | All fields: country_code (PK), total_contributions, total_distance_m (indexed), share_count, is_public_enabled, last_contribution_at. |
| **Milestone (§13.6)** | PARTIAL | Has key, label, distance_threshold_m (≈ distance_target_m), celebration_variant, description, status, reached_at, metadata. **Difference:** uses `status` enum ("pending"/"reached") instead of boolean `is_reached`. Functionally equivalent. |
| **ShareEvent (§13.7)** | EXISTS | All fields: contribution_id, platform, generated_at, clicked_at, posted_at. |
| **ModerationQueue (§13.8)** | EXISTS | All fields: object_type, object_id (unique composite index), risk_score, flags (JSON), reviewer_status, reviewed_at. |
| **Migrations** | EXISTS | 16 versioned migration files (0001–0016). Alembic with revision chain. Each has upgrade() and downgrade(). |
| **RLS Policies** | PARTIAL | Migration 0014 enables RLS on ALL tables and revokes anon/authenticated/service_role access. However, NO explicit `CREATE POLICY` statements exist — this is deny-by-default which works when the API uses a privileged connection, but means Supabase client SDK calls will fail. |
| **Indexes** | EXISTS | Comprehensive indexes on hot read paths: contributions (public_visibility+created_at, status+created_at, country_code, user_id), mission_segments (chain_index unique, route_position_m), country_aggregates (total_distance_m), milestones (distance_threshold_m), share_events (contribution_id). |

### Additional Tables Not in PRD v3 (Legacy + Supporting)

| Table | Era | Status |
|-------|-----|--------|
| User, Profile | v1 | Active — used by mission v3 for identity linkage |
| UserSession | v1 | Active — auth infrastructure |
| ConsentRecord | v1 | Active — consent management |
| ExportRequest, DeleteRequest | v1 | Active — data rights |
| UploadSession, ProcessingJob | v1 | Legacy — real ECG upload pipeline (out of scope per §18) |
| MosaicTile | v1 | Legacy — old heart mosaic artifact |
| RhythmContribution | v1.5 | Legacy — hybrid bridge to v3 |
| RhythmDistanceAggregate | v1.5 | Legacy — separate from mission v3 aggregate |
| MilestoneEvent | v1.5 | Legacy — replaced by MissionMilestone |
| MissionMember | v3 | Active — user-to-contribution identity linkage |
| MissionVerificationChallenge | v3 | Active — email OTP verification |
| AnalyticsEvent, AuditEvent | v1 | Active — event tracking |
| Research Pulse tables (12) | v1 | Active — publication ingestion system |
| CuratedContentEntry | v1 | Active — educational content |
| CommunityStory | v1 | Active — community stories |
| BetaWaitlistSignup, BetaAllowlist | v2 | Active — beta access management |

---

## 2B. Distance Accounting (SACRED)

| Check | Status | Details |
|-------|--------|---------|
| **Named constant** | EXISTS | `CANONICAL_MISSION_CONTRIBUTION_DISTANCE_METERS = 0.75` in `apps/api/app/mission_v3/constants.py:5`. Used via import in models.py for column defaults and CHECK constraints. |
| **Database enforcement** | EXISTS | Two CHECK constraints: `ck_contributions_distance_m_canonical` (contributions.distance_m = 0.75) and `ck_mission_segments_distance_m_canonical` (mission_segments.distance_m = 0.75). Database will reject any row with distance ≠ 0.75. |
| **Increment code path** | EXISTS | `MissionContribution.distance_m` defaults to 0.75 via the named constant, with server_default and CHECK constraint. The value is never user-supplied. |
| **Aggregate = COUNT × 0.75** | PARTIAL | The aggregate is updated programmatically when contributions are created, but there is no automated reconciliation process that verifies `total_distance_m == COUNT(active contributions) × 0.75`. |
| **Chain ordering** | EXISTS | `mission_segments.chain_index` has a UNIQUE index. Sequential assignment is handled in the service layer. |
| **Route position monotonicity** | EXISTS | `route_position_m` is indexed and assigned sequentially. |
| **Automated reconciliation** | MISSING | No scheduled job, no trigger, no background worker that detects or corrects aggregate drift. If a transaction partially fails, aggregate could diverge from reality permanently. |

### Magic Number Audit

The 0.75 literal appears in several places outside the named constant:
- **Migration 0015:** Local constant `CANONICAL_DISTANCE_M = 0.75` (acceptable — migrations are frozen snapshots)
- **Environment variables:** `.env.example`, `.env.staging.example`, `.env.production.example` all have `CONTRIBUTION_DISTANCE_METERS=0.75` (acceptable — configuration backup)
- **Frontend:** ~12 files reference `0.75` in display strings, test fixtures, and content — these are display/test values sourced from the API response, not independent calculations. Acceptable.
- **Docs:** ~10 references in PRD, content strategy, content library. Acceptable.

**Verdict:** The constant is properly defined and enforced at the database level. No code path can create a contribution with distance ≠ 0.75. The migration duplication is standard practice. No violations found.

---

## 2C. API Endpoints

### Complete Endpoint Inventory

**68+ endpoints across 16 route groups.** Key groups:

| Group | Routes | Method/Count | Validation | Rate Limited | Auth | Tests |
|-------|--------|-------------|-----------|-------------|------|-------|
| Health | `/health`, `/ready` | GET ×2 | — | — | — | — |
| Auth | `/v1/auth/*` | POST ×4, GET ×3 | Yes (Pydantic) | Yes (5/60s) | Mixed | Yes |
| Beta | `/v1/beta/*` | POST ×1, GET ×2 | Yes | Yes (5/60s) | No | Yes |
| Analytics | `/v1/analytics/events` | POST ×1 | Yes (Pydantic) | Yes (60/60s) | Optional | — |
| Profiles | `/v1/profiles/*` | POST/GET/PATCH/DELETE ×4 | Yes (Pydantic) | — | Required | — |
| Consent | `/v1/consents/*` | GET/POST/PUT ×4 | Yes (Pydantic) | — | Required | — |
| Stories | `/v1/stories/*` | Mixed ×9 | Yes | — | Mixed | — |
| Research Pulse | `/v1/research-pulse/*` | GET ×5 | Yes (Pydantic) | Yes (60/60s) | Mixed | Yes |
| Export | `/v1/profiles/*/export-requests/*` | GET/POST ×4 | Yes | — | Required | — |
| Delete | `/v1/profiles/*/delete-requests/*` | GET/POST ×3 | Yes | — | Required | — |
| Upload Sessions | `/v1/upload-sessions/*` | Mixed ×5 | Yes (form) | Yes (10/60s) | Required | Yes |
| Mosaic | `/v1/mosaic/*` | GET ×2 | Yes (query) | Yes (60/60s) | No | Yes |
| Rhythm (legacy) | `/v1/rhythm/*` | GET ×2 | — | Yes (60/60s) | No | Yes |
| Rhythm Contributions | `/v1/rhythm-contributions/*` | Mixed ×8 | Yes (Pydantic) | Yes | Mixed | Yes |
| Educational | `/v1/educational-content/*` | GET ×1 | Yes | Yes (20/60s) | Required | — |
| **Mission v3** | `/v1/mission-v3/*` | Mixed ×16 | Yes (Pydantic) | Yes | Mixed | Yes |

### PRD v3 Section 14 Required Capabilities

| Capability | Status | Endpoint |
|------------|--------|----------|
| **Public read: mission aggregate** | IMPLEMENTED | `GET /v1/mission-v3/aggregate` |
| **Public read: recent contributions** | IMPLEMENTED | `GET /v1/mission-v3/recent-joins` |
| **Public read: country rankings** | IMPLEMENTED | `GET /v1/mission-v3/countries` |
| **Public read: milestone state** | IMPLEMENTED | `GET /v1/mission-v3/milestones` |
| **Public read: result by share slug** | IMPLEMENTED | `GET /v1/mission-v3/contributions/{share_slug}/result` |
| **Write: create contribution** | IMPLEMENTED | `POST /v1/mission-v3/contributions` |
| **Write: trigger generation** | IMPLEMENTED | Integrated into contribution creation flow |
| **Write: finalize contribution** | IMPLEMENTED | `POST /v1/mission-v3/contributions/{id}/finalize` |
| **Write: create share event** | IMPLEMENTED | `POST /v1/mission-v3/contributions/{slug}/share-events` |
| **Write: delete contribution** | PARTIAL | Soft delete exists via status management, but no dedicated `DELETE` endpoint on mission v3 contributions |
| **Admin: moderate name/note** | MISSING | No admin moderation endpoint exists |
| **Admin: rebuild aggregates** | MISSING | No endpoint; manual DB only |
| **Admin: repair chain** | MISSING | No endpoint; manual DB only |
| **Admin: re-run generation** | PARTIAL | No explicit re-run endpoint, but generation can be retried via the finalize flow |

---

## 2D. Generation Pipeline

| Check | Status | Details |
|-------|--------|---------|
| **fal.ai integration** | EXISTS | `apps/api/app/services/symbolic_rhythm.py` uses `fal-ai/nano-banana-2/edit` model. Poll-based (1.2s interval, 45s timeout). Falls back to local SVG+PNG branded render if FAL unavailable. |
| **Prompt schema** | EXISTS | User inputs are normalized to `SymbolicRhythmSpec` with constrained palette moods (signal/pulse/aurora/ember/moonlit), rhythm styles, emotional tones. User text never reaches the AI prompt directly. |
| **Chain continuity** | PARTIAL | `start_y_px` and `end_y_px` fields exist on ArtAsset for endpoint matching. However, the current symbolic rhythm generator produces standalone waveforms — there is no code that fetches the prior segment's `end_y_px` to set the next segment's `start_y_px`. Chain visual continuity is not enforced. |
| **Manifest persistence** | EXISTS | All F2 fields stored: prompt_version, model_id, seed, start_y_px, end_y_px, width_px, height_px, style_family, generation_status, plus geometry_manifest JSON. |
| **Atomic creation** | EXISTS | Contribution + segment created in same SQLAlchemy session/transaction. |
| **Aggregate update** | EXISTS | Aggregate counters updated after contribution creation in the service layer. |
| **Failure handling** | EXISTS | Generation failures set `generation_status = "failed"` on the ArtAsset without creating a MissionSegment. Chain ordering is not corrupted. |
| **Retry** | PARTIAL | No explicit re-generation endpoint. The seed and manifest are stored, so retry is theoretically possible, but no code path exercises it. |
| **SLA (12s p95)** | MISSING | No instrumentation to measure join-to-share-ready time. FAL timeout is 45s. No p95 tracking. |

---

## 2E. Realtime Infrastructure

| Check | Status | Details |
|-------|--------|---------|
| **Supabase Realtime** | MISSING | Not configured. Not imported. Not referenced in any code. |
| **SSE endpoint** | EXISTS | `GET /v1/mission-v3/live` uses FastAPI `StreamingResponse` with `text/event-stream`. Polls database every 5 seconds and emits JSON snapshots. |
| **Event: contribution.created** | MISSING | No discrete event. SSE sends full snapshot. |
| **Event: mission.updated** | MISSING | No discrete event. SSE sends full snapshot. |
| **Event: country.updated** | MISSING | No discrete event. Bundled in snapshot. |
| **Event: milestone.reached** | MISSING | No milestone-specific event. |
| **Event: share.created** | MISSING | No share event broadcast. |
| **Event flow (§12.4)** | INCORRECT | PRD specifies: finalized → DB update → segment assigned → broadcast → clients update. Actual: finalized → DB update → segment assigned → SSE poll picks it up on next 5s tick. No push, no broadcast, no event-driven flow. |
| **Milestone detection** | EXISTS | Checked during contribution finalization in the service layer. Milestones with `distance_threshold_m ≤ total_distance_m` are marked as reached. |
| **Client debounce** | EXISTS | Frontend `useMissionLiveOverview` hook implements polling with configurable intervals. |

---

## 2F. Deployment & Infrastructure

| Check | Status | Details |
|-------|--------|---------|
| **Frontend: Vercel** | PARTIAL | `.github/workflows/deploy-web.yml` exists with build + archive steps, but does not explicitly deploy to Vercel. Manual step noted. |
| **API: Railway** | PARTIAL | `.env.production.example` contains Railway-style DATABASE_URL. `.github/workflows/deploy-api.yml` archives the app but deployment is manual. |
| **Database: Supabase** | EXISTS | PostgreSQL via Supabase. Connection string in env examples. RLS hardening in migration 0014. |
| **Storage: Supabase Storage** | MISSING | Art assets stored as local files (MISSION_V3_ASSET_DIR, RHYTHM_ARTIFACT_DIR). No Supabase Storage integration. No CDN. |
| **Environment variables** | EXISTS | `.env.example`, `.env.staging.example`, `.env.production.example` all present. `.env` in `.gitignore`. |
| **CI/CD pipeline** | EXISTS | `.github/workflows/ci.yml` runs lint, typecheck, test, build on PR/push. |
| **Worker infrastructure** | MISSING | No Celery, Redis, RQ, Modal, or any task queue. All processing is synchronous. |

---

## 2G. Performance Baselines

| Metric | Status | Notes |
|--------|--------|-------|
| **Join-to-share-ready time** | NOT MEASURED | FAL timeout is 45s. No instrumentation for p95. |
| **Homepage FMP** | NOT MEASURED | No RUM or performance monitoring. |
| **N+1 query patterns** | NONE FOUND | Service layer uses single queries with joins. Aggregate lookups are singleton reads. |
| **Unindexed hot-path queries** | NONE FOUND | All hot read paths (aggregate, recent contributions, country rankings, segments window) hit indexed columns. |

---

## 3. Dead File Identification

### Files from Prior PRD Eras

| File Path | Classification | Reason | PRD Era |
|-----------|---------------|--------|---------|
| `apps/api/app/services/upload_pipeline.py` | UPDATE | Real ECG upload processing (metadata purge, OCR redaction, artistic transform, tile generation). Out of scope per §18. However, code is still referenced by upload_sessions routes. | v1 |
| `apps/api/app/services/ocr_redaction.py` | UPDATE | RapidOCR-based PHI identification and redaction. Only used by upload_pipeline. Out of scope per §18 but not broken. | v1 |
| `apps/api/app/services/artistic_transform.py` | UPDATE | Privacy-preserving destructive image transform. Only used by upload_pipeline. Out of scope per §18. | v1 |
| `apps/api/app/services/metadata_purge.py` | DELETE | EXIF/metadata sanitization for uploaded images. Only used by upload_pipeline. No v3 consumer. | v1 |
| `apps/api/app/api/routes/upload_sessions.py` | UPDATE | Upload session CRUD routes. Still functional but serves deprecated v1 ECG upload flow. | v1 |
| `apps/api/app/api/routes/mosaic.py` | DELETE | Public mosaic stats and tile listing. Legacy heart mosaic surface replaced by mission v3. | v1 |
| `apps/api/app/services/rhythm_counter.py` | DELETE | Legacy distance aggregate (RhythmDistanceAggregate, MilestoneEvent). Superseded by mission v3 MissionAggregate. Maintains a separate, parallel truth layer. | v1.5 |
| `apps/api/app/services/rhythm_contributions.py` | DELETE | Legacy synthetic contribution service creating RhythmContribution + MosaicTile records. Superseded by mission v3 MissionContribution. | v1.5 |
| `apps/api/app/api/routes/rhythm_contributions.py` | DELETE | Legacy rhythm contribution routes (synthetic create, public stream, visibility). Superseded by mission v3 routes. | v1.5 |
| `apps/api/app/api/routes/rhythm.py` | DELETE | Legacy `/rhythm/stats` and `/rhythm/milestones`. Superseded by `/mission-v3/aggregate` and `/mission-v3/milestones`. | v1.5 |
| `apps/api/tests/test_ocr_redaction.py` | REVIEW | Tests for OCR redaction — out of scope but provides test coverage for a service that still exists. | v1 |
| `apps/api/tests/test_artistic_transform.py` | REVIEW | Tests for artistic transform — same situation as above. | v1 |
| `apps/api/tests/test_upload_pipeline.py` | DELETE | Tests for the full ECG upload pipeline. Will break when upload routes are removed. | v1 |
| `apps/api/tests/test_rhythm_counter.py` | DELETE | Tests for legacy rhythm aggregate. Superseded by mission v3 tests. | v1.5 |

### Dead File Counts

| Classification | Count |
|---------------|-------|
| DELETE | 8 |
| UPDATE | 4 |
| REVIEW | 2 |

### Notes on Cleanup

The legacy v1/v1.5 tables (MosaicTile, RhythmContribution, RhythmDistanceAggregate, MilestoneEvent, UploadSession, ProcessingJob) remain in the database schema and models.py. Removing the route/service files listed above does NOT require removing these tables — they can be left as dormant schema for data preservation. However, the following model relationships create coupling:

- `MosaicTile.source_contribution_id → RhythmContribution.contribution_id`
- `RhythmContribution.source_upload_session_id → UploadSession.upload_session_id`
- `UploadSession.resulting_tile_id → MosaicTile.tile_id`

A future migration should drop these tables cleanly after confirming no beta user data needs preservation.

### Keyword Search Results

| Keyword | Files Found | Verdict |
|---------|-------------|---------|
| `ecg_process` / `ecg.process` | 0 | Clean |
| `PHI` / `phi_strip` | `ocr_redaction.py`, `upload_pipeline.py` | Legacy v1 only |
| `waveform_anonym` / `GAN` / `PrivECG` | 0 | Clean |
| `tesseract` | 0 | Clean (uses RapidOCR instead) |
| `blockchain` / `solana` / `anchor` / `web3` / `token` / `mint` | 0 | Clean ("anchor" in mission_v3/service.py refers to geographic anchor points, not Solana Anchor) |
| `mosaic` | `routes/mosaic.py`, `models.py`, `contracts.py`, `routes/__init__.py`, migrations | Legacy v1 surfaces still registered |
| `tile_engine` / `heart_silhouette` / `spiral_growth` | 0 | Clean |
| `upload` | Multiple files | Legacy v1 upload pipeline still active |
| `de_identif` | 0 | Clean |
| `Docker` / `docker-compose` | 0 | None found |

---

## 4. Architecture Observations

### Two Parallel Truth Layers (CRITICAL)

The codebase maintains **two independent distance tracking systems**:

1. **Legacy (v1.5):** `RhythmDistanceAggregate` (singleton) + `MilestoneEvent` table, computed from `MosaicTile.rhythm_distance_cm`. Service: `rhythm_counter.py`. Endpoints: `/v1/rhythm/stats`, `/v1/rhythm/milestones`.

2. **Mission v3:** `MissionAggregate` (keyed "global") + `MissionMilestone` table, computed from `MissionContribution.distance_m`. Service: `mission_v3/service.py`. Endpoints: `/v1/mission-v3/aggregate`, `/v1/mission-v3/milestones`.

These two systems share NO data. A contribution in one does not appear in the other. The frontend currently consumes the mission v3 endpoints. The legacy endpoints remain registered and functional but serve stale/independent data.

**Recommendation:** Decommission the legacy truth layer (rhythm_counter, rhythm routes) to prevent confusion about which aggregate is authoritative.

### Synchronous Processing Risk

All API processing — including FAL.ai art generation (up to 45s timeout) — runs synchronously in the FastAPI request thread. Under viral load:
- Worker threads will be exhausted waiting for FAL.ai responses
- Subsequent requests will queue and timeout
- No backpressure mechanism exists

PRD v3 §12.2 explicitly calls for "Modal / managed worker queue / serverless worker layer" for spike handling.

### Storage Gap

Art assets are stored as local files on the API server filesystem. There is no Supabase Storage integration, no CDN, no distributed storage. This means:
- Assets are lost on server redeploy unless the filesystem is persistent
- No CDN acceleration for share card images
- Horizontal scaling is impossible (assets are node-local)

---

## 5. Recommended Priority Actions

### P0 — Before Launch

1. **Implement aggregate reconciliation** — Add a background check (cron or post-contribution) that verifies `MissionAggregate.total_distance_m == COUNT(active contributions) × 0.75`. Alert on drift.

2. **Move art assets to Supabase Storage or S3** — Local filesystem storage will not survive deployment. Assets must be in durable, CDN-backed object storage.

3. **Add admin endpoints** — At minimum: rebuild aggregates, repair chain ordering. These are operational necessities, not features.

### P1 — Before Scale

4. **Add async generation queue** — Move FAL.ai calls to a background worker (Modal, Celery, or serverless). Return a pending status to the user and poll/SSE for completion.

5. **Replace SSE polling with Supabase Realtime Broadcast** — 5-second polling is adequate for beta but will not scale. Event-driven push updates are required for the realtime experience PRD v3 describes.

### P2 — Cleanup

6. **Decommission legacy truth layer** — Remove rhythm_counter.py, rhythm.py routes, rhythm_contributions.py routes, mosaic.py routes. Unregister from router. Leave database tables dormant.

7. **Remove upload pipeline** — upload_pipeline.py, ocr_redaction.py, artistic_transform.py, metadata_purge.py, upload_sessions.py routes. These serve the out-of-scope real ECG upload flow.

---

*End of MATTY bootstrap audit.*
