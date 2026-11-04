# OneRhythm — PRD v1.0, Amendment 1
## Architecture & Compliance Hardening

**Status:** Authoritative addendum to OneRhythm PRD v1.0. Read alongside it.
**Origin:** Consensus review (GPT 5.5 architecture evaluation, adjudicated against Opus). This amendment records what was adopted, what was tempered, and what was deliberately rejected.
**How to read this:** each block names the PRD section it modifies. "Add" = insert. "Replace" = supersede the named text. These are clean drop-in blocks, not redlines.

---

## Summary of changes

The review confirmed the stack and the "solo-maintainable at launch" posture. The real gaps were not throughput — they were **correctness and operations**: privacy as data-model-and-workflow (not just policy), object-level authorization beyond RLS, moderation as a first-class domain, safe database evolution, and a small set of safety/privacy operational metrics. All scale infrastructure (replicas, queues, partitioning, search) is confirmed **growth-triggered, not launch.**

---

## §8 — ADD: "8.x Consumer health data, operationalized"

Privacy cannot live only in a policy document; it must exist as data model, workflows, and admin tooling.

- **Self-ID tags are regulated health data.** Even though OneRhythm stores no clinical/ECG data, the opt-in diagnosis and symptom tags **are "consumer health data"** under Washington MHMDA (and special-category data under GDPR). Every privacy obligation below applies to them.
- **Data inventory + purpose binding.** Maintain a field-level data map: what is stored, why, the legal basis/consent purpose, and its retention. No field exists without a purpose binding.
- **Consent ledger (versioned).** Consent is a record, not a checkbox state: store who consented, to what purpose, under which policy version, when, and the full withdrawal history. Re-consent is required when purposes change. (New table in §12.1.)
- **Deletion that actually reaches everything.** "Delete my data" must propagate to **backups, replicas, and any subprocessor**, on a defined schedule, with confirmation records. The deletion-cascade test (PRD §14.6) must assert this end-to-end, including self-ID tags.
- **Subprocessor inventory.** Maintain a current list of every third party that touches member data (Supabase, Cloudflare, Stripe, email/magic-link provider, analytics), with a review gate before any new one is added.
- **No new sharing surface.** OneRhythm does not sell or share health data; "sharing consent" is therefore moot by design, and that absence is itself documented in the consent ledger and privacy notice.

## §10 / §16 — ADD: store-fundraising is conditional on entity status

The link-out-to-web donation model (no in-app donation UI on mobile) remains correct **now**. Tie the future state explicitly to the entity decision:

- Apple permits **approved nonprofits** to fundraise in-app under specific conditions; otherwise fundraising must occur outside the app. Google Play exempts tax-exempt donations from Play billing but enforces strict payment-flow rules.
- **Therefore:** in-app donations become possible only **if** OneRhythm becomes an approved nonprofit (currently VT Infinite, Inc. d/b/a OneRhythm — not yet 501(c)(3)). Until then, link out. Re-verify both stores' policies at submission.
- **Correction (no paywall):** OneRhythm has no paid tiers, gated features, or entitlements. Recurring donations need idempotent, webhook-driven state for the donor portal (active / canceled / failed payment) — but **nothing is ever gated by payment**, and there is no entitlement model to build. Stripe data is never joined to a member's health self-ID.

## §11 — REPLACE the analytics paragraph

Analytics are cookieless, PII-free, and never tagged with diagnosis/symptom (unchanged). **Addition:** if **Umami** is chosen over Plausible, its session-replay and heatmap features must be **disabled entirely on any authenticated or health-related surface** — recording interaction on health pages reintroduces exactly the third-party-leak and FTC-HBNR risk the no-pixel rule exists to prevent. Replay/heatmaps, if ever used, are confined to public marketing pages only, and only with explicit product + counsel sign-off.

## §12.1 — ADD to the data model

- `consent_records` (id, member_id, purpose, policy_version, granted_at, withdrawn_at, source) — **the consent ledger; append-only; deletable only via the rights workflow.**
- `subprocessors` (name, purpose, data_categories, added_at, review_status) — public-facing where appropriate.
- Extend `moderation_actions` with: `state` (queued / in_review / escalated / actioned / appealed / closed), `tier` (1/2/3 per the governance model), `reporter_id`, `subject_id`, and an **immutable audit trail** (append-only; who did what, when, why).
- **No payment/entitlement tables** — donations are voluntary and ungated (see §10 correction above).

## §13 — ADD to non-functional requirements

**Authorization correctness (beyond RLS).** RLS is the required base layer, but it does not by itself prevent broken object-level authorization (BOLA/BFLA). Therefore:
- Maintain an explicit **authorization matrix**: for every object type (post, comment, journey entry, report, ballot, proposal, treasury entry, consent record) × every role × every action, the allowed/denied decision is documented and **contract-tested**.
- No fetch or update path may rely on client-side filtering or unguessable IDs for security.
- `service_role` / privileged keys are backend-only; every privileged action is logged to the audit trail.
- The crown-jewel invariants from §14.6 (**no-downvote**, **one-equal-vote**, **eligibility gate**, **consent-gating**, **deletion cascade**) are entries in this matrix, not separate concerns.

**Crisis logic is server-evaluated.** The 🆘 affordance and self-harm signal routing must not depend on brittle client-only state. Crisis-CTA render/availability is monitored as a safety SLI (below); a silent failure to render is a safety incident.

**Safe database evolution.** Web rollbacks (Cloudflare Pages) and OTA republish (EAS Update) do not undo destructive migrations. Adopt **expand → backfill → dual-read/dual-write → contract**, behind feature flags, with forward-compatible clients and a written data-repair playbook. Rollback classes: config, web, OTA, migration, data-repair.

**Release safety.** Cloudflare preview deployments are **public by default** — protect them (Cloudflare Access) and never put production member data in previews. Add CI gates: tests, lint, type-check, `axe`, secrets/PII scan, migration check.

**Resource budgets.** Rate-limit public endpoints, webhooks, and realtime channel joins; scope realtime channels narrowly. (Uploads are already blocked by data minimization, so they are not an attack surface.)

**Minimal observability (anti-vanity, no high-cardinality user labels).** Managed services do not remove the need for operational visibility, but keep it small and purpose-built. Standardize on a handful of SLIs; keep user identifiers out of metrics (use traces/logs with strict access + retention). Namespaced telemetry for sensitive domains: `auth.*`, `post.*`, `moderation.*`, `privacy_request.*`, `governance.*`, `donation.*`, `crisis.*`.

## §4 / §9 — ADD: operational SLIs (consistent with the anti-vanity stance)

These measure safety and trust, not engagement, and so belong with the §4 success metrics:
- **Crisis-CTA render success** (the affordance is always reachable)
- **Deletion-queue age** and **export fulfillment time** (rights workflows actually work)
- **Moderation time-to-first-review** and **escalation rate** (safety ops are real)
- **Auth success rate** and **post-publish success rate** (the product feels usable)

## §15 — ADD growth-trigger thresholds (refines Phase 6)

Launch stays a **managed modular monolith**, solo-maintainable, ~$0–25/mo. Add infrastructure only on measured pain, in this order:
- **Read replicas** when read latency on public/feed paths degrades under load — and only for read-tolerant paths, never for rights-sensitive or read-your-write workflows (replicas are asynchronous; lag is real).
- **Queue-backed background jobs** when moderation, notifications, exports, or cleanup begin to contend with request paths (Supabase Edge Functions + scheduled jobs cover early needs first).
- **Partitioning + autovacuum tuning** for high-volume append-only tables (audit trail, events) as they grow.
- **Dedicated search** only when PostgreSQL full-text search no longer meets a real product need.
Multi-region and service-splitting are **not** anticipated for this audience and are out of scope unless a future regulatory or scale shift forces them.

---

## Deliberately rejected from the review (recorded for the trail)

- **Subscription / membership / entitlement model** — N/A. OneRhythm is free and ungated; nothing is gated by payment.
- **Multi-region architecture** — out of realistic scope for this audience; de-emphasized.
- **Microservice split / heavy OpenTelemetry+SLO taxonomy at launch** — deferred to growth triggers; over-built for a solo lean launch.

*Tradeoff order is unchanged: safety > access > privacy > genuine governance > sustainability > polish.*
