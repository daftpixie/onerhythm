# OneRhythm — Wireframes, Addendum A
### New screens from the compliance & safety hardening review

**Companion to:** OneRhythm Wireframes (PRD v1.0) and PRD v1.0 Amendment 1.
**Legend (unchanged):** `[ Button ]` · `( ) radio` · `[ ] checkbox` · `▸` expandable · `♥ Upbeat` · `⚑` report · `✔ Verified` · `⟳` realtime · `≡` menu · `🆘` crisis affordance
**Design constants (unchanged, from Brand Guidelines v2 / PRD §9):** white background, body ≥16–18px, Atkinson Hyperlegible / Inter, contrast ≥4.5:1, 44px primary targets, visible focus, plain language, icon **+** text labels, 🆘 reachable everywhere.

> These screens close three gaps the review found: a high-stakes **deletion** flow needs an explicit confirmation; ongoing **consent** needs a management/withdraw surface (not just initial opt-in); and **moderators** need a real console (the PRD has admin routes but no member-visible wireframe).

---

## B13 / C10 — Account & data deletion (confirmation)

Reached from Profile → "Delete my account" (web B-sidebar / app "Me" tab, C9). Deletion is irreversible and must say exactly what happens, in plain words.

```
┌──────────────────────────────────────────────────────────┐
│  Delete your account and data                       🆘     │
├──────────────────────────────────────────────────────────┤
│  This is permanent. We can't undo it.                      │
│                                                            │
│  When you confirm, we delete:                              │
│   • your account and sign-in                               │
│   • your posts, comments, and upbeats                      │
│   • your journey pages                                     │
│   • your diagnosis/symptom self-ID tags                    │
│   • your consent records and votes                         │
│                                                            │
│  How it works:                                             │
│   • Most data is removed right away.                       │
│   • Copies in our backups are removed within 30 days.      │
│   • We'll email you when it's fully done.                  │
│                                                            │
│  Want a copy first?                                        │
│   [ Download my data ]   (you can do this before deleting) │
│                                                            │
│  Type DELETE to confirm:                                   │
│   ┌────────────────────────────┐                          │
│   │                            │                          │
│   └────────────────────────────┘                          │
│                                                            │
│   [ Permanently delete my account ]   ← Destructive        │
│   [ Cancel ]                                               │
│                                                            │
│  ⓘ Voting/treasury records you took part in are kept in    │
│     anonymized, aggregate form for transparency — your     │
│     name is removed. [ How this works ]                    │
└──────────────────────────────────────────────────────────┘

   After confirm:
   ┌──────────────────────────────────────────────┐
   │  Deletion started.                            │
   │  You're signed out now. We'll email           │
   │  d•••@•••.com when it's fully complete.       │
   └──────────────────────────────────────────────┘
```
**Notes:** Type-to-confirm prevents accidental deletion (still WCAG-accessible: paste allowed, label visible, no time limit). Export offered inline (MHMDA/GDPR/CCPA portability). The aggregate-transparency note resolves the tension between deletion rights and the governance model's permanent public tallies — names are stripped, the vote count remains. Backs the §12.1 `consent_records` + deletion-cascade test.

---

## B14 / C11 — Consent management & withdrawal

Reached from Profile → Settings → "Diagnosis & privacy." Lets a member see and change every consent at any time — the ongoing counterpart to the onboarding opt-in (B3/C3).

```
┌──────────────────────────────────────────────────────────┐
│  Your data & consent                                🆘     │
├──────────────────────────────────────────────────────────┤
│  You're always in control. Change any of this anytime.    │
│                                                            │
│  Health self-identification                                │
│   What it's for: suggesting communities you might find     │
│   useful. Never sold. Never shared.                        │
│   Status:  ● On      [ Turn off & remove my tags ]         │
│   Your tags:  AFib · ICD recipient · Anxiety   [ Edit ]    │
│                                                            │
│  Email notifications                                       │
│   Status:  ● On      [ Turn off ]                          │
│                                                            │
│  ──────────────────────────────────────────────────────   │
│  Consent history (what you agreed to, and when)            │
│   ▸ Health self-ID — agreed 12 Apr 2026 (policy v2)        │
│   ▸ Account & community — agreed 12 Apr 2026 (policy v2)   │
│   [ Read our plain-language data promise ]                 │
│                                                            │
│  ──────────────────────────────────────────────────────   │
│   [ Download my data ]     [ Delete my account ]           │
└──────────────────────────────────────────────────────────┘

   Turning off health self-ID:
   ┌──────────────────────────────────────────────┐
   │  Remove your health tags?                     │
   │  We'll delete your diagnosis/symptom tags and │
   │  remove you from tag-based community suggest-  │
   │  ions. Your posts and account stay.           │
   │   [ Remove my tags ]   [ Keep them ]          │
   └──────────────────────────────────────────────┘
```
**Notes:** Withdrawal is one tap and is honored (writes a `withdrawn_at` to the consent ledger; triggers tag deletion). Consent history shows the policy version agreed to — the versioned-consent requirement made visible. No dark patterns: "turn off" is as easy as "turn on."

