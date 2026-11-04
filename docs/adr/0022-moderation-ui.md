# ADR 0022 — Moderation UI: inline panels, not modal sheets

Status: Accepted — founder, 2026-10-30

Option C: inline panels and pages; the crisis sheet stays the only modal.
Date: 2026-10-29
Relates: plan `.claude/plans/phase-2-moderation-core.md` §4.4–§4.8, §5 and §7
item 8; Wireframes Addendum A (B15, the moderator console); ADR 0014 (the
`web` test project); ADR 0019 (data model); ADR 0021 (appeals and launch
gates); `.claude/rules/a11y.md`; Brand v3 and the v3.1 addendum.

## Context

Build step 4 adds six moderation surfaces:

1. **Report** a post or comment;
2. **Block** a member;
3. the **removal notice** on a removed post;
4. the **appeal form** ("Ask us to look again");
5. the **"Show" gate** on a post that talks about very hard feelings (Q8);
6. the **moderator console** (Addendum A, B15).

Each could be a modal sheet (like the crisis sheet), an inline panel that
opens in the page, or a page of its own. This ADR picks one shape for each,
before any of them is built.

The test is plan §5, applied to the person this is for: 65 or older, an older
phone, low vision or shaky hands, not confident with technology, and maybe
upset when they open one of these.

### What we know about modals here

From the crisis sheet (build step 0) and its tests:

- **A modal makes the page behind it inert.** On web, react-native-web's
  `Modal` sets `aria-modal`, traps focus and hides the page from assistive
  technology. The header's "Need help right now?" button is behind it. So
  every modal sheet must carry **its own** crisis button (plan §5.1). That is
  one more copy of a safety control to keep correct, per sheet.
- **Opening the crisis sheet from inside another sheet stacks two modals.**
  The plan notes that stacked modals are unreliable on native. That is the
  exact moment a person may need help most, and the hardest one to test
  without VoiceOver and TalkBack (G7).
- **The modal only turns on its dialog role, trap and Escape after its slide
  animation ends.** The web tests have to fake that event. It works, but it
  is one more way for a sheet to behave differently from its tests.
- **A modal covers the post it is about.** For Report and Block, the person
  loses sight of what they are reporting. On a small screen at 200% text, the
  sheet is the whole screen.

What a modal does well: it holds attention on one task, and Escape and the
focus trap are built in.

## Options

| | A. Modal sheets for all | B. Inline panels for all | C. Inline panels, own pages for long tasks (recommended) |
|---|---|---|---|
| Crisis control (§5.1) | Must be repeated inside each sheet; stacked with the crisis sheet | Header control stays reachable; no stacking | Same as B; pages mount `AppShell`, so the header is there |
| Dialog contract (§5.2) | Built in (trap, Escape), after the animation | A smaller panel contract: focus in, Escape, return; no trap, because nothing is hidden | Same as B for panels; pages need none |
| Status messages (§5.3) | Root region is behind `aria-modal`; must also announce inside the sheet | One root region, always reachable | Same as B |
| Focus never obscured (SC 2.4.11) | Sheet covers the content; sticky footer over the keyboard | Panel pushes content down; nothing covers focus | Same as B; a page scrolls normally |
| 65+, older device | Covers the post; full-screen at large text; native stacking risk | Stays beside the post; plain scroll | Long writing (appeal) gets a full page, a back button and a saved draft |
| Long form, draft kept (SC 3.3.7) | Draft lost if the sheet is dismissed by accident | Panel can be scrolled away while typing | A page keeps its draft across navigation |
| Console (B15) | Item detail over the queue hides the queue | Detail pane beside the queue (one column when narrow) | Same as B |

## Decision

**Option C. No moderation surface is a modal.** The crisis sheet stays the only
modal in the app, because it is the help itself.

| Surface | Shape | Why |
|---|---|---|
| Report | **Inline panel** under the post, opened by "⚑ Report" (`aria-expanded`, `aria-controls`) | Short task; the post stays in view; the header crisis control stays reachable |
| Block | **Inline panel**, "Block {name}?" with Block and Cancel | One decision; no reason asked (§5.4); never a CAPTCHA or "type to confirm". The third line follows the plan revision on PR #11 and supersedes "They won't be told" in plan §4.8 as merged: "We won't send them a notice, but they may notice they can't see your posts." It is more honest, and it stays true with T13's neutral outcome on reply |
| Removal notice | **Inline, in place of the post** | It is information, not a task. Others see a list item that says "Removed". A notice for a post with crisis language carries the crisis resources in the same block (§5.1, adjacency) |
| Appeal ("Ask us to look again") | **Its own page** under `AppShell` | Up to 1,000 characters; the draft must survive navigation; a page has a real heading, back button and normal scrolling |
| "Show" gate (Q8) | **Inline disclosure**: "This post talks about very hard feelings." + "Show" (`aria-expanded`) | Never hides the post from assistive technology once shown; never a modal over the feed |
| Moderator console (B15) | **Its own page** under `AppShell`: moderator navigation, the queue, and an inline item pane (one column when narrow) | Landmarks and a skip link; Realtime never moves focus; the queue stays visible beside the item |

