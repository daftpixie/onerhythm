# OneRhythm — Wireframes, Addendum B
### Visit Prep, the crisis nudge, caregiver access, and the Hub

**Companion to:** [PRD v1.0 Amendment 3](OneRhythm_PRD_v1.0_Amendment_3.md)
(§7.10 Visit Prep, §7.11 the Hub), the vision document §5.4–§6.2, and
[Brand Guidelines v3.1 Addendum](../brand/OneRhythm_Brand_Guidelines_v3.1_Addendum.md).
**Status:** Design targets for **planned** features. Nothing here is built.
Every screen is gated by Amendment 3's binding gates (legal review, safety case,
rule-file changes, and — for AI screens — the AI test suite, processor contract
and the advisory group's check).
**Legend (unchanged):** `[ Button ]` · `( ) radio` · `[ ] checkbox` · `▸`
expandable · `🆘` crisis affordance · `ⓘ` information. New: `┃` a thick left rule
marking AI-organized text (see Brand v3.1 Addendum §1).
**Design constants (unchanged, from Brand v3 / PRD §9):** white background, body
≥16–18px, Atkinson Hyperlegible, contrast ≥4.5:1, 44px primary targets, visible
focus, plain language, icon **+** text labels, 🆘 reachable on every screen,
consent boxes unchecked by default.

**Rules every screen below follows** (from a11y review, round 1):

- **🆘 is the labelled help control, "🆘 Need help right now?"** (v3 §7), drawn
  as `🆘` only to save width in these drawings. In the build, the visible words
  stay at every width, including 320px reflow and 400% zoom; it is never
  icon-only.
- **Bars of controls wrap, never clip.** At 320px reflow and 400% zoom, a row
  of controls (such as the Hub session bar, B25) wraps onto more lines, and
  its full height counts toward the space reserved so focus is never hidden. It sits fixed in the app header on **every
  on-screen state** — screens, panels, dialogs, the step-by-step views, and the
  clinic's share-link viewer page — whether or not a panel drawing repeats it.
  It is absent only from paper and PDF output. A failure to render it is a
  safety incident, not a UI bug (`.claude/rules/a11y.md`).
- **No text smaller than 16px**, except the 14px disclaimer band (v3 §4).
- **Checkbox and radio rows are at least 44px tall**, with the label inside the
  hit area. Destructive actions ("Delete") are separated from other actions by
  at least 8px and always use the word.
- **One exception to "unchecked by default":** the share-link passcode box (B21)
  is on by default because it is a protection, not a consent.
- **Redundant entry (SC 3.3.7):** nothing already given in the same flow is
  asked for again. Drafts survive interruption — the crisis nudge, a timeout,
  "Go back".
- **Every time shown carries its time zone** in its own text (for example
  "2:00–3:00pm Eastern"), in the member's chosen zone, because a screen reader
  may read a time out of context. Drawings below show the zone only where
  space allows.

> Placeholders in `{braces}` are values a deployment fills in — the AI provider's
> name and what it keeps, the backup window, the dial-in number. They are never
> shipped as braces, and never guessed.

---

## B16 / C12 — Turn on Visit Prep (journal consent)

Reached from Me → "Visit Prep". The first time, the member sees this, not an
empty journal.

```
┌──────────────────────────────────────────────────────────┐
│  Visit Prep                                         🆘     │
├──────────────────────────────────────────────────────────┤
│  A private place to jot down how you've been, so you      │
│  can bring better questions to your next appointment.     │
│                                                            │
│  What to know first                                        │
│   • It's off until you turn it on. You don't need it to   │
│     belong here.                                           │
│   • What you write is treated as health information.      │
│   • No moderator, coach or other member can open it.      │
│   • Our staff can unlock it, but only in a real           │
│     emergency or when a valid legal order requires it.    │
│     Every time is logged. Private vault mode means we     │
│     can't read it at all.                                  │
│   • It doesn't diagnose or give medical advice.           │
│   • Please don't paste in medical records or test         │
│     results. Write in your own words.                     │
│   • You can delete any entry, or all of it, any time.     │
│                                                            │
│   [ ] Turn on my Visit Prep journal                        │
│       (This is a separate choice from anything else       │
│        you've agreed to.)                                  │
│                                                            │
│   [ Save my choice ]        [ Not now ]                    │
│                                                            │
│   ▸ Read exactly what we store and why                     │
│   ▸ Private vault mode (we can't read it at all)           │
└──────────────────────────────────────────────────────────┘
```

