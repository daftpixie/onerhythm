// Expectation contract for the parts of the moderator console that ADR 0022
// left to build step 5, and for the console's action form (plan §4.2, §5.5;
// ADR 0019 Q9; ADR 0021). Read by tests/web/moderator-console.test.tsx and
// tests/components/native-focus.test.tsx.
//
// Like moderation-ui.ts, treat a change here as a change to a safety surface.
// Copy promises no reviewer, panel or time while the gates are unmet (T8).

import { crisisHelpSheet as Crisis } from "./crisis-help-sheet";

export const moderatorConsole = {
  /** The page heading (level 1). The queue's own heading stays "Queue". */
  pageHeading: "Moderator console",

  /** G4 unmet: nobody can hold a grant, so there is no console to show. */
  noModerators: "No moderators are appointed yet.",
  /** Signed in, G4 met, but this member holds no current grant. */
  notAModerator: "This page is for moderators. You don't have access to it.",

  /** Moderators act under their pseudonym (ADR 0019 Q4). */
  pseudonymNote: "Your actions are recorded under your moderator name, not your account name.",

  /** Plan §5.5, moderator care: never auto-expanded. */
  showContent: "Show this content",
  hideContent: "Hide this content",
  /** Plan §5.1: an opened crisis item carries a one-line link to the resources, for the moderator. */
  careLine: "Looking after yourself matters too.",
  care988: { call: Crisis.lifeline.call.url, text: Crisis.lifeline.sms.url },

  actionLegend: "What do you want to do?",
  /** The database needs exactly one cited rule for every action (moderate(); T9). */
  ruleLegend: "Which safety rule did you check this against?",
  tier1RuleLegend: "Which community guideline did you check this against?",
  actions: {
    noAction: "No action needed",
    remove: "Remove it (safety floor)",
    lock: "Lock the thread",
    escalate: "Ask another moderator",
    requestEdit: "Ask the author to edit",
    ban: "Propose a temporary ban",
    /** Plan §4.2: one step, and only once G1 is met (moderate() refuses it before). */
    sendCrisis: "Send crisis resources to the member",
  },
  tier1Rules: { off_topic: "Off topic", unkind: "Unkind" },
  banLengthLegend: "How long?",
  banSecondPerson: "A second moderator must confirm a ban before it starts.",
  banUnavailable: "Bans can't be proposed yet. No longest ban length is set.",
  apply: "Apply",

  errors: {
    noAction: "Choose what you want to do.",
    noReason: "Write a reason for this action.",
    noRule: "Choose the rule you checked this against.",
    noBanLength: "Choose how long the ban lasts.",
  },
  applied: "Action applied.",
  failed: "That action didn't save. Your reason is still here. Please try again.",

  /** Plan §5.5: warn at least 20 seconds ahead, with "Stay signed in"; keep unsaved reasons. */
  expiry: {
    warnAheadMs: 60_000,
    minWarnAheadMs: 20_000,
    warning: "You'll be signed out in about a minute. Anything you typed stays here.",
    stay: "Stay signed in",
    stayed: "You're still signed in.",
  },
} as const;
