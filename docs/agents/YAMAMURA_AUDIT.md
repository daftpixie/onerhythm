# YAMAMURA Security & Compliance Audit Report

**Date:** 2026-03-21
**Commit:** 942bfb78f47df796bd210a1e55b21144fb79b1b3
**Agent:** YAMAMURA — Security, Compliance & Threat Modeling
**Type:** Read-only bootstrap audit
**Depends on:** MATTY_AUDIT.md (Phase 1)

---

## Compliance Status: CONDITIONAL PASS

| Metric | Value |
|--------|-------|
| Diagnostic language violations | **0** (2 false positives — guardrail regex + negative disclaimer) |
| Critical security findings | **0** |
| High security findings | **2** |
| Medium security findings | **3** |
| Dependency vulnerabilities | **2 moderate** (Next.js 15.5.10 → patch to 15.5.14) |
| Dead security files | 3 to DELETE, 3 to UPDATE, 1 to REVIEW |

**Conditional on:** Updating Next.js to ≥15.5.14 to resolve 2 moderate advisories.

---

## Top 5 Priority Items

| # | Risk | Severity | Current State | Recommendation |
|---|------|----------|--------------|----------------|
| 1 | **CORS allows all methods/headers** | HIGH | `allow_methods=["*"]`, `allow_headers=["*"]` in production. Origin list is correct but method/header wildcards are overly permissive. | Restrict to `["GET","POST","PUT","PATCH","DELETE","OPTIONS"]` and specific headers. |
| 2 | **No content moderation on legacy upload display_name/location** | HIGH | Mission v3 write path has moderation pipeline. Legacy upload_sessions route sanitizes names with regex but has NO moderation queue integration for crisis/profanity. | Either decommission legacy upload routes or add moderation. |
| 3 | **Next.js 15.5.10 has 2 moderate advisories** | MEDIUM | GHSA-ggv3-7p47-pfv8 (cache poisoning) and GHSA-3x4c-7xq6-9pq8 (disk cache exhaustion). Both patched in 15.5.14. | `pnpm update next@^15.5.14` |
| 4 | **No CSP header on API responses** | MEDIUM | Response security middleware sets X-Frame-Options, X-Content-Type-Options, HSTS, Permissions-Policy but NOT Content-Security-Policy. | Add CSP header for XSS defense-in-depth. |
| 5 | **RLS enabled but no explicit policies** | MEDIUM | Migration 0014 enables RLS and revokes all access (deny-by-default). No `CREATE POLICY` statements exist. Works with privileged API connection but blocks Supabase client SDK. | Add explicit read policies before enabling any client-side Supabase SDK usage. |

---

## 2. Diagnostic Language Sweep

### Forbidden Patterns (CLAUDE.md + PRD v3 §19)

| Pattern | Matches | Status | Notes |
|---------|---------|--------|-------|
| "your ECG shows" | 0 | PASS | |
| "we recommend treatment" | 1 | FALSE POSITIVE | `educational_guidance.py:37` — appears in `PROHIBITED_PHRASES` regex list (guardrail that **blocks** this phrase from appearing in content) |
| "clinical finding" | 1 | FALSE POSITIVE | `heart-mosaic.tsx:209` — negative disclaimer: "It does not present clinical findings or ECG analysis" |
| "abnormal result" | 0 | PASS | |
| "ECG analysis" | 1 | FALSE POSITIVE | Same `heart-mosaic.tsx:209` negative disclaimer as above |
| "heart scan" | 0 | PASS | |
| "upload your ECG" | 0 | PASS | |
| "verify your diagnosis" | 0 | PASS | |
| "analyze your heart rhythm" | 0 | PASS | |
| "disease severity" | 0 | PASS | |
| "FindYourRhythm" | 0 | PASS | |
| "personalized clinical" | 0 | PASS | |
| "your medical waveform" | 0 | PASS | |

**Verdict: ZERO true violations.** All matches are guardrail enforcement code or negative disclaimers.

### Required Language Elements

| Element | Status | Location(s) |
|---------|--------|-------------|
| "not a medical device" | FOUND | `packages/ui/src/components/medical-disclaimer.tsx:39`, `apps/web/content/partials/disclaimers.ts:14`, `apps/web/components/mission/hud/BottomBar.tsx:93` |
| "educational" (framing) | FOUND | 160+ occurrences across codebase. Primary: `disclaimers.ts:14` ("educational community platform") |
| "consult healthcare provider" | FOUND | `medical-disclaimer.tsx:43` ("Always consult your physician or qualified healthcare provider"), `disclaimers.ts:14`, `BottomBar.tsx:93` |
| "symbolic contribution" | FOUND | `reveal-shell.test.tsx:43`, content modules |

---