**Notes:** Writes a `visit_prep_journal` row to the consent ledger with the
policy version. The box is unchecked; "Save my choice" with the box empty saves
nothing and returns to Me. AI is **not** mentioned as part of this choice — it is
a second consent (B18). The vault-mode expander states, before the choice, that
vault mode turns off AI help, share links we create and caregiver access, and that
a lost key cannot be recovered.

---

## B17 / C13 — The journal

```
┌──────────────────────────────────────────────────────────┐
│  My Visit Prep journal                              🆘     │
├──────────────────────────────────────────────────────────┤
│  Private to you.   ▸ Who could ever see it?               │
│                                                            │
│   [ ✎ Write a new entry ]                                  │
│                                                            │
│  Not sure what to write? Some prompts:                     │
│   ▸ How has my body felt this week?                       │
│   ▸ How has my mind felt — worry, mood, sleep?            │
│   ▸ What happened that I want to remember?                │
│   ▸ What do I want to ask?                                │
│                                                            │
│  ──────────────────────────────────────────────────────   │
│  Your entries                                              │
│   Wed 14 Oct   "Woke up at 3am again, heart racing…"       │
│                [ Open ]  [ Delete ]                        │
│   Sun 11 Oct   "Good walk with Rosa. Felt more like…"      │
│                [ Open ]  [ Delete ]                        │
│                                                            │
│  ──────────────────────────────────────────────────────   │
│   [ Get ready for a visit ]     [ Print a blank template ] │
│   ▸ Settings: AI help · caregiver access · turn off       │
└──────────────────────────────────────────────────────────┘

   Writing an entry:
   ┌──────────────────────────────────────────────┐
   │  New entry · Wed 28 Oct                🆘    │
   │  ┌────────────────────────────────────────┐  │
   │  │                                        │  │
   │  └────────────────────────────────────────┘  │
   │   [ Save entry ]   [ Cancel ]                │
   └──────────────────────────────────────────────┘

   If pasted text looks like a medical record:
   ┌──────────────────────────────────────────────┐
   │  ⓘ This looks like it might be copied from    │
   │  a medical record or test result.             │
   │  We ask you not to store records here. If you │
   │  keep it, it will be left out of any AI help. │
   │   [ Remove it ]   [ Keep it in my words ]     │
   └──────────────────────────────────────────────┘
```

