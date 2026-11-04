# ADR 0007 — Proposed PBC conversion, transparency posture, and recognition-only badges

Status: Accepted as product intent; legal conversion not filed (status corrected 2026-09-26)
Date: 2026-07-08
Relates: PRD §5 (transparency by default), §6.5 (one equal vote), §10
(funding posture); Amendment 1 (no-entitlement rule); CLAUDE.md entity line.

## Decision

**OneRhythm is a VT Infinite, Inc. initiative.** A Delaware Public Benefit
Corporation conversion is proposed and drafted but **has not been filed**.
The original 8 July decision expressed intended posture, not a completed legal
status. Counsel must confirm the public-benefit statement, filing, and trade-name
language before external agreements or launch.

**501(c)(3) status is deliberately NOT pursued.** Not deferred — declined.
Radical transparency, not tax status, is the trust mechanism.

## Consequences (bind all future work)

1. **No Stripe nonprofit rate.** Payment costs are modeled at standard rates
   (Phase 4).
2. **Apple's nonprofit in-app fundraising carve-out never applies.**
   Link-out-to-web member support is PERMANENT, not a workaround we grow out
   of. Mobile apps ship free with no in-app fundraising UI, ever.
3. **Contributions are NOT tax-deductible**, and every support surface must
   say so plainly — one honest sentence, not fine print.
4. **Vocabulary: "member support" / "contributions" — never "donations."**
   "Donation" implies charitable deductibility we don't have.
5. **Open books are structural as a design goal.** The ledger is currently in
   a private repository, so it is not public reporting. If PBC conversion is
   filed, counsel will confirm the applicable benefit-report obligations. An
   annual public report remains the intended higher standard.
6. **Supporter badges (later, Phase 4+) are RECOGNITION ONLY — never
   governance power.** One-equal-vote with participation-based eligibility is
   unchanged (PRD §6.5; Amendment 1's no-entitlement rule). The 65+/
   fixed-income baseline member is the reason: support must never buy a
   louder voice than theirs.

## Vocabulary-shift checklist ("donat" audit, 2026-07-08)

- `app/` and `src/`: **zero occurrences** — no shipped copy needs changing.
- Spec/reference docs still using "Donate/donations" (update opportunistically;
  they are not member-facing): PRD §10 & wireframes B4 sidebar "[ ♥ Donate ]",
  B11 "Donate / Support", C9 donation link-out note; CLAUDE.md "donation-funded"
  phrasing and non-negotiable 7 "launching donations"; .claude/rules/db.md "no
  payment/entitlement tables — donations are voluntary and ungated."
- Phase 4 (support checkout) must launch with the new vocabulary from day one.

## Notes

- Annual public reporting is the intended commitment, subject to verified
  entity status, accurate figures, and counsel review.
- Nothing in this ADR changes governance, data, schema, or RLS.