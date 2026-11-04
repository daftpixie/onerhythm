---
name: privacy-compliance
description: Triggers on data-model, consent, analytics, AI, member-support, or moderation-data work. Enforces data-minimization, the privacy floor, consent-ledger, processor, and third-party-leak rules.
---

# Privacy Compliance Checklist

Apply this checklist to any change touching data models, consent flows, analytics,
AI features, moderation data, or member-support/payment integration. Source of
truth: `.claude/rules/privacy.md` and the privacy floor in
`.claude/rules/governance.md` (never votable).

## Data minimization
- [ ] Only stores: account, role, self-ID tags, content, votes, journey pages,
      and — under its own consent, once built — the Visit Prep journal.
- [ ] No structured clinical fields (diagnosis, medication, lab, ECG) anywhere.
- [ ] No inbound clinical integration (no FHIR reads, no device/record import).
- [ ] Member free text in the journal is treated as health data, all of it.
- [ ] Documents/PDFs/video blocked permanently; images only via the Amendment 2
      §7.9 pipeline (Phase 2M). No medical imagery, ever.

## Health data (self-ID, journal, action record, Hub seats, consent state)
- [ ] Opt-in with its own consent purpose, UNCHECKED by default.
- [ ] Never required to participate in any feature.
- [ ] Never sold. Shared only at the member's own action, with a contracted
      processor (one of the two paths below), or under a valid legal order or
      reporting duty — counted publicly.
- [ ] Infrastructure processors (hosting, database, email, captions,
      telephony), all five: written contract, no use of its own, no training
      on member content, stated retention, subprocessor-inventory entry.
      Live captions also keep no recording or transcript (floor item 10).
- [ ] AI providers: all five above, PLUS only on a consented,
      member-initiated request, PLUS everything ADR 0017 Decision 4 requires
      (recorded executed terms, policy version bump, DPIA before first call).
- [ ] Never joined to Stripe/member-support data.

## Visit Prep (when built)
- [ ] Journals in separate owner-only tables, no publish column, never
      `journey_entries`; no moderator/admin/professional/coach policy on them.
- [ ] No uploads into Visit Prep; record-like pasted text warned and excluded
      from AI requests; the AI never fills structured clinical sections.
- [ ] Journal text reaches an AI provider only on a member-started request
      under a current `visit_prep_ai` consent.
- [ ] `has_current_health_consent` takes a purpose argument.
- [ ] service_role access to journals is break-glass: operator, time, table,
      row count logged.

## AI and processors
- [ ] AI is optional, disclosed, and behind its own consent.
- [ ] Hosted AI only after the operator records executed terms: no training,
      stated retention. Subprocessor entry, policy version bump, DPIA first.
- [ ] No member content in logs, traces, error reports or AI memory.
- [ ] AI-provider hosts only inside the AI gateway module (guarded).

## Third-party isolation
- [ ] No ad/tracking pixels on health or authenticated routes (guarded, incl.
      Edge Functions).
- [ ] No third-party analytics at all on Visit Prep, Hub, caregiver-access or
      share-viewer routes, including host-injected beacons.
- [ ] Analytics are cookieless, PII-free, never tagged with any health data.
- [ ] FTC HBNR: any disclosure of health data outside the three exceptions above
      (member's own action, a contracted processor meeting its path — and for an
      AI provider only a consented member-initiated request — or a valid
      legal order) is a reportable breach.

## Consent and deletion
- [ ] Consent is a versioned ledger: who, what, policy_version, granted_at, withdrawn_at, source.
- [ ] NOT a boolean checkbox state.
- [ ] Deletion cascades to backups, replicas, and subprocessors. Any shortfall
      (backup window, processor retention) needs counsel and a recorded
      decision; until then, the full cascade is required.
- [ ] Every member-linked table is in the export and the deletion-cascade tests.
- [ ] Audit/provenance logs carry no member identifiers.
- [ ] Live sessions are never recorded (privacy floor item 10).

## Regulatory
- [ ] Washington MHMDA: standalone Consumer Health Data Privacy Policy; explicit opt-in; separate consent to collect and to share; access/deletion/withdraw rights; no sale.
- [ ] CCPA/CPRA + GDPR: sensitive-category handling; rights fulfillment; honor Global Privacy Control.

## Gate
- [ ] Deletion cascade proven by test.
- [ ] Privacy reviewer subagent invoked and PASS confirmed.