---

## B15 — Moderator console (web; elected moderators / stewards only)

Internal surface behind `/admin/moderation`. Not visible to ordinary members. Built as a first-class moderation domain, not an afterthought.

```
┌───────────────┬────────────────────────────────────────────────────────┐
│ MOD NAV       │  Moderation queue                          ⟳ live        │
│               │  Filter: (•) Open  ( ) Escalated  ( ) Closed             │
│ ⚑ Queue (7)   │  Sort: Oldest first ▾                                    │
│ ⛏ Escalated(2)│ ─────────────────────────────────────────────────────    │
│ 📜 Audit log  │  ┌────────────────────────────────────────────────────┐ │
│ 🛡 Safety floor│  │ ⚑ SAFETY-FLOOR (Tier 3) · auto-flagged             │ │
│ 👤 Members    │  │ Possible self-harm signal in r/General             │ │
│               │  │ → routed to human review · NOT votable             │ │
│ ───────────   │  │ Reporter: system · Subject: (member)               │ │
│               │  │ [ Open ]   ⏱ waiting 4 min                          │ │
│               │  └────────────────────────────────────────────────────┘ │
│               │  ┌────────────────────────────────────────────────────┐ │
│               │  │ ⚑ MEDICAL-MISINFO (Tier 3) · 2 reports             │ │
│               │  │ "stop your blood thinner, try…"                    │ │
│               │  │ [ Open ]   ⏱ waiting 22 min                         │ │
│               │  └────────────────────────────────────────────────────┘ │
│               │  ┌────────────────────────────────────────────────────┐ │
│               │  │ ⚑ TONE / OFF-TOPIC (Tier 1 appeal-eligible)        │ │
│               │  │ Comment in r/AFib · 1 report                       │ │
│               │  │ [ Open ]   ⏱ waiting 3 h                            │ │
│               │  └────────────────────────────────────────────────────┘ │
└───────────────┴────────────────────────────────────────────────────────┘

   Item detail ([ Open ]):
┌──────────────────────────────────────────────────────────┐
│ ← Queue        MEDICAL-MISINFO · Tier 3 (safety floor)    │
│                                                            │
│ Content:  "stop your blood thinner, try…"                  │
│ In: r/AFib · by (member) · 22 min ago                      │
│ Reports (2):  "dangerous advice" · "this could kill someone"│
│                                                            │
│ Tier 3 means this is decided by policy, not a vote.        │
│                                                            │
│ Action:                                                    │
│  ( ) Remove (safety floor)   ( ) Add context label         │
│  ( ) Escalate to steward     ( ) No action                 │
│  Reason (required, logged):                                │
│  ┌────────────────────────────────────────────┐           │
│  └────────────────────────────────────────────┘           │
│  [ Apply action ]                                          │
│                                                            │
│  If self-harm: [ Send crisis resources to member ]         │
│  ⓘ Every action is written to the immutable audit log.     │
└──────────────────────────────────────────────────────────┘
```
**Notes:** Items are classified by governance tier (1/2/3) on arrival so the console makes the safety-floor / votable distinction explicit. Tier-3 items are never routed to a vote. A reason is required and every action is appended to the immutable audit trail (PRD §12.1 `moderation_actions`). Borderline health claims offer "add context label" before removal (Community-Notes-style middle path). Self-harm has a one-tap resource-send and is handled by humans, never a vote. Queue age (⏱) is the moderation time-to-first-review SLI made visible to the people who own it.

---

# Updated component inventory (additions)
- `DeletionConfirm` (type-to-confirm, export-first, plain-language "what gets deleted")
- `ConsentManager` (per-purpose toggle + withdraw + versioned consent history)
- `ModerationConsole` · `ModerationItemDetail` (tier-classified, reason-required, audit-logged)

> All three ship against the Brand Guidelines v2 light token set and WCAG 2.2 AA, covered by the `a11y-reviewer` and `privacy-reviewer`/`governance-reviewer` subagents and the `axe` CI hook before merge.
