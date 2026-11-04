// Pure helpers for the moderator console route (build step 5; ADR 0022).

import type { QueueItem } from "../../components/moderation/ModerationQueue";

export type ConsoleAccess = "no_moderators" | "not_a_moderator" | "ready";

/**
 * Whether the console can open. G4 comes first: while it is unmet, nobody can
 * hold a moderator grant (ADR 0021), so the page says "No moderators are
 * appointed yet" whatever the queue call returned. It never fakes access.
 */
export function consoleAccess(args: { G4: "met" | "unmet"; queue: "ok" | "refused" }): ConsoleAccess {
  if (args.G4 !== "met") return "no_moderators";
  return args.queue === "ok" ? "ready" : "not_a_moderator";
}

/** The category in words, as the queue shows it. Never a snippet (plan §4.2). */
const CATEGORY_WORDS: Record<string, string> = {
  crisis: "Possible self-harm signal",
  dangerous_misinfo: "Possible dangerous medical misinformation",
  harassment: "Possible harassment or threats",
  doxxing: "Possible sharing of private details",
  illegal: "Possibly illegal content",
  impersonation: "Possible clinician impersonation",
  spam: "Possible spam",
  scam: "Possible scam",
  other_safety: "Another possible safety problem",
  tier1: "A community guidelines question",
};

/** A row from moderation_queue(). It holds no member id (ADR 0019). */
export interface QueueRow {
  item_id: string;
  post_id: string | null;
  comment_id: string | null;
  category: string;
  tier: number;
  state: string;
  reported: boolean;
  age_hours: number;
}

/** Static age text, "as of" the time it was read; it never ticks (plan §5.5). */
export function ageText(hours: number, asOf: Date): string {
  const h = Math.max(0, Math.round(hours));
  const waited = h < 1 ? "waiting less than an hour" : `waiting ${h} ${h === 1 ? "hour" : "hours"}`;
  const hh = String(asOf.getHours()).padStart(2, "0");
  const mm = String(asOf.getMinutes()).padStart(2, "0");
  return `${waited}, as of ${hh}:${mm}`;
}

/**
 * A queue row as the console shows it. "reported" becomes nothing: the
 * console never shows that, or how many, members reported (ADR 0019, T6).
 */
export function toQueueItem(row: QueueRow, asOf: Date): QueueItem {
  const tier = row.tier === 1 ? 1 : 3;
  return {
    id: row.item_id,
    category: CATEGORY_WORDS[row.category] ?? "A safety question",
    categoryKey: row.category,
    tier,
    tierLabel: tier === 3 ? "Safety floor (Tier 3)" : "Community guidelines (Tier 1)",
    subjectKind: row.comment_id ? "comment" : "post",
    ageText: ageText(row.age_hours, asOf),
  };
}

/**
 * max_ban_term as whole days, or null. Only "N days" (PostgreSQL's interval
 * output) is read; anything else fails closed to null, so no ban is offered.
 */
export function banTermDays(value: string | null | undefined): number | null {
  const m = typeof value === "string" ? value.trim().match(/^(\d+) days?$/) : null;
  const n = m ? Number(m[1]) : NaN;
  return Number.isInteger(n) && n >= 1 ? n : null;
}