**Notes:** No fields for diagnosis, medicines or results — one free-text box.
Silence is never read as meaning: there is no streak, no "you haven't written in a
while", no reminder that implies a gap matters. "Get ready for a visit" works
without AI (it opens a printable template with the member's own entries); AI is
offered there only if `visit_prep_ai` is current. The record warning is
best-effort and says what happens; it never blocks saving.

---

## B18 / C14 — Turn on AI help (second consent, with a data preview)

Reached from the journal's Settings, or the first time the member chooses
"Organize with AI" in B19.

```
┌──────────────────────────────────────────────────────────┐
│  AI help for Visit Prep                             🆘     │
├──────────────────────────────────────────────────────────┤
│  AI help is optional. Visit Prep works fully without it.  │
│                                                            │
│  What it does                                              │
│   It sorts your own words into a short summary and        │
│   suggests ways to word your questions.                   │
│                                                            │
│  What it never does                                        │
│   It doesn't diagnose, say what's causing a symptom,      │
│   score anything, or give medical advice. It isn't a      │
│   therapist or a friend to talk to.                       │
│                                                            │
│  Who runs it                                               │
│   {Provider name}, working for us under a contract.       │
│   They may not train on what you send.                    │
│   What they keep: {retention, from the signed terms}.     │
│                                                            │
│  What leaves your device — an example                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Only the entries you pick, only when you press      │  │
│  │ "Send". For example, one entry would go as:         │  │
│  │                                                     │  │
│  │  "Woke up at 3am again, heart racing. Couldn't get  │  │
│  │   back to sleep. Worried about Thursday."           │  │
│  │                                                     │  │
│  │ We try to remove names, phone numbers and emails    │  │
│  │ first. That can miss things, so you see the exact   │  │
│  │ text before anything is sent.                       │  │
│  │ Not sent: your name, your email, your other         │  │
│  │ entries, your community posts, your health tags.    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│   [ ] Turn on AI help for Visit Prep                       │
│   [ Save my choice ]        [ Not now ]                    │
│                                                            │
│  You can turn this off any time in Settings.              │
└──────────────────────────────────────────────────────────┘
```

**Notes:** Writes a `visit_prep_ai` consent row. The provider name and retention
come from the operator's recorded attestation (Amendment 3 §7.10.9); if none is
recorded for a hosted provider, this screen is not reachable and AI help is not
offered. The example uses the member's own most recent entry where one exists, so
the preview is real, not generic. Because AI consent does not exist yet, this
example is made on the member's device, with no call to the gateway. The "Not sent" list is what the gateway is
built to exclude; it is shown so the member does not have to infer it.

---

## B19 / C15 — Get ready for a visit (pick, preview, send)

```
┌──────────────────────────────────────────────────────────┐
│  Get ready for a visit                              🆘     │
├──────────────────────────────────────────────────────────┤
│  Step 1 of 3 — Pick the entries to use                     │
│   [ ] Wed 14 Oct  "Woke up at 3am again…"                  │
│   [ ] Sun 11 Oct  "Good walk with Rosa…"                   │
│   [ ] Fri 2 Oct   "Bad day. Didn't want to…"               │
│                                                            │
│  Step 2 of 3 — How do you want to do it?                   │
│   ( ) On my own, with the printable template               │
│   ( ) Organize with AI                                     │
│                                                            │
│   [ Next ]                                                 │
└──────────────────────────────────────────────────────────┘

   Step 3 (AI chosen) — exactly what will be sent:
   ┌──────────────────────────────────────────────┐
   │  This is what {Provider name} will receive.  │
   │  ┌────────────────────────────────────────┐  │
   │  │ 14 Oct: "Woke up at 3am again, heart   │  │
   │  │  racing. Couldn't get back to sleep.   │  │
   │  │  Worried about Thursday."              │  │
   │  │ 11 Oct: "Good walk with [name          │  │
   │  │  removed]. Felt more like myself."     │  │
   │  └────────────────────────────────────────┘  │
   │  Left out: 1 part that looked like a record.  │
   │   [ Send to AI ]   [ Go back ]               │
   └──────────────────────────────────────────────┘
```

**Notes:** Every entry starts unchecked; step 3 below shows the screen after
the member ticked the first two. The step 3 preview is made by our own gateway,
never the provider, and shows the text after name removal and the length cap; a
test asserts preview and outbound request are identical. "Send to AI" is the
member-initiated request the privacy floor (item 5) requires. Nothing is sent on
any other action, and nothing is sent in the background.

---

## B20 / C16 — The summary, and the print view

```
┌──────────────────────────────────────────────────────────┐
│  Your visit summary                                 🆘     │
├──────────────────────────────────────────────────────────┤
│ ┃ Organized by AI at your request — not reviewed by a    │
│ ┃ clinician                                               │
│ ┃                                                         │
│ ┃ What I noticed                                          │
│ ┃  • 14 Oct: woke up at 3am, heart racing. Couldn't get   │
│ ┃    back to sleep.                                       │
│ ┃  • 14 Oct: worried about Thursday.                      │
│ ┃  • A good walk on 11 Oct; felt more like myself.        │
│ ┃                                                         │
│ ┃ Questions I want to ask                                 │
│ ┃  • What should I do when I wake with my heart racing?  │
│ ┃  • Is there anything that might help me sleep?          │
│                                                            │
│  [ ▸ Show your words (what this was organized from) ]     │
│                                                            │
│   [ ✎ Edit ]  [ Print or save as PDF ]  [ Share ▸ ]       │
│   [ Delete this summary ]                                  │
└──────────────────────────────────────────────────────────┘

   Print / PDF view (large type, one column, black on white):
   ┌──────────────────────────────────────────────┐
   │  Visit notes — {name, only if you add one}    │
   │  Prepared 28 Oct 2026                          │
   │                                                │
   │  What I noticed                                │
   │   • …                                          │
   │  Questions I want to ask                       │
   │   • …                                          │
   │  ─────────────────────────────────────────    │
   │  Written by me. Organized by AI at my request. │
   │  Not reviewed by a clinician. This is not a    │
   │  diagnosis or medical advice.                  │
   └──────────────────────────────────────────────┘
```

**Notes:** The label is the exact string from Brand v3.1 Addendum §1.1, in
sentence case. "Show your words" is a disclosure button that reports whether it
is open (`aria-expanded`). The AI's text never says "you may have", "this suggests", "likely",
"normal" or "nothing to worry about", and never counts entries into trends
("3 times this week") (Brand v3.1 Addendum §1.3). Headings are
narrative only — no "Problems", "Medications" or "Assessment". When the member
edits the summary, the label changes to "Organized by AI at your request, then
edited by you — not reviewed by a clinician." Without AI, the same layout is a
template the member fills in, with no AI label.

---

## B21 / C17 — Make a share link (and QR card)

Planned; needs the share-link ADR first. Not shown in vault mode.

```
┌──────────────────────────────────────────────────────────┐
│  Share this summary with your clinic                🆘     │
├──────────────────────────────────────────────────────────┤
│  Anyone with the link and the passcode can read this      │
│  summary until it ends. Share it the way you would hand   │
│  over paper.                                               │
│                                                            │
│  How long should it work?                                  │
│   ( ) 1 day   ( ) 3 days   ( ) 7 days                      │
│                                                            │
│  What it includes: this summary only — not your journal,  │
│  your name, or anything else.                              │
│                                                            │
│  Passcode  [✓] Use a passcode (recommended)                │
│                                                            │
│   [ Make the link ]          [ Cancel ]                    │
└──────────────────────────────────────────────────────────┘

   After "Make the link":
   ┌──────────────────────────────────────────────┐
   │  Your link is ready.                          │
   │  Ends: Sat 31 Oct, 5:00pm                      │
   │  Passcode: {passcode} (tell it to the clinic   │
   │  separately — don't write it on the card)      │
   │   [ Copy link ]  [ Show QR card ]  [ Print ]  │
   │   [ Turn off this link now ]                  │
   └──────────────────────────────────────────────┘

   QR card (print or show on screen):
   ┌──────────────────────────────────┐
   │  ▓▓▓▓ QR ▓▓▓▓                     │
   │  Visit notes from a patient       │
   │  Ends Sat 31 Oct, 5:00pm Eastern  │
   │  Or type this link:               │
   │  {full link, never shortened}     │
   │  Ask the patient for the          │
   │  passcode.                        │
   └──────────────────────────────────┘
```

**Notes:** The QR image's text alternative is "QR code. The link is printed below
it." The link line is real, selectable text, at least 16px, never truncated, so
nobody needs a camera to open the summary. The passcode box is the one
pre-checked box in this addendum: it is a protection, not a consent, and
Amendment 3 sets it on by default. If the member turns the passcode off, the
warning reads "Anyone with the link can read this summary until it ends", and
the card drops the passcode line. For the share-link ADR (SC 3.3.8): the clinic
can paste the passcode, can choose "Show passcode", and never faces a puzzle;
the passcode is digits or plain words, not case-sensitive. Expiry choices
and passcode length are placeholders; the ADR sets them. Making a link writes
a consent-ledger entry. An expired link's payload is deleted, as a revoked one
is. The card never names a
condition or the member. "Turn off this link now" deletes the payload. The
member's share-link list (in Settings) shows every live link with its end time and
a turn-off button; it does not show who opened it, because no view log is tied to
the member.

---

## B22 / C18 — The crisis nudge (inside the journal)

Shown when a word or phrase from the published list appears while the member is
writing. Best-effort. The 🆘 button is the safety control and stays on every
screen whether or not this appears.

```
┌──────────────────────────────────────────────────────────┐
│  You don't have to carry this alone                 🆘     │
├──────────────────────────────────────────────────────────┤
│  If you're thinking about hurting yourself, or you        │
│  might not be safe, please reach out now.                 │
│                                                            │
│   [ ☎ Call or text 988 ]   (US — Suicide & Crisis         │
│                              Lifeline, any time)           │
│   [ ☎ Emergency: call 911 ] (or your local number)         │
│   [ 🌍 Help outside the US ]                                │
│                                                            │
│   [ Back to my entry ]                                     │
│                                                            │
│  ⓘ This came up because of words on a published list.     │
│    We kept no record of this, and no one was told.         │
└──────────────────────────────────────────────────────────┘
```

**Notes:** Shows resources only. No alert, log, score, review or analytics event.
The member's draft is untouched and still theirs. "Back to my entry" is always
available; the nudge never traps. It does not try to counsel. Region-appropriate
numbers come from the same source as the 🆘 overlay (B12).

---

## B23 / C19 — Caregiver access

Planned; needs the caregiver-delegation ADR first. Not available in vault mode.

```
┌──────────────────────────────────────────────────────────┐
│  Let someone you trust read your visit notes        🆘     │
├──────────────────────────────────────────────────────────┤
│  Who?   Rosa M. — invited by you on 20 Oct                 │
│                                                            │
│  What can they read? (only what you tick)                  │
│   [ ] My visit summaries                                   │
│   [ ] My journal entries                                   │
│                                                            │
│  For how long?  ( ) 2 weeks  ( ) 1 month  ( ) 3 months     │
│  It ends on its own unless you renew it.                   │
│                                                            │
│  Rosa can only read. Rosa can never change your choices,   │
│  turn on AI, share for you, delete anything, or vote for  │
│  you.                                                      │
│                                                            │
│   [ Give access ]            [ Cancel ]                    │
└──────────────────────────────────────────────────────────┘

   Member's view, afterwards:
   ┌──────────────────────────────────────────────┐
   │  Rosa M. can read: visit summaries             │
   │  Ends: 28 Nov                                  │
   │  Last read: Tue 27 Oct, 7:12pm                 │
   │   [ End access now ]   [ Renew ]              │
   └──────────────────────────────────────────────┘
```

**Notes:** "Who" lists only people the member has invited; there is never a
searchable directory of members (the caregiver ADR sets how invites work).
Every grant and every ending writes to the consent ledger. Each use is shown to
the member ("Last read"); that per-grant log is visible only to the member, and
its retention is set in the data inventory. "End access now" is one step. Period choices
are placeholders for the ADR.

---

## B24 / C20 — The Hub: session schedule

Planned (Layer 2); needs the Hub ADR, trained facilitators and a supervising
partner first.

```
┌──────────────────────────────────────────────────────────┐
│  Live group sessions                                🆘     │
├──────────────────────────────────────────────────────────┤
│  Times are shown in your time zone: {Eastern Time}         │
│                                                            │
│  Fri 30 Oct · 2:00–3:00pm                                  │
│   Living with a device                                     │
│   2 trained facilitators · Captions on · Phone dial-in    │
│   [ Save a seat ]                                          │
│                                                            │
│  Tue 3 Nov · 7:00–8:00pm                                   │
│   For caregivers                                           │
│   2 trained facilitators · Captions on · Phone dial-in    │
│   [ Save a seat ]                                          │
│                                                            │
│  ▸ How sessions work (captions, phone, privacy)           │
│  ▸ Reminders: [ ] Remind me 15 minutes before             │
└──────────────────────────────────────────────────────────┘
```

**Notes:** The reminder box is unchecked. Every reminder reads only "Your session
starts in 15 minutes." — never a topic or condition, in email or push. (Text
messages would need a stored phone number; that is for the Hub ADR.) Saved seats
are health data under the Hub's own consent purpose.
"How sessions work" explains captions (who makes them, that no transcript is kept)
before anyone joins.

