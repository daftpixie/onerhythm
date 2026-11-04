// Expectation contract for the moderation surfaces (ADR 0022, Proposed).
//
// Read by tests/web/moderation-ui.test.tsx (behaviour under react-dom),
// tests/components/moderation-targets.test.tsx (target sizes under the rn
// renderer) and tests/unit/moderation-ui-static.test.ts (focus ring, no
// animation). Nothing here is built yet: build step 4 builds the components to
// meet it. Like crisis-help-sheet.ts, treat a change here as a change to a
// safety surface.
//
// Copy follows plan §4.4–§4.8 and ADR 0021: it promises no reviewer, panel,
// reply or time while the gates are unmet (T8). The crisis numbers come from
// the crisis sheet's contract, so there is one source for them.

import { crisisHelpSheet as Crisis } from "./crisis-help-sheet";

export const moderationUi = {
  /** Where each component lives, relative to the repo root (ADR 0022). */
  modules: {
    statusRegion: "src/components/StatusRegion",
    contactLink: "src/components/ContactLink",
    reportControl: "src/components/moderation/ReportControl",
    blockControl: "src/components/moderation/BlockControl",
    removalNotice: "src/components/moderation/RemovalNotice",
    appealForm: "src/components/moderation/AppealForm",
    crisisShowGate: "src/components/moderation/CrisisShowGate",
    postSubmitCrisisPanel: "src/components/moderation/PostSubmitCrisisPanel",
    moderationQueue: "src/components/moderation/ModerationQueue",
    moderatorConsole: "src/components/moderation/ModeratorConsole",
  },

  /**
   * Props, as the tests use them:
   *
   *   <StatusRegionProvider>{children}</StatusRegionProvider>
   *   useAnnounce(): (message: string) => void
   *   <ContactLink />                  (AppShell renders it in its footer)
   *   <ReportControl subjectKind="post" | "comment" authorName onSubmit={(r: {reason, note}) => Promise<void>} />
   *   <BlockControl memberName fallbackFocusId onBlock={() => Promise<void>} />
   *   <RemovalNotice viewer="author" | "other" floorItemText crisis onAskAgain />
   *   <AppealForm actionId gates={{ G1, G2 }} onSubmit={(statement) => Promise<void>} />
   *   clearAppealDrafts(): void        (AppealForm module; called on sign-out)
   *   <CrisisShowGate>{post}</CrisisShowGate>
   *   <PostSubmitCrisisPanel gates={{ G1 }} />
   *   <ModerationQueue items={QueueItem[]} />
   *   <ModeratorConsole items={QueueItem[]} onAction={(id, action) => Promise<void>} />
   *
   * QueueItem: { id, category, tierLabel, ageText } — never a reporter, note,
   * count or timestamp (ADR 0019, T6).
   */

  /**
   * The provider holds the state; AppShell renders the region in its footer.
   * useAnnounce() clears it, then sets the text CLEAR_THEN_SET_MS later, so the
   * same message twice is read twice (React would batch a same-tick clear).
   */
  statusRegion: { testID: "app-status-region", clearThenSetMs: 100 },

  /** Plan §4.8: the contact link sits in the same place on every surface (SC 3.2.6). */
  contact: { label: "Contact us", landmark: "contentinfo" },

  report: {
    /**
     * Visible text is "⚑ Report"; the accessible name adds what and whose, so a
     * feed is not a list of identical buttons (SC 2.5.3 holds: "Report" is in it).
     */
    visible: "Report",
    opener: (kind: "post" | "comment", author: string) => `Report this ${kind} by ${author}`,
    panelHeading: (kind: "post" | "comment") => `Report this ${kind}`,
    reasonsLegend: "Why are you reporting this?",
    reasonLabel: "Someone may be in danger of hurting themselves",
    noteLabel: "Anything else? (optional)",
    noteHint: "Please don't include health details or anyone's name.",
    noReason: "Choose a reason to send your report.",
    send: "Send report",
    cancel: "Cancel",
    saved: "Thanks. We saved your report.",
    failed: "Your report didn't send. Please try again.",
  },

  block: {
    opener: (name: string) => `Block ${name}`,
    panelHeading: (name: string) => `Block ${name}?`,
    /** Plan §4.8, three short lines. */
    explanation: [
      "You won't see their posts.",
      "They can't reply to you.",
      "We won't send them a notice, but they may notice they can't see your posts.",
    ],
    confirm: "Block",
    cancel: "Cancel",
    done: "Blocked.",
  },

  removal: {
    author: "We removed your post. It broke one of our safety rules:",
    askAgain: "Ask us to look again",
    other: "Removed",
    noticeLabel: "About this post",
  },

  appeal: {
    heading: "Ask us to look again",
    statementLabel: "What should we know?",
    empty: "Please tell us what to look at again.",
    lostOnClose: "If you close the app, this draft is lost.",
    maxChars: 1000,
    /** Plan §5.4: warn at 90% and at the limit, politely. */
    warnAt: 900,
    charsLeft: (n: number) => `${n} characters left`,
    panelUnmet: "We haven't set up our review panel yet, so we can't say when.",
    submit: "Send",
    saved: "Your request is saved.",
  },

  showGate: {
    text: "This post talks about very hard feelings.",
    show: "Show this post",
    hide: "Hide this post",
  },

  /** Plan §4.6. The numbers are the crisis sheet's. */
  postSubmitCrisis: {
    heading: "If you might hurt yourself, or you are not safe, get help now.",
    call988: Crisis.lifeline.call,
    text988: Crisis.lifeline.sms,
    emergency: Crisis.emergency,
    /** An in-app page with a static list; no network call, nothing stored. */
    otherCountry: { label: "Help in another country", href: "/help/other-countries" },
    /** Shown only while G1 is unmet. */
    nobodyWillContact: "No one from OneRhythm will contact you about this post.",
  },

  /** Crisis adjacency (plan §5.1): copy naming self-harm keeps these in the same block. */
  crisisAdjacency: { call988: Crisis.lifeline.call.url, text988: Crisis.lifeline.sms.url },

  queue: {
    heading: "Queue",
    newItems: (n: number) => `${n} new ${n === 1 ? "item" : "items"} — Show`,
    open: "Open",
    pause: "Pause live updates",
    handled: "Another reviewer already handled this item.",
  },

  console: {
    navLabel: "Moderator navigation",
    skipLink: "Skip to the queue",
    reasonLabel: "Reason",
  },

  crisisTrigger: Crisis.trigger.accessibleName,
  minTargetPx: 44,
} as const;
