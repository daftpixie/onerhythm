# OneRhythm — PRD v1.0, Amendment 2
## Community Media Uploads (Images & GIFs)

**Status:** Authoritative addendum to OneRhythm PRD v1.0. Read alongside PRD v1.0 and Amendment 1.
**Origin:** Founder product decision (2026-07): community discussions gain media
upload parity with genre platforms (Reddit-class), scoped to images and GIFs,
under a defense-in-depth safety pipeline. Founder decisions recorded: images +
GIFs only · 5 MB cap · post-then-review moderation.
**How to read this:** each block names the PRD section it modifies. "Replace" =
supersede the named text. These are clean drop-in blocks, not redlines.

---

## Summary of what changes — stated honestly

The PRD's original guarantee was structural: **no upload surface exists**, so no
medical data can be stored, leaked, or breached. This amendment converts that
guarantee from *impossible* to *moderated* for one category (images/GIFs), and
is honest about the consequence: a permanently nonzero rate of medical images
will reach storage, and the platform's job becomes keeping that rate near zero
and the response fast. Documents, PDFs, and video remain **blocked forever** —
the structural guarantee stands for everything except images.

**Sequencing gate (binding):** this feature MUST NOT ship before the Phase 2
moderation core (queue, console, tiering, audit trail, report flag). Every
branch of the pipeline below terminates in a moderation queue; without one, the
pipeline is an unread inbox. Designated build slot: **Phase 2M**, immediately
after the Phase 2 moderation core.

---

## §2.2 / §8 — REPLACE the upload-blocking language

Replace "Block document/image uploads that could contain medical records" with:

- **Documents, PDFs, office files, archives, and video are blocked — permanently.**
  Medical *records* live in documents; no legitimate community need exists for
  them; the structural no-upload guarantee stands for these categories.
- **Images and GIFs are permitted in posts and comments**, subject to the §7.9
  pipeline. Rationale: peer communities bond over ordinary life imagery (pets,
  gardens, milestones, the post-ablation hike); excluding all media isolates the
  platform from genre norms without a proportional safety gain, provided the
  pipeline below is in force.
- The prohibition that matters most is unchanged and restated: **no medical
  imagery** — ECG strips, telemetry/monitor photos, wearable-app screenshots,
  lab results, imaging, medication labels with personal info, or anything
  displaying an identifiable person's health data.

## §7 — ADD "7.9 Media pipeline (defense in depth, in order)"

1. **Client friction.** Before the first upload in a session (and periodically),
   a plain-language interstitial: *"Please don't share medical images — ECG
   strips, monitor photos, lab results, or anything showing health information.
   This is peer support, not diagnosis."* Accept to proceed. Composer copy
   reinforces it inline.
2. **Synchronous server processing (pre-publish, blocking):**
   - **Re-encode every image** (decode → re-render → re-compress). This
     destroys embedded payloads/steganography and normalizes formats.
   - **Strip ALL EXIF/metadata** — GPS coordinates in a vulnerable population's
     photos are a standing privacy incident; nothing survives except pixel data
     and orientation.
   - **5 MB cap post-re-encode** (founder decision). Oversize → downscale to
     fit or reject with plain-language guidance.
   - Formats: JPEG/PNG/WebP in; animated GIF preserved as GIF/animated-WebP.
     SVG is rejected (script surface).
   - **CSAM hash-scan (blocking — the one pre-publish content gate).** Hash-
     match → never published, preserved for legal process, reported per NCMEC
     obligations. Post-then-review cannot and does not apply here. Use
     Cloudflare's CSAM scanning tool or equivalent.
3. **Publish immediately** (founder decision: post-then-review, Reddit-parity).
4. **Async medical-media classifier (post-publish).** A vision classifier tuned
   for the distinctive signatures of ECG strips, telemetry screens, wearable-app
   captures, and lab-report layouts. High-confidence hits auto-enqueue to the
   moderation queue at **Tier-3 priority** with a dedicated time-to-review SLI;
   the item stays live pending human review (post-then-review honored), except
   the moderator console gains a one-tap "remove + notify with the no-medical-
   imagery explanation" action. Classifier thresholds are tunable; false-
   positive rate is monitored (the §4 false-removal metric extends to media).