## 3. Regulatory Compliance — Required Elements

### 3A. Medical Disclaimer

| Check | Status | Details |
|-------|--------|---------|
| Component exists | YES | `packages/ui/src/components/medical-disclaimer.tsx` |
| Non-dismissible | YES | No close/X button. Uses `role="note"`, `aria-atomic="true"` |
| aria-live="polite" | YES | Set on component |
| Correct text | YES | Matches Brand Guidelines v2 exact wording (see below) |
| Cosmos bg + Warning border | YES | `bg-cosmos-nebula/92`, `border-warning/28`, left accent bar `bg-warning` |

**Disclaimer exact text:**
> "OneRhythm is an educational resource and community platform. It is not a medical device. It does not diagnose, interpret ECGs, treat, cure, or prevent any disease, and it does not recommend treatment. The information provided is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your physician or qualified healthcare provider with any questions regarding a medical condition."

**Compact version (Mission BottomBar):**
> "Not a medical device. Consult your physician."

### Disclaimer Presence by Route

| Route | Educational Content? | Disclaimer Present? | COMPLIANT? |
|-------|---------------------|---------------------|------------|
| `/` (Home) | Metrics only | No (not required) | YES |
| `/join` | Contribution form | Yes (consent step) | YES |
| `/contribute/*` | Consent, upload, reveal | Yes (`MedicalDisclaimer`) | YES |
| `/mission` | Mission metrics | Yes (BottomBar compact) | YES |
| `/learn` | Research, conditions | Yes (`MedicalDisclaimer`) | YES |
| `/research/pulse/*` | Research articles | Yes (`MedicalDisclaimer`) | YES |
| `/about` | Mission info | No (not educational) | YES |
| `/community/stories/*` | User stories | No (not educational) | YES |
| `/mosaic` | Visual archive | No (not educational) | YES |
| `/result/[shareSlug]` | Contribution result | Yes (result shell) | YES |

### 3B. Crisis Resources

**Component:** `apps/web/content/partials/disclaimers.ts`

**Crisis resources include:**
- 988 Suicide & Crisis Lifeline (US) — Call or text 988
- Crisis Text Line (US) — Text HOME to 741741
- Samaritans (UK) — Call 116 123
- Lifeline (AU) — Call 13 11 14
- Boundary: "OneRhythm is not a crisis service and cannot provide therapy or counseling."

**Automated crisis detection:**
File: `apps/api/app/mission_v3/moderation.py`

Patterns detected (case-insensitive): "kill myself", "end my life", "suicide", "want to die", "self harm"

Response: status `"suppressed"`, risk_score `0.98`, flagged for human review in ModerationQueue.

**Verdict: COMPLIANT.** Crisis resources are comprehensive (multi-region), and automated moderation detects crisis language in user-submitted fields.

### 3C. Consent and Data

| Check | Status | Details |
|-------|--------|---------|
| Contribution flow completable without clinical data | YES | Only required: rhythm_type (symbolic selector), palette_key, consent acknowledgment |
| Rhythm selector does NOT rank by seriousness | YES | Options presented as peer-level identity choices, not severity rankings |
| Consent checkbox with non-diagnostic language | YES | Consent version tracked, flags stored as JSON, language references "symbolic contribution" |

---

## 4. Application Security Audit

### 4A. Input Security — User-Submitted Fields

| Field | Backend File | Max Length | Sanitized | Char Validation | Moderation Pipeline |
|-------|-------------|-----------|-----------|----------------|-------------------|
| `display_name` | `mission_v3_contracts.py` | 80 chars | Yes (strip, collapse spaces) | Truncate to max | Yes (crisis, profanity, PII detection) |
| `note` | `mission_v3_contracts.py` | 280 chars | Yes (strip, collapse spaces) | Truncate to max | Yes (crisis, profanity, PII detection) |
| `country_code` | `mission_v3_contracts.py` | 2 chars | Yes (strip, uppercase) | Regex `^[A-Z]{2}$` | No (ISO 3166-1 validation sufficient) |
| `rhythm_type` | `mission_v3_contracts.py` | Enum | N/A | Literal enum (10 values) | No (constrained) |
| `palette_key` | `mission_v3_contracts.py` | Enum | N/A | Literal enum (5 values) | No (constrained) |
| `email` | `write_service.py` | 320 chars | Yes (normalize) | Email format validation | No (not displayed publicly) |
| `referral_source` | `mission_v3_contracts.py` | 64 chars | Yes (strip, truncate) | Truncate to max | No (not displayed publicly) |

**Legacy upload fields (upload_sessions.py):**
| Field | Max Length | Sanitized | Moderation |
|-------|-----------|-----------|------------|
| `first_name` | 32 chars | Yes (regex: alphanumeric, apostrophes, hyphens) | NO — missing moderation queue |
| `location_label` | 64 chars | Yes (regex: alphanumeric, common punctuation) | NO — missing moderation queue |

