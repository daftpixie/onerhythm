# OneRhythm — Brand Guidelines v3.1 Addendum

*What the vision adds, in the v3 system*

**Version:** 3.1 addendum · **Status:** Authoritative for the surfaces it names.
[Brand Guidelines v3](OneRhythm_Brand_Guidelines_v3.md) stays authoritative for
everything it already covers.
**Companion to:** [PRD Amendment 3](../prd/OneRhythm_PRD_v1.0_Amendment_3.md),
[Wireframes Addendum B](../prd/OneRhythm_Wireframes_Addendum_B.md),
[ADR 0017](../adr/0017-open-by-design-layered-architecture.md) (accepted
2026-10-28), [ADR 0016](../adr/0016-landing-copy-and-transparency-removal.md)
(statistics discipline).
**Binding rule, unchanged:** where this document and PRD §9 accessibility ever
conflict, **§9 wins.**

---

## 0. What this addendum does, and does not do

**It adds rules for six things the vision introduces:** AI-produced text; Visit
Prep surfaces; consent screens with a data preview; Hub sessions; partner rooms
and the name; numbers and evidence on public pages.

**It changes nothing in v3:**

- **No new colours and no new tokens.** Every rule below uses the v3 tokens in
  `src/theme/tokens.ts` — Paper, Ink, Ink 70%, Ink 55%, Ink 12% (line), Ink 4%
  (fill), and Pulse Red — exactly as v3 defines them. `tests/unit/contrast.test.ts`
  is unchanged.
- **Atkinson Hyperlegible everywhere** and the **8px / 12px radii** are not up for
  revision (v3 §10).
- **Pulse Red stays reserved** for the mark, the primary action, the active
  upbeat and destructive actions. It is **never** used on any rule in this
  addendum: not for AI labels, not for crisis words, not for numbers.
- Semantic state colours stay retired. A state is carried by icon + text +
  weight.

Every surface here is **Planned**. Nothing in this addendum is built.

---

## 1. AI-produced text

### 1.1 The label

Every piece of text the AI produced carries a label, in words, directly above
it. **These are the exact strings.** Build them once, as shared constants, and
cite this section; the wireframes reuse them unchanged.

| State | Exact label |
|---|---|
| As the AI organized it | Organized by AI at your request — not reviewed by a clinician |
| After the member edits it | Organized by AI at your request, then edited by you — not reviewed by a clinician |

- Set in Atkinson Hyperlegible 600, 16px, Ink. Never smaller than body text.
  Never truncated. Never behind a tooltip or an "info" tap.
- **Sentence case, always** — never all caps, which is harder to read and which
  some screen readers spell out letter by letter.
- **On print and PDF:** every page carries the matching first-person footer
  line (§2.3), so a single page torn from the rest still says what it is.

### 1.2 Telling AI text apart from the member's words — without colour

Colour alone never carries this (WCAG 1.4.1). Four signals, all required:

1. **The label** (§1.1), as real text, at the top of the AI block.
2. **A 3px Ink rule** down the left edge of the AI block, with no fill. This is
   the v3 disclaimer band's rule weight. The disclaimer band keeps its Ink 4%
   fill and info icon; the AI block has neither, so the two do not look alike.
3. **A heading that says whose words they are.** The member's own entries sit
   under "Your words". AI-organized text sits under the label.
4. **For assistive technology:** the AI block is a region whose accessible name
   is the label text, so a screen reader announces the label before the content.
   The visible label is the source of that name, not a hidden duplicate. It
   comes first in reading order. When the member edits the text, the label
   changes to the edited string and the change is announced politely, without
   moving focus. This belongs in the AI test suite as a test case.

**Icon:** a plain list or sort glyph may sit beside the label, always with the
words. **Never** a sparkle, star, magic wand, robot, brain or face. Those suggest
intelligence, magic or a companion. The AI is none of those.

### 1.3 How AI output sounds

The AI writes the member's summary, in the member's voice. Its rules:

- **Plain, ~8th grade.** Short sentences. The member's own words wherever they
  will do.
- **First person, as the member** ("What I noticed"), because it is the
  member's summary. The AI never speaks as itself: no "I'm here for you", no
  name, no avatar, no greeting, no sign-off, no emoji.
- **No diagnosis-sounding language.** The AI never writes "you may have", "this
  suggests", "consistent with", "symptoms of", "could be caused by",
  "heart-related", "anxiety-related", "likely" or "probably" about a body or a
  mind. It never names a condition, medicine or test the member did not write.
