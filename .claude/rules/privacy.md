# Privacy & compliance rules

Sources: PRD v1.0 §8 as amended by Amendments 1–3; ADR 0017 (accepted
2026-10-28). The privacy floor itself is in `.claude/rules/governance.md`; it is
never votable.

- Data minimization is a feature. Store only: account, role, self-ID tags,
  content, votes, journey pages, and — only under its own consent, once built —
  the Visit Prep journal.
- **No clinical records — the testable rule** (ADR 0017 Decision 3; Amendment 3
  §2.2):
  - no structured clinical fields anywhere (no diagnosis, medication, lab or
    ECG fields); the AI never fills structured clinical sections;
  - no inbound clinical integration (no FHIR reads, no device or record
    import, no uploads into Visit Prep);
  - member-authored free text is consumer health data that may incidentally
    contain clinical detail; the whole journal is treated as health data;
    record-like pasted text gets a warning and is excluded from AI requests.
- **"Health data" means all of it:** health self-ID tags, the Visit Prep journal
  and anything made from it, the action record, Hub seats, and consent state.
- Health self-ID (diagnosis/symptom tags, physical and psychological) is
  opt-in, separate consent, UNCHECKED by default, never required to participate.
  The same holds for every later health-data purpose (`visit_prep_journal`,
  `visit_prep_ai`, and each purpose named in its own ADR).
- **Health data is never sold.** It is never shared, except: at the member's own
  request (print, PDF, a share link, a caregiver grant — each the member's own
  action); with a processor that works only for us, with no use of its own,
  under written contract (the two processor paths are in the HBNR bullet
  below); or where a valid legal order or reporting duty requires it.
  Disclosures and holds under legal orders are counted in a public report, as
  far as the law allows.
- **FTC Health Breach Notification Rule:** disclosing health data to any third
  party (ad, analytics, anything else), other than as the sharing bullet above
  permits, is itself a reportable breach; counsel confirms reporting duties.
  There are two processor paths:
  - **Infrastructure processors** (hosting, database, email delivery, live
    captions, telephony) run the service for us. Each needs all of: a written
    contract, no use of its own, no training on member content, stated
    retention, and an entry in the subprocessor inventory. A live-caption
    processor also keeps no recording or transcript (privacy floor item 10,
    by operator attestation). They receive only what running the service
    needs, and are not tied to a single member request, because running the
    service is their job.
  - **AI providers** need all of the above, PLUS: only on a consented,
    member-initiated request (privacy floor item 5), and everything ADR 0017
    Decision 4 already requires. The reference AI gateway does not enable a
    hosted provider until the operator records that its executed terms prohibit
    training and state retention; on-device and self-hosted models are exempt.
    A subprocessor inventory entry, a privacy-policy version bump and a DPIA
    come before the first call.
- **No ad/tracking pixels on health or authenticated pages — ever.** No
  third-party analytics of any kind (cookieless or not, including host-injected
  beacons) on Visit Prep, Hub, caregiver-access or share-link viewer routes.
  The guard catches known ad and tracker hosts referenced in code. It is not
  route-aware and does not list the cookieless analytics allowed on public
  pages, so keeping any analytics off these routes is checked in review, and a
  beacon a host injects outside the code (for example, a hosting platform's
  analytics toggle) is checked in the host's settings.
- **No inbound clinical integration.** AI-provider hosts and SDKs appear only in
  the AI gateway module (guarded: `no-thirdparty-on-health.sh`).
- **No member content in logs, traces, error reports or AI memory.** AI
  provenance records model, version and time bucket only.
- **Live sessions are never recorded** (privacy floor item 10): no audio, video
  or transcript is kept by us or by any processor.
- Washington MHMDA: standalone Consumer Health Data Privacy Policy; explicit
  opt-in; separate consent to collect and to share; processor contracts;
  access/deletion/withdraw rights; no sale.
- CCPA/CPRA + GDPR: sensitive-category handling; rights fulfillment; honor Global
  Privacy Control; consider geo-gating non-primary markets at launch.
- **Stripe data is NEVER joined to any health data** (self-ID, journal, action
  record, consent state). The action record is never used to ask for
  contributions.
- Consent is a versioned ledger (who/what/policy-version/when/withdrawal), not a
  checkbox state. Deletion must cascade to backups, replicas, and subprocessors.
  A published backup window or processor retention period that falls short of
  this needs counsel's review and a recorded decision before it is relied on
  (Amendment 3 §7.10.8); until then, this line governs.
- Uploads: documents/PDFs/office files/archives/video are blocked PERMANENTLY
  (medical records live in documents). Images/GIFs are permitted ONLY through
  the PRD Amendment 2 §7.9 defense-in-depth pipeline (re-encode, strip ALL
  EXIF/metadata, moderation queue), shipping at Phase 2M after the Phase 2
  moderation core — no upload surface exists before that. No medical imagery,
  ever.