---

## B25 / C21 — Joining a session (captions, dial-in, audio only)

```
┌──────────────────────────────────────────────────────────┐
│  Living with a device · starts 2:00pm               🆘     │
├──────────────────────────────────────────────────────────┤
│  Captions are on. They're made by {caption service},       │
│  which works for us under a contract and keeps no          │
│  transcript.                                               │
│                                                            │
│  This session is never recorded. No sound, video or        │
│  transcript is kept.                                       │
│                                                            │
│  How do you want to join?                                  │
│   ( ) Video and sound                                      │
│   ( ) Sound only (easier on weak internet)                 │
│   ( ) By phone                                             │
│                                                            │
│  Camera  [ ] On      Microphone  [ ] On                    │
│                                                            │
│   [ Join the session ]                                     │
│                                                            │
│  ┌─ Join by phone ─────────────────────────────────────┐  │
│  │  Call {dial-in number}                               │  │
│  │  Meeting code: {code}                                │  │
│  │  We don't store your phone number. The phone         │  │
│  │  company sees it, as with any call.                  │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

   In the session (bottom bar, every control icon + text):
   [ 🎤 Mute ] [ 📷 Camera ] [ CC Captions: on ] [ ✋ Raise hand ]
   [ 🆘 Need help right now? ] [ Leave ]
```