- **No reassurance about symptoms.** Never "normal", "common", "harmless",
  "nothing to worry about", "don't worry", "that's expected". Reassurance is a
  medical judgment. It belongs to the clinician.
- **No alarm either.** No "urgent", "serious", "dangerous", "you should go to
  the ER". The 🆘 control is how urgent help is reached, on every screen.
- **No counting, trends or scores.** The AI keeps the dates the member wrote. It
  does not turn entries into "3 times this week", "getting worse", "improving",
  a mood score or a chart, and it never reads meaning into days with no entry.
- **No praise or pressure.** No "great job", no "keep it up", no streaks.
- **Suggested questions are open and the member's own.** "What should I do when
  I wake with my heart racing?" — never a question that carries an answer
  ("Should I stop my medicine?").

These rules are also test cases. They belong in the published AI test suite
(PRD Amendment 3 §7.10.5), where the advisory group can check them.

---

## 2. Visit Prep surfaces

### 2.1 The journal

- **Long-form reading size:** 18px, line height 1.6, ~70 characters per line
  (v3 §4).
- **One free-text box** per entry, label above the field (v3 §7). No fields for
  diagnosis, medicines or results; no mood sliders, emoji scales, colour scales
  or charts. A scale is a score.
- **No streaks, no "days since", no reminders that imply a gap matters.**
  Missing is not zero.
- Each entry shows its date in words ("Wed 14 Oct"), its first line, and two
  plain actions: "Open" and "Delete".
- "Private to you." sits at the top of the journal, in Ink 70%, 16px, with a
  link: "Who could ever see it?". That page says plainly who can: the member;
  anyone they choose to share with; operators, in limited, logged emergency
  access or under a valid legal order. Never write "no one can ever read this".
  Vault mode is the only stronger promise, and it says so.

### 2.2 The summary, on screen

- AI-organized text follows §1. A summary the member writes alone has no AI
  label.
- **Plain, narrative headings only:** "What I noticed" and "Questions I want to
  ask". Never "Problems", "Medications", "Assessment", "Findings" or other
  clinical-record headings.
- "Show your words (what this was organized from)" is a disclosure button below
  the summary,
  so the member can check the AI against what they wrote.

### 2.3 The printable and PDF summary for a clinic

Made to be read across a desk by someone in a hurry, and by the member with
reading glasses.

- **Black on white only.** No Pulse Red. The 1R mark, if used, is the
  single-colour variant (v3 §2), small, in the footer only.
- **Large type:** body 14pt (about 19px), headings 18pt, Atkinson Hyperlegible,
  line height 1.5. One column. Wide margins for the clinician's pen.
- **Header:** "Visit notes", the member's chosen name only if they choose to add
  it, and "Prepared {date}". The share-link viewer never shows a name.
- **The PDF is made on the member's device**, not by a server, and carries no
  document metadata (author, title, producer) that could hold the account name
  or email. Never a diagnosis, never a condition, never
  "OneRhythm patient".
- **Body:** "What I noticed", then "Questions I want to ask", as bulleted lists.
  Headings are bold and larger, so they stand apart from the body by weight and
  size, not colour.
- **Footer, every page:** "Written by me. Organized by AI at my request. Not
  reviewed by a clinician. This is not a diagnosis or medical advice." (Without
  AI: "Written by me. This is not a diagnosis or medical advice." After the
  member edits AI text: "Written by me. Organized by AI at my request, then
  edited by me. Not reviewed by a clinician. This is not a diagnosis or medical
  advice.") Then
  "Page {n} of {total}". The footer is at least 12pt, set as real text (never an
  image), and is read as content by assistive technology — or, if marked as a
  repeating artifact, the same words also end the body text.
- **The PDF is tagged** (title, headings, lists, reading order, document
  language) so a screen reader can read it. It is generated from the same
  accessible page the member sees, not drawn separately, and passes a PDF/UA
  check before release.

### 2.4 The share link and the QR card

- **The share screen says the risk in plain words first:** "Anyone with the link
  and the passcode can read this summary until it ends. Share it the way you
  would hand over paper." If the member turns the passcode off: "Anyone with the
  link can read this summary until it ends."
- **The QR card** carries only: the QR code, "Visit notes from a patient", the
  end date, the link as text, and — only when a passcode is set — "Ask the
  patient for the passcode." **Never** a name, a
  condition, or the passcode.
- **The link is also printed as text** under the QR code, for anyone who cannot
  scan: at least 16px on screen, selectable, never shortened or cut off. On
  screen, the QR image's text alternative is "QR code. The link is printed below
  it."