5. **Community as final classifier.** The ⚑ report flag — deferred in Phase 1D
   as a false affordance without a queue — becomes **mandatory** on every post,
   comment, and image, shipping with the Phase 2 core as planned. Media reports
   route with an "appears to contain medical/health imagery" reason code.
6. **The safety floor closes the loop (unchanged, restated):** even when a
   medical image slips through, *responses interpreting it* are Tier-3
   violations removed by policy regardless of votes. Detection handles the
   upload; the safety floor handles the conversation around it.

**GIF presentation rule (Brand v2 §5 conflict, resolved):** GIFs never autoplay.
They render as a still first frame with an explicit tap/click-to-play control
(icon + text), stop on tap, and are fully inert under `prefers-reduced-motion`.
Autoplaying looped motion in a feed is exactly the ambient-motion signal Brand
v2 prohibits for a population managing cardiac fear. Capability parity, calm
presentation.

**Accessibility:** the composer prompts for alt text on every image (encouraged,
plain-language explanation of why, not blocking); images without alt text get a
neutral generated fallback. Tap-to-play controls meet target-size and label
rules.

## §12.1 — ADD to the data model (Phase 2M migration)

- `media` (id, owner_id, post_id NULLABLE, comment_id NULLABLE — CHECK exactly
  one parent, storage_path, mime_type, bytes, width, height, alt_text,
  moderation_state [published / flagged / removed], classifier_score NULLABLE,
  created_at). RLS default-deny; explicit grants per ADR 0005 (a new table adds
  its own grants deliberately — the tripwire and grants posture apply).
- Supabase **Storage bucket** with RLS mirroring the media table's access;
  owner-write, published-read follows post visibility.
- **Deletion cascade extends to storage objects:** "delete my data" must delete
  files, not just rows. The pgTAP deletion-cascade crown-jewel suite grows
  assertions for `media` rows AND storage-object removal. Any change to the
  upbeats/no-downvote suites is out of scope for this amendment.

## §13 — REPLACE the attack-surface line from Amendment 1

Amendment 1 stated "uploads are already blocked by data minimization, so they
are not an attack surface." **Superseded for images:** the upload endpoint IS
now an attack surface. Mitigations: mandatory re-encode (neuters image-parser
and payload attacks), strict MIME + magic-byte validation, per-member and
per-IP upload rate limits, size caps enforced server-side, no user-controlled
paths, bucket isolation, and the upload endpoint joins the §13 resource-budget
rate-limit list. Document/video/SVG rejection remains structural.

## §16 — ADD legal-review scope (attorney checklist grows)

- **DMCA:** designated-agent registration with the Copyright Office and a
  takedown process (user-uploaded media makes this mandatory).
- **CSAM/NCMEC:** reporting obligations, preservation procedures, and the
  scanning posture, reviewed by counsel.
- **Privacy policies (MHMDA/HBNR/GDPR):** language acknowledging user-posted
  images *may incidentally contain* health information despite prohibition and
  pipeline; retention, removal, and rights-handling for such incidents.
- **ToS/content license:** the license members grant for hosting/display of
  uploaded media; the no-medical-imagery rule as an enforceable term.

## §4 / Amendment 1 SLIs — ADD

- **Media classifier time-to-human-review** (Tier-3 priority queue age).
- **Media false-removal rate** (removed then restored on appeal).
- EXIF-strip verification is a release gate (a shipped image retaining GPS
  metadata is a privacy incident, not a bug).

## Cost model note

The scaling model's egress/storage assumptions (text-only, ~10 MB/MAU/mo) are
superseded at Phase 2M: image communities run ~50–150 MB/MAU/mo egress plus
storage accrual. At 50k MAU the backend line moves from ~$40 toward
~$150–400/mo depending on cap discipline and cache hit rate. The transparency
page will show the jump — which is what it's for.

## Deliberately unchanged (recorded so no one "helpfully" drifts them)

- No documents, PDFs, office files, archives, or video — ever.
- No ECG interpretation anywhere, by anyone, including of uploaded images.
- Upbeats-only; one-equal-vote; the safety floor; data minimization for all
  structured data (no clinical fields).
- Journey pages, DMs (none exist), and profile avatars are NOT in this
  amendment's scope; avatars may be proposed separately under the same pipeline.

*Tradeoff order unchanged: safety > access > privacy > genuine governance >
sustainability > polish.*