**Notes:** How captions are consented to is recorded in the Hub ADR (Amendment
3 §7.11). Captions on by default; turning them off is per person and is not
remembered as a health signal. Screen-sharing and file-sharing are absent for
members (not disabled buttons — absent). Camera and microphone start off. The 🆘
control is in the session bar, and facilitators follow a written crisis plan.

---

## B26 / C22 — Turning Visit Prep off

Two steps, so turning it off never deletes anything by surprise.

```
   Step 1
┌──────────────────────────────────────────────────────────┐
│  Turn off Visit Prep?                               🆘     │
├──────────────────────────────────────────────────────────┤
│  If you turn it off, you can't add new entries.            │
│  AI help, caregiver access and share links turn off too.   │
│  Next, we'll offer you a copy and ask before deleting.     │
│                                                            │
│   [ Turn off Visit Prep ]      [ Keep it on ]              │
└──────────────────────────────────────────────────────────┘

   Step 2
┌──────────────────────────────────────────────────────────┐
│  Visit Prep is off                                  🆘     │
├──────────────────────────────────────────────────────────┤
│  Want a copy first?   [ Download my journal ]              │
│                                                            │
│  When you confirm, we delete your journal and summaries:   │
│   • from the live service, right away;                    │
│   • from backups within {published backup window}.        │
│  If you used AI help: {provider} {keeps nothing |         │
│  may hold what you sent for {period}}.                     │
│  Anything you printed, saved or shared is outside our      │
│  reach. Share links you made stop working.                │
│                                                            │
│   [ Delete my journal ]                                    │
└──────────────────────────────────────────────────────────┘
```