### The inline panel contract (replaces §5.2 for panels)

A panel is not modal, so it does not trap focus and does not hide the page.
In exchange:

- **Names.** The opener shows "⚑ Report" and is named "Report this post by
  Sam" (or "comment"), so the visible word is part of its name (SC 2.5.3) and
  a feed is not a list of identical buttons. It has `aria-expanded` and
  `aria-controls`. The panel is a group (not a landmark, so several open panels
  do not add landmark noise), named by its heading.
- **Focus in.** Focus moves to the panel's heading itself when it opens. The
  heading takes focus by script only (`tabindex="-1"`).
- **Escape** is handled on **keydown, on the panel element only** (React
  `onKeyDown`), never by a document listener. It is ignored while text is being
  composed (`isComposing`) and when another handler has already used it. So
  the Escape that closes the crisis sheet never closes a panel too, and the
  keyup of that Escape does nothing.
- **Focus out.** Escape and Cancel close the panel and return focus to the
  opener. A successful Send returns focus to the opener too. **If the opener
  is gone** (Block hid the post), focus goes to a named fallback (the list
  heading or the next post), never to `body`.
- **Drafts are kept (SC 3.3.7).** Escape and Cancel keep the chosen reason
  and the typed note for as long as the screen is open. They are cleared only
  by a successful Send. A failed Send keeps everything and shows an `alert`
  inside the panel.
- **Errors (SC 3.3.1, 3.3.3).** Send with no reason says "Choose a reason to
  send your report." The reason group gets `aria-invalid` and
  `aria-describedby` pointing at that text, and focus goes to the first
  reason.
- **The queue's "N new items — Show"** inserts the new items at the top and
  moves focus to the first new item's Open button, so a keyboard user lands on
  what they asked to see, never on `body`.
- **"Pause live updates"** (`aria-pressed`) stops announcements. Items that
  arrive while paused are held, never inserted; on un-pause they are counted
  into one "N new items — Show" button and announced once.
- **Several panels** may be open at once, each with its own id and its own
  draft. Opening one never closes or clears another.
- **No `aria-modal` anywhere**, so the header's "Need help right now?" is
  always in the accessibility tree and the Tab order.
- **No animation at all.** Panels appear and disappear without motion, so
  reduced motion is honoured by construction. They do not use
  `useReducedMotion`.
- 44px targets in both directions, and the v3 focus ring (2px solid Ink from
  `tokens.ts`) on every control. Icon and text, always.
- **Links are real links.** The new crisis links carry an `href` (`tel:`,
  `sms:`, or an in-app route), so they still work if a script handler fails,
  and long-press shows the number. The crisis sheet keeps its current
  controls; aligning it is a separate change.
- When a panel opens, its heading and its Send button scroll into view, and
  nothing sticky covers the focused field (SC 2.4.11). This needs the manual
  pass to confirm (G7).

**The "Show" gate.** The button reads "Show this post" (the plan's Q8 text
says "Show"; this ADR names the button fully so a feed of gated posts is not
a list of identical "Show" buttons), with
`aria-expanded="false"`. Pressing it reveals the post after the button,
changes the label to "Hide this post" with `aria-expanded="true"`, and keeps
focus on the button. Pressing it again hides the post and keeps focus there. The post is never
hidden from assistive technology once it is shown.

**The appeal draft** is kept **in memory only**, for the app session, keyed by
the action. It survives leaving the page and coming back. It is never written
to device storage or the server, because it may hold health details. A full
reload or signing out clears it, and the page says so in words: "If you close
the app, this draft is lost." The page counts characters and warns politely at
900 and at 1,000. Sending an empty appeal says "Please tell us what to look at
again." on the field and keeps focus there. The draft store exports
`clearAppealDrafts()`, which sign-out calls, so a shared tablet does not keep
one person's words for the next.

**Consistent help (SC 3.2.6).** `AppShell` gains a footer (`contentinfo`) with
one "Contact us" link, so the contact link is in the same place on every
surface, moderation surfaces included. Build step 4 adds it.

### Status messages (§5.3)