- QR code: Ink on Paper, with the standard quiet zone around it. It is made on
  the member's device, with no network call; the link is never sent to a QR
  service. Test that it
  scans from an older phone at the printed size before shipping.
- **The viewer page** a clinic opens uses the print layout (§2.3) on screen. It
  loads no third-party fonts, scripts or images; Atkinson Hyperlegible is served
  by the deployment itself. Unlike paper, the viewer is a screen: it keeps the
  app header and the 🆘 control ("🆘 Need help right now?"). Only paper and PDF
  output go without it.

---

## 3. Consent screens with a data preview

Applies to both Visit Prep consents and every later consent purpose (caregiver
access, share links, the Hub, the action record).

**Targets and entry.** Checkbox and radio rows are at least 44px tall, with the
label inside the hit area. Nothing the member already gave in the same flow is
asked for again (SC 3.3.7).

**Order, top to bottom, every time:**

1. What it is, in one sentence.
2. What it never does.
3. Who runs it — the company's name, and what it keeps, taken from the signed
   terms. A placeholder is never shipped.
4. **What leaves your device** — the preview (below).
5. What does **not** leave your device, as a short list.
6. How to turn it off later.
7. **One unchecked box**, with a label that says exactly what checking it does.
8. One primary button ("Save my choice") and one quiet way out ("Not now").

**The preview:**

- Shows the **exact text** that would be sent, in Ink, inside a card (Ink 4%
  fill, 1px Ink 12% line, 12px radius). Real text from the member's own
  entries where they exist; a plainly marked example where they do not.
- **Redactions are shown as words** — "[name removed]", "[phone number
  removed]" — never as blur, black bars or colour.
- Says plainly that removal is best-effort: "That can miss things, so you see
  the exact text before anything is sent."
- **The preview is text, never an image**, so it can be read aloud, zoomed and
  reflowed.
- **The preview at the moment of sending is the payload.** It is made by our
  own gateway, after name removal and the length cap — never by the provider —
  and includes entry dates if they are sent; a test asserts the two are
  identical. **The example on a consent screen**, shown before that consent
  exists, is made on the member's device with no server call.
- The same card appears again at the moment of sending (Wireframes Addendum B,
  B19). Nothing is sent from the consent screen itself.

**One stated exception:** the share-link passcode box is on by default,
because it is a protection, not a consent. Turning it off is a deliberate
choice the screen explains.

**Never:** a pre-checked consent box; "Accept all"; a consent folded into another one; a
preview that summarizes instead of showing; a "Turn off" that is harder to find
than "Turn on".

---

## 4. Hub sessions

- **Captions are on by default.** Atkinson Hyperlegible, at least 18px, Paper
  text on an Ink band (21:1). The member can make them larger. **Pulse Red is
  never used for caption text** — it is only 4.29:1 on Ink.
- The captions control reads "Captions: on" / "Captions: off" in words, with
  the CC glyph.
- **The dial-in card** is a card (§3 styling) with: "Join by phone", the number
  and the meeting code in large type (23px, weight 700, Ink, digits grouped with
  spaces, selectable), and "We don't store
  your phone number. The phone company sees it, as with any call." On a phone,
  the number is also a tap-to-call link.
- **Audio-only** is a first-class choice ("Sound only (easier on weak
  internet)"), not a fallback hidden in settings.
- Camera and microphone start off. Every control in the session bar is icon +
  text, 44px, and the 🆘 control ("🆘 Need help right now?") is in the bar.
- **The session bar is Paper**, with a 1px Ink 12% line along its top edge and
  Ink text. Pulse Red is never text on the bar or the caption band. If a primary
  action appears there, it is the v3 primary button: Paper text on a Pulse Red
  fill (4.90:1).
- **Captions do not animate.** New lines appear without scrolling effects,
  honouring `prefers-reduced-motion`. The caption band is not a live region
  that a screen reader reads aloud line by line; screen-reader users hear the
  session audio itself.
- **At narrow widths and high zoom** (320px, 400%), the caption band has a
  maximum height of three lines and can be collapsed to one line, so captions
  stay reachable without hiding the page.
- **Focus is never hidden (SC 2.4.11).** The caption band and the session bar
  never cover, fully or in part, the control that has focus: the page reserves
  scroll space at least as tall as both together. The caption band never takes
  or traps focus.
- **The focus ring** is v3's 2px Ink ring with a 2px offset. On the Ink caption
  band, where an Ink ring would not show, any control gets a 2px Paper ring
  instead. No new colour.