**Notes:** Step 1 writes `withdrawn_at` for `visit_prep_journal` and
`visit_prep_ai` in the consent ledger, and new entries stop at once. Step 2 offers
the export, then deletes on the member's confirmation (ADR 0017 Decision 3).
**Open for the build ADR and counsel:** what happens if the member leaves step 2
without confirming — how long a withdrawn journal is held before the member is
reminded or it is deleted. Until then it stays owner-only and read-only. This addendum does not decide it. The backup
window is a placeholder until it is published; Addendum A's "within 30 days" copy
is one of the statements ADR 0017 says must be revisited.

---

# Updated component inventory (additions)

- `VisitPrepConsent` (journal purpose; unchecked; separate from all other consents)
- `JournalList` · `JournalEntryEditor` (free text only; record-paste warning)
- `AiConsent` (second purpose; provider, retention, example of what is sent)
- `SendPreview` (exact outbound text; nothing sent without the button)
- `AiLabel` (thick left rule + label text; edited state)
- `VisitSummary` · `VisitSummaryPrint`
- `ShareLinkCreate` · `ShareQrCard`
- `CrisisNudge` (resources only; no logging)
- `CaregiverGrant` · `CaregiverGrantStatus`
- `HubSchedule` · `HubJoin` (captions, audio only, dial-in card)
- `VisitPrepWithdraw`

> All ship against Brand v3 and the v3.1 Addendum, WCAG 2.2 AA, and the
> `a11y-reviewer`, `privacy-reviewer` and `governance-reviewer` subagents before
> merge.