**Contact info detection in display_name/note:**
- URL patterns: `https?://`, `www.`
- Email: `@` symbol
- Phone: `\d{3}[-.\s]?\d{3}[-.\s]?\d{4}`
- Response: flagged as `"external_contact"`, status `"pending_review"`, risk_score 0.68

### 4B. API Security Summary

Cross-referencing MATTY_AUDIT.md endpoint inventory:

| Route Group | Input Validation | Rate Limited | Auth | Error Leaks |
|-------------|-----------------|-------------|------|-------------|
| Auth (`/v1/auth/*`) | Yes (Pydantic) | Yes (5/60s) | Mixed | No — APIContractError |
| Beta (`/v1/beta/*`) | Yes | Yes (5/60s) | No | No |
| Analytics (`/v1/analytics/*`) | Yes (Pydantic) | Yes (60/60s) | Optional | No |
| Profiles (`/v1/profiles/*`) | Yes (Pydantic) | **No** | Required | No |
| Consent (`/v1/consents/*`) | Yes (Pydantic) | **No** | Required | No |
| Stories (`/v1/stories/*`) | Yes | **No** | Mixed | No |
| Research Pulse (`/v1/research-pulse/*`) | Yes (Pydantic) | Yes (60/60s) | Mixed | No |
| Export (`/v1/.../export-requests/*`) | Yes | **No** | Required | No |
| Delete (`/v1/.../delete-requests/*`) | Yes | **No** | Required | No |
| Upload Sessions (`/v1/upload-sessions/*`) | Yes (form) | Yes (10/60s) | Required | No |
| Mosaic (`/v1/mosaic/*`) | Yes (query) | Yes (60/60s) | No | No |
| Rhythm legacy (`/v1/rhythm/*`) | Minimal | Yes (60/60s) | No | No |
| Rhythm Contributions (`/v1/rhythm-contributions/*`) | Yes (Pydantic) | Yes | Mixed | No |
| Educational (`/v1/educational-content/*`) | Yes | Yes (20/60s) | Required | No |
| **Mission v3 (`/v1/mission-v3/*`)** | **Yes (Pydantic)** | **Yes** | **Mixed** | **No** |

**Finding:** Profiles, Consent, Stories, Export, Delete route groups lack explicit rate limiting. These are all auth-required, reducing abuse surface, but auth-gated endpoints should still be rate-limited to prevent credential-stuffed abuse.

### 4C. Data Security

| Check | Status | Details |
|-------|--------|---------|
| `console.log/error/warn` in frontend | **0 occurrences** | Zero console statements in `apps/web` .ts/.tsx files |
| PII in localStorage | SAFE | Only timestamps and metric counts stored. Keys: `onerhythm_last_visit_at`, `onerhythm_last_distance_km`, `onerhythm_last_contributions`, `onerhythm_last_countries`, `onerhythm.waitlist-submission.v1` (status only) |
| PII in sessionStorage | SAFE | Only `onerhythm_wywa_dismissed` (boolean flag) |
| Secrets in committed code | NONE FOUND | No SUPABASE_SERVICE_ROLE, API_KEY, SECRET_KEY, or PRIVATE_KEY in source files |
| .gitignore covers .env | YES | `.env.local` and `.env.*.local` excluded. Template `.env.example` files correctly tracked |
| Share slug security | CRYPTOGRAPHIC | `uuid4().hex[:12]` — 48 bits of entropy from CSPRNG. Not sequential. Unique constraint in DB |

### 4D. Dependency Security

**pnpm audit results:**

| Severity | Count | Package | Advisory | Patched In |
|----------|-------|---------|----------|------------|
| Moderate | 1 | next@15.5.10 | GHSA-ggv3-7p47-pfv8 (cache poisoning) | ≥15.5.13 |
| Moderate | 1 | next@15.5.10 | GHSA-3x4c-7xq6-9pq8 (disk cache exhaustion) | ≥15.5.14 |

**Critical:** 0 | **High:** 0 | **Moderate:** 2

**Action:** Update Next.js to ≥15.5.14. Single command: `pnpm update next@^15.5.14`

---

## 5. Dead Security-Relevant Files

### PHI/HIPAA Infrastructure (Legacy v1 — Out of Scope per PRD v3 §18)