- **Reminders never name a condition or topic.** The only reminder text is
  "Your session starts in 15 minutes." That holds for email subject lines, push
  notifications and texts. (Whether the sender name says "OneRhythm" is a
  privacy question for the Hub ADR.)
- **Recording:** sessions are never recorded (privacy floor item 10, ADR 0018).
  The join screen says so in plain words: "This session is never recorded. No
  sound, video or transcript is kept." There is no recording indicator, because
  there is no recording.
- Times are always shown in the member's own time zone, with the zone named in
  the same line as each time, so a screen reader never reads a time without its
  zone.

---

## 5. Partner rooms and the name

### 5.1 How a partner group appears

A partner room is a room like every other (vision §5.1). Its look follows from
that:

- **The room uses OneRhythm's system, not the partner's.** Atkinson, Paper and
  Ink, the 1R mark in the app header as everywhere else.
- **The partner's name appears in plain text** in the room's name and
  description. **No partner logo** in the header, no co-locked marks, no
  partner colours. v3 §1's rule — never co-lock two marks — applies.
- **Every partner room carries one plain line:** "This room was opened for
  members of {group}. OneRhythm and {group} are separate. Being here does not
  mean either one endorses the other." Followed by: "This room follows the same
  safety floor, and its moderators are chosen the same way, as every room."
- **No sponsored rooms, posts or seats** (vision §10). Nothing in a room may
  look like an advertisement.

### 5.2 Funders

Organizations that fund the work are listed by name on a funding page, in plain
text, all in the same type size, with no logos. Size and placement never vary
with the amount. Individuals are never named. (Whether amounts are published
is an open founder decision; see PRD Amendment 3 §10.)

### 5.3 Trademark and name-use policy — **counsel-pending placeholder**

> **Not written yet.** ADR 0017 Decision 10 commits to a short trademark policy,
> written with counsel, that ties use of the OneRhythm name to keeping both
> floors and the adopter commitments in vision §11, under published criteria,
> with reasons, never dependent on payment.
>
> Until it exists: the code is under the Apache License 2.0 (ADR 0024), whose section 6 grants no trademark rights; this addendum does
> not grant or describe any right to use the OneRhythm name or the 1R mark. The
> criteria are an open question (vision §15.3).

---

## 6. Numbers and evidence on public pages

ADR 0016's statistics discipline, made into brand rules for every public page,
report and one-pager.

### 6.1 Every number

- **Has a source.** Named on the page (a reference or footnote) and in the
  source file beside the copy. No source, no number.
- **Names its population** in the same sentence: who, where, and when.
- **Is never one study presented as a prevalence.** Use a pooled figure or a
  range, and say when studies disagree.
- **Keeps its uncertainty** where the source gives it ("95% CI 1.04 to 1.59").
- **Is rounded honestly** ("about 22%", "more than 50 million") and never
  rounded up into a bigger-sounding claim.
- **Is set in body type.** No giant "hero" numbers, no counters that animate
  up, no number larger than the page title. A number is evidence, not a
  headline.

### 6.2 Status labels

Claims carry the vision's labels, as words: **Built**, **Planned**, **For
partners**, **Hypothesis**. Set them in Atkinson 600, Ink, with a 1px Ink 12%
line and 8px radius — a text label, not a coloured badge. A hypothesis is never
written as a result.

### 6.3 Crisis adjacency

**Any mention of suicidal thoughts or self-harm sits in the same text block as
crisis resources** — in the US, call or text 988; in an emergency, call the
local emergency number. Not a paragraph later, not behind a link (ADR 0016 §1).

### 6.4 Charts, if any

Monochrome. Every series is labelled directly in text; patterns or shapes, not
colour, separate series. Every chart has a text summary and a data table. The
source and population sit under the chart.

### 6.5 Examples

| Do | Don't |
|---|---|
| "More than 50 million people worldwide live with AF or atrial flutter (Global Burden of Disease 2021)." — population, source, honest rounding (vision ref. 35) | "Millions are suffering in silence." — no source, no population, and it ranks suffering |
| "A 2024 review of 26 studies of people with AF found depression in about 22% and anxiety in about 13%, with very large differences between studies." (vision ref. 38) | The retired landing figures, anxiety 88% and depression 71%, from one 222-person study (ADR 0016 §1) |
| "Hypothesis: members feel less alone after six months. We have not shown this yet." | "OneRhythm reduces loneliness." |
| A figure about distress, with 988 and the local emergency number in the same block | A statistic about suicidal thoughts three paragraphs above any help |

---

*Nobody should fight an invisible bear alone.*
*A VT Infinite, Inc. initiative.*