One `role="status"` region, polite, present before anything happens and
outside every panel. `StatusRegionProvider` (at the app root) holds its state;
`AppShell` renders the region in its footer, so it sits inside a landmark.
Without a provider the context default is a no-op and the region renders
empty, so screens and tests that mount `AppShell` alone keep working.
Components announce through `useAnnounce()`, which empties the region at once
and sets the new text **100 ms later**. React would merge a clear and a set in
the same tick into one change, and the same message twice would be read once. Messages are short and
promise nothing: "Thanks. We saved your report.", "Blocked.", "Your request is
saved." A message that arrives while the crisis sheet (a modal) is open sits
behind it and may not be read. That is accepted: the person is getting help,
and nothing in moderation opens a modal.

### Post-submit crisis resources (T12)

When a post the author just wrote matches the published crisis list, the
resources appear **at once, inline, above the post**, on the same render. It
is not a modal, so nothing blocks the post or the header. The panel's heading
takes focus. It is not an alert or a live region, so it is not read twice. It
is never timed. It shows the crisis sheet's numbers (Call 988, Text 988 and
the US emergency number, each with an `href`) and "Help in another country",
an in-app page with a static list. "No one from OneRhythm will
contact you about this post" shows only while G1 is unmet. Nothing is logged
or sent, and the country choice stays on the device.

Crisis triage does not run on member content until G6 (ADR 0019 §8). This
panel is built and tested now, and shown only once triage runs.

### Components (named here so the tests can find them)

All in `src/components/moderation/` except the status region:

- `StatusRegionProvider`, `useAnnounce` (`src/components/StatusRegion.tsx`)
- `ContactLink` (`src/components/ContactLink.tsx`), in `AppShell`'s footer
- `ReportControl`, `BlockControl`
- `RemovalNotice`
- `AppealForm` (the page body)
- `CrisisShowGate`
- `PostSubmitCrisisPanel`
- `ModerationQueue`, `ModeratorConsole`

Their props are in `tests/shared/contracts/moderation-ui.ts`.

### Where this changes the plan and the wireframes

- Plan §5.1 offered inline panels as the alternative. This takes it, for every
  surface, so "each sheet carries its own crisis button" does not apply.
- Plan §5.2's dialog contract applies to the crisis sheet only. Panels follow
  the panel contract above; T20 tests that contract.
- Wireframe B15 shows report notes and counts ("Reports (2): …"). ADR 0019
  (T6) supersedes that: the console shows "reported by one or more members"
  and the age in hours, never a note or a count.

## Consequences

- **Tests first**, committed failing (nothing is built). Each test loads its
  component on demand, so each fails on its own with "not built yet":
  - `tests/web/moderation-ui.test.tsx`: T5, T12, T14, T15, T20 and T21
    under react-dom;
  - `tests/components/moderation-targets.test.tsx`: the 44px targets, under
    the rn renderer (jsdom has no layout);
  - `tests/unit/moderation-ui-static.test.ts`: the focus ring, "no
    animation" and "never modal", as a source scan of every file in
    `src/components/moderation/` plus `ContactLink` and `StatusRegion`, with
    comments stripped (no renderer here shows a `:focus` style).
- **T5 covers the states built in step 4.** The locked thread and the muted
  post join T5 with `PostCard` and muted words, in step 4. The public log and
  floor pages join it in step 6. The render-failure fallback is covered with a
  panel open.
- **The plan changes with this ADR.** Plan §5.2's trap and `aria-modal`
  assertions apply to the crisis sheet only; T20 tests the panel contract
  above instead.
- T14 runs `axe-core` on the whole document in the `web` project, for every
  state above, with the page's `lang`, title, `main` and `h1` in place, so
  page-level rules apply. Only `color-contrast` and `target-size` are off,
  both because jsdom has no layout. `axe-core` was already installed (through
  `eslint-plugin-jsx-a11y`) and is now a direct dev dependency at the same
  version. axe cannot measure contrast or target size under jsdom:
  `tests/unit/contrast.test.ts` covers the tokens, and the rn test covers
  sizes.
- **The manual pass (G7) names the panel cases.** In particular, whether
  VoiceOver on iOS reads a heading that takes focus by script. If it does
  not, the panel moves focus to its first control instead.
- If the founder chooses modal sheets instead, T5 and T20 change: every sheet
  needs its own crisis control, and stacked sheets need the manual
  VoiceOver/TalkBack pass before merge.
- Native is a later step. Panels avoid stacked modals there too, but the
  manual pass (G7) is still required.
