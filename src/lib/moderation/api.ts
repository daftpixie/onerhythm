import type { SupabaseClient } from "@supabase/supabase-js";
import { banTermDays, type QueueRow } from "./console";

// Client calls for the build step 4 member flows (ADR 0019, ADR 0021). Each
// goes through a definer function or an RLS-checked table; nothing here can
// see who reported whom.
//
// The generated database types predate the moderation migrations
// (ADR 0019 build notes: "regenerated types" not built), so these calls go
// through an untyped client.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

export type ReportReason =
  | "self_harm"
  | "dangerous_misinfo"
  | "harassment"
  | "spam_or_scam"
  | "other_safety"
  | "off_topic"
  | "unkind";

export type GateStatus = "met" | "unmet";
export interface Gates {
  G1: GateStatus;
  G2: GateStatus;
  G3: GateStatus;
}

/** File a report on a post or a comment. The note is optional and short. */
export async function reportContent(
  client: Client,
  args: { postId?: string; commentId?: string; reason: ReportReason; note?: string },
): Promise<void> {
  const { error } = await client.rpc("report_content", {
    p_post: args.postId ?? null,
    p_comment: args.commentId ?? null,
    p_reason: args.reason,
    p_note: args.note?.trim() ? args.note.trim() : null,
  });
  if (error) throw new Error(error.message);
}

/** Block a member. RLS lets a member write only their own blocks. */
export async function blockMember(client: Client, blockedId: string): Promise<void> {
  const { data: auth } = await client.auth.getUser();
  const blockerId = auth.user?.id;
  if (!blockerId) throw new Error("Not signed in.");
  const { error } = await client
    .from("member_blocks")
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error && error.code !== "23505") throw new Error(error.message);
}

/** Tier 1: ask the appeals panel. Tier 3: ask a trained person for a second look. */
export async function askAgain(
  client: Client,
  args: { actionId: string; statement: string; tier: 1 | 3 },
): Promise<void> {
  const fn = args.tier === 1 ? "submit_appeal" : "request_second_look";
  const { error } = await client.rpc(fn, { p_action: args.actionId, p_statement: args.statement });
  if (error) throw new Error(error.message);
}

/** The member's own moderation notices: actions on their content, no pseudonyms. */
export async function myModerationNotices(client: Client) {
  const { data, error } = await client.rpc("my_moderation_notices");
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{
    action_id: string | null;
    post_id: string | null;
    comment_id: string | null;
    action: string;
    floor: string | null;
    floor_item_text: string | null;
    tier1_rule: string | null;
    reason: string | null;
    ends_at: string | null;
    created_at: string;
  }>;
}

/** The gates member-facing copy reads (ADR 0021). Anything unreadable counts as unmet. */
export async function getGates(client: Client): Promise<Gates> {
  const { data } = await client.from("launch_gates").select("key, status").in("key", ["G1", "G2", "G3"]);
  const status = (key: string): GateStatus =>
    (data ?? []).find((g: { key: string; status: string }) => g.key === key)?.status === "met" ? "met" : "unmet";
  return { G1: status("G1"), G2: status("G2"), G3: status("G3") };
}

/**
 * The published crisis list, for the reader's device to match against (Q5, Q8).
 * Read once per screen as static content; nothing about the reader is sent.
 */
export async function publishedCrisisTerms(client: Client): Promise<string[]> {
  const { data } = await client.from("triage_lists").select("term").eq("list", "crisis").eq("active", true);
  return (data ?? []).map((r: { term: string }) => r.term);
}

/**
 * The tier of an action, from the member's own notice (ADR 0021). A floor item
 * means Tier 3 (never a vote); a Tier 1 rule means Tier 1. When it cannot
 * tell, it fails closed to Tier 3, so nothing unknown reaches a panel.
 */
export function tierOfNotice(
  notice: { floor: string | null; tier1_rule: string | null } | undefined,
): 1 | 3 {
  if (notice && notice.floor === null && notice.tier1_rule) return 1;
  return 3;
}

// ---------------------------------------------------------------------------
// The moderator console (build step 5). Every call goes through a definer
// function that checks is_moderator(), or a table RLS already limits. None
// returns a member id: the console holds item ids, content ids and words.
// ---------------------------------------------------------------------------

/**
 * One launch gate's status. A missing row counts as unmet; a read error
 * throws, so the console never tells a moderator "No moderators are
 * appointed yet" because the network failed.
 */
export async function getGate(client: Client, key: string): Promise<GateStatus> {
  const { data, error } = await client.from("launch_gates").select("status").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.status === "met" ? "met" : "unmet";
}

/**
 * The open queue. `refused` when the caller holds no current moderator grant
 * (moderation_queue raises 42501); other failures throw.
 */
export async function moderationQueue(
  client: Client,
): Promise<{ refused: true } | { refused: false; rows: QueueRow[] }> {
  const { data, error } = await client.rpc("moderation_queue");
  if (error) {
    if (error.code === "42501") return { refused: true };
    throw new Error(error.message);
  }
  return { refused: false, rows: (data ?? []) as QueueRow[] };
}

/**
 * An item's text, for the console's pane, read only when the moderator opens
 * it. Removed or held text lives in removed_content (moderators may read it,
 * T22); otherwise the post or comment itself. Only title and body are read,
 * never the author.
 */
export async function moderationItemContent(
  client: Client,
  subject: { postId: string | null; commentId: string | null },
): Promise<string | null> {
  const col = subject.postId ? "post_id" : "comment_id";
  const id = subject.postId ?? subject.commentId;
  if (!id) return null;
  const moved = await client.from("removed_content").select("title, body").eq(col, id).maybeSingle();
  if (moved.error) throw new Error(moved.error.message);
  const row =
    moved.data ??
    (subject.postId
      ? (await client.from("posts").select("title, body").eq("id", id).maybeSingle()).data
      : (await client.from("comments").select("body").eq("id", id).maybeSingle()).data);
  if (!row) return null;
  const { title, body } = row as { title?: string | null; body: string };
  return title ? `${title}\n\n${body}` : body;
}

/** Act on an item under the moderator's pseudonym (moderate() checks every rule again). */
export async function moderateItem(
  client: Client,
  itemId: string,
  action: {
    kind: string;
    reason: string;
    floorItemId?: string;
    tier1Rule?: string;
    endsAt?: string;
  },
): Promise<void> {
  const { error } = await client.rpc("moderate", {
    p_item: itemId,
    p_action: action.kind,
    p_floor_item: action.floorItemId ?? null,
    p_tier1_rule: action.tier1Rule ?? null,
    p_reason: action.reason,
    p_ends_at: action.endsAt ?? null,
  });
  if (error) throw new Error(error.message);
}

/** The items of the safety floor's current version (empty until G5 publishes it). */
export async function currentSafetyFloorItems(client: Client): Promise<Array<{ id: string; text: string }>> {
  const { data: version } = await client
    .from("floor_versions")
    .select("version")
    .eq("floor", "safety")
    .lte("effective_at", new Date().toISOString())
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!version) return [];
  const { data } = await client
    .from("floor_items")
    .select("id, text")
    .eq("floor", "safety")
    .eq("version", version.version)
    .order("item_number");
  return (data ?? []) as Array<{ id: string; text: string }>;
}

/** max_ban_term in whole days, or null while it is not set (G9). Fails closed. */
export async function maxBanTermDays(client: Client): Promise<number | null> {
  const { data } = await client.from("governance_config").select("value").eq("key", "max_ban_term").maybeSingle();
  return banTermDays(data?.value ?? null);
}