| File Path | Classification | Security Relevance | Active Imports | Safe to Delete |
|-----------|---------------|-------------------|---------------|---------------|
| `apps/api/app/services/metadata_purge.py` | DELETE | EXIF/metadata stripping for uploaded images. No v3 consumer. | Only from `upload_pipeline.py` | Yes (with upload_pipeline) |
| `apps/api/app/services/ocr_redaction.py` | UPDATE | RapidOCR PHI redaction. Security-critical if uploads exist. | Only from `upload_pipeline.py` | Only if upload routes removed |
| `apps/api/app/services/artistic_transform.py` | UPDATE | Destructive image transform (privacy boundary). | Only from `upload_pipeline.py` | Only if upload routes removed |
| `apps/api/app/services/upload_pipeline.py` | UPDATE | Full ECG processing orchestration. | From `routes/upload_sessions.py` | Only if upload routes removed |
| `apps/api/app/api/routes/upload_sessions.py` | DELETE | Legacy ECG upload CRUD. Out of scope per §18. | From `routes/__init__.py` router | Yes (deregister from router) |
| `apps/api/tests/test_ocr_redaction.py` | REVIEW | Tests for PHI redaction service | N/A (test file) | With ocr_redaction.py |
| `apps/api/tests/test_upload_pipeline.py` | DELETE | Tests for upload pipeline | N/A (test file) | Yes |

### Blockchain/Crypto References

| Search | Result |
|--------|--------|
| `solana`, `anchor` (blockchain), `web3`, `IPFS`, `Arweave` | NONE in code |
| `AES-256`, `client-side encrypt` | NONE |
| Environment vars: `SOLANA_`, `ANCHOR_`, `IPFS_`, `ARWEAVE_`, `ECG_`, `MOSAIC_`, `BLOCKCHAIN_` | NONE |

**Verdict: Clean.** No blockchain infrastructure exists in the codebase.

### Dead File Counts (Security Domain)

| Classification | Count |
|---------------|-------|
| DELETE | 3 |
| UPDATE | 3 |
| REVIEW | 1 |

---

## 6. Threat Model Summary

### Authentication & Session Security

| Property | Status |
|----------|--------|
| Session token storage | Server-side (cookie-based, httpOnly, secure, sameSite=lax) |
| Session expiry | 14 days |
| Max active sessions | 5 per user |
| Session revocation | Individual + bulk ("revoke others") |
| Password validation | Strength policy enforced at signup |
| Brute force protection | Rate limited (5 attempts / 60s) |

### CSRF Protection

| Property | Status |
|----------|--------|
| Origin validation | Yes — `request_security.py` validates Origin header on all POST/PUT/PATCH/DELETE to `/v1/*` |
| Safe methods exempt | Yes — GET, HEAD, OPTIONS bypass origin check |
| Test coverage | Yes — `test_request_security.py` |

### Prompt Injection Prevention

| Property | Status |
|----------|--------|
| User text reaches AI prompt | NO — inputs normalized to `SymbolicRhythmSpec` with constrained enum values |
| Free-text fields (display_name, note) | Never included in generation prompt |
| Palette/rhythm selection | Constrained to 5 palette keys × 10 rhythm types |

### Contribution Replay Prevention

| Property | Status |
|----------|--------|
| One rhythm per user | YES — `ix_contributions_user_id` unique index on user_id |
| Distance enforcement | YES — CHECK constraint `distance_m = 0.75` at database level |
| Chain ordering | YES — `chain_index` unique index, sequential assignment |

---

## 7. Security Posture Assessment

### Strengths

1. **Zero diagnostic language violations** — guardrail regex actively blocks forbidden phrases
2. **Database-enforced distance accounting** — CHECK constraints make metric corruption impossible at the data layer
3. **Comprehensive input validation** — Pydantic strict models with `extra="forbid"`, enum constraints, length limits
4. **Cryptographically secure share slugs** — UUID4-based, not enumerable
5. **No PII in client storage** — only timestamps and aggregate counts
6. **Zero console statements in frontend** — no accidental PII leakage
7. **Automated crisis detection** — moderation pipeline catches self-harm language and suppresses with high risk score
8. **CSRF protection** — origin validation on all state-mutating API calls
9. **Prompt injection prevention** — user free-text never reaches AI generation prompt
10. **One-rhythm-per-user enforcement** — unique database constraint prevents distance inflation

### Weaknesses

1. **CORS method/header wildcards** — `allow_methods=["*"]` and `allow_headers=["*"]` are more permissive than necessary
2. **5 route groups lack rate limiting** — Profiles, Consent, Stories, Export, Delete (all auth-gated, reducing risk)
3. **Legacy upload routes still active** — ECG upload flow is out of scope per PRD v3 §18 but remains functional and lacks moderation queue integration
4. **No CSP header** — defense-in-depth gap for XSS prevention
5. **RLS without explicit policies** — deny-by-default works for privileged connections but blocks future Supabase client SDK usage

---

*End of YAMAMURA bootstrap audit.*