- Still to be pinned when their screens are built: the console's "Show this
  content" for crisis items and the session-expiry warning with "Stay signed
  in" (plan §5.5), in step 5; focus after a successful appeal Send, in step 4.
- Nothing here builds a screen. Build steps 4–8 wait for this ADR.

## Build notes — step 5 and the a11y follow-ups (2026-10-30)

Founder decisions of 2026-10-30: build the console on PR #12, and fix the
four a11y items left open by the step 4 review in the same run.

- **The console** (`ModerationQueue`, `ModeratorConsole`, `/moderation`) is
  built as this ADR says. The 14 tests that waited for it pass without edits.
- **The two items deferred by name above are built, test-first:**
  - "Show this content" for crisis, harassment, doxxing and illegal items,
    and for any item whose category is unknown (fails closed). Never
    auto-expanded. An opened crisis item carries a one-line 988 link for the
    moderator (plan §5.1).
  - The session warning comes 60 seconds ahead (at least 20, SC 2.2.1) with
    "Stay signed in". It never moves focus and keeps every typed reason.
- **The action form.** Every action needs a reason (1–280 characters) and
  exactly one cited rule, because `moderate()` refuses anything else: a
  safety-floor item for Tier 3, a community guideline for Tier 1. There is
  no panel or vote control (Tier 3 is never put to a vote). A Tier 1 or
  crisis item is never removed or banned, and a crisis item is never
  locked. "Send crisis resources" appears only once G1 is met. Bans (Q9)
  offer only lengths within `max_ban_term`, say that a second moderator
  confirms, and are not offered while `max_ban_term` is unset (G9). The
  database checks all of it again.
- **Gate-aware.** While G4 is unmet, `/moderation` says "No moderators are
  appointed yet" and never calls `moderation_queue()`. A member without a
  grant is told they have no access.
- **Live updates.** No Realtime publication exists for moderation items. Its
  payloads need their own privacy review (T22), so none was added here. The
  route reads the queue when the page gains focus and on "Check for new
  items". The queue treats each new list as a live update, so T15's
  guarantees hold whichever way the list arrives. Until a feed exists, the
  route passes `live={false}`: the queue says "Live updates aren't on yet.
  Choose Check for new items." and shows no Pause button, which would do
  nothing. A check that finds nothing says "No new items." A failed check
  shows an alert.
- **Review round 1 changes.**
  - A late content answer for an item that is no longer open is dropped.
  - Content opens at once only for a known list of categories; every other
    category, unknown ones included, is behind "Show this content". An
    unknown category is offered only "No action" and "Ask another
    moderator".
  - A Tier 1 item offers no lock. Every grant is interim before elections,
    and `moderate()` refuses an interim moderator a Tier 1 lock (T24).
  - A ban is announced as "Ban proposed", not "applied".
- **One `main`, from AppShell** (a11y follow-up 1). AppShell renders the
  page's one `main` (`main-content`, focusable by script) and a slot before
  it (`useBeforeMain`), so the console's skip link and navigation sit
  between the header and `main`. Four screens dropped their own `main`. In
  T14, `inPage` and the two appeal states no longer add a stand-in `<main>`,
  which would now be a duplicate. No assertion changed: axe still requires
  exactly one `main`.
- **Visible labels** (follow-up 2) on the report note, the appeal field and
  the muted-word field, through `aria-labelledby` /
  `accessibilityLabelledBy`. iOS has no labelled-by, so it gets
  `accessibilityLabel` with the same words.
- **Stale status messages** (follow-up 3). `StatusRegionProvider` takes
  `resetKey`. The root layout passes the path, so a message from the last
  screen is cleared, and one still waiting to be set is dropped.
- **Native focus** (follow-up 4). On iOS and Android, `focusNode` sends the
  screen-reader "focus" event, as the crisis sheet does. `focusById` finds
  native targets through a registry (`focusTargetRef`). The manual pass (G7)
  still has to confirm what VoiceOver and TalkBack do with these events.
- **Not built here (later steps):**
  - the "claimed by you" lock (plan §5.5). No claim exists in the data
    model.
  - Confirming a proposed ban from the console. `confirm_action()` exists,
    and an unconfirmed ban restricts no one. But no view lists actions
    waiting for a second person. **This must land before G4 is met**, or no
    proposed ban can ever take effect.
  - Two governance notes for the same step:
    - an item with a pending ban stays in the queue (state `actioned`), and
      nothing stops a second proposal on it;
    - `endsAt` comes from the device clock, so a length at the
      `max_ban_term` limit can be refused if the clock runs ahead.
  - "Send crisis resources" records the action and closes the item. When
    G1 is met, a real delivery path must exist before that label stays.
