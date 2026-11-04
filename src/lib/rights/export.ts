// Download my data — Addendum A B13/B14 (portability: MHMDA / GDPR / CCPA).
//
// Pure functions over a SupabaseClient, matching src/lib/consent.ts, so the DB
// tests exercise the real product code against the live stack rather than a
// mock. No React Native imports here.
//
// SCOPING — read this before changing a query. It is tempting to say "RLS
// scopes the export". That is only half true, and the half that is false is the
// dangerous half: profiles_select_authenticated is `using (true)`, so ANY
// authenticated member can read EVERY profile row. RLS genuinely scopes
// consent_records, health_self_ids and memberships; it does not scope profiles,
// and posts/comments are readable by design so the feed can work.
//
// So every query below carries an EXPLICIT owner predicate, and RLS is a
// backstop only where it happens to apply. tests/db/rights-export.test.ts
// proves the outcome with two real accounts rather than trusting either
// mechanism.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

type Client = SupabaseClient<Database>;
type Tables = Database["public"]["Tables"];

/** Bump when the document shape changes, so an old file is still identifiable. */
export const EXPORT_FORMAT_VERSION = 1;

/**
 * Every table that holds data belonging to a member. This list is checked
 * against supabase/tests/03_deletion_cascade_test.sql by the DB suite: if a
 * migration adds a member-owned table, the export and the deletion cascade must
 * both learn about it or the test fails.
 */
export const MEMBER_OWNED_TABLES = [
  "profiles",
  "consent_records",
  "health_self_ids",
  "memberships",
  "posts",
  "comments",
  "upbeats",
  "journey_entries",
  // Moderation (20261029130100, ADR 0019 §9).
  "reports",
  "member_blocks",
  "member_bans",
  "appeals",
  "second_look_requests",
  "floor_reexamination_requests",
  "removed_content",
  "moderator_grants",
  "moderator_pseudonyms",
] as const;

/**
 * Moderation rows are not in the generated `Database` types yet (they are
 * regenerated from a running stack). Until then each is a plain record; the
 * queries below still carry explicit owner predicates.
 */
type ModerationRow = Record<string, unknown>;

export interface ExportData {
  profile: Tables["profiles"]["Row"] | null;
  consent_records: Tables["consent_records"]["Row"][];
  /** Joined with the tag vocabulary so the file is readable without the code. */
  health_self_id_tags: Array<
    Tables["health_self_ids"]["Row"] & { label?: string; code?: string }
  >;
  memberships: Tables["memberships"]["Row"][];
  posts: Tables["posts"]["Row"][];
  comments: Tables["comments"]["Row"][];
  upbeats: Tables["upbeats"]["Row"][];
  journey_entries: Tables["journey_entries"]["Row"][];
  /** Reports you filed. Never who reported you, or how many did. */
  reports: ModerationRow[];
  /** People you blocked. A block on you is not shown to you. */
  member_blocks: ModerationRow[];
  /** Bans on your account, with the rule and reason; never who proposed them. */
  member_bans: ModerationRow[];
  appeals: ModerationRow[];
  second_look_requests: ModerationRow[];
  floor_reexamination_requests: ModerationRow[];
  /** Your own words from removed or held posts and comments. */
  removed_content: ModerationRow[];
  /** If you moderate or sit on a panel: your grants. */
  moderator_grants: ModerationRow[];
  /** If you moderate: your pseudonym and the panel decisions made under it. */
  moderator_pseudonyms: ModerationRow[];
}

/** Removals, locks and bans on your content, with the rule and reason. */
export type ModerationNotice = ModerationRow;

export interface ExportDocument {
  format_version: number;
  exported_at: string;
  member_id: string;
  /** Plain-language notes about what is, and is not, in this file. */
  notes: string[];
  data: ExportData;
  /** Moderation notices about your content (derived from the actions, not a table). */
  moderation_notices?: ModerationNotice[];
}

async function requireUserId(client: Client): Promise<string> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/** Throw on error rather than silently exporting an empty list. A quiet failure
 *  here would hand someone a file that understates what we hold. */
function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as T;
}

export function exportFilename(now: Date): string {
  const iso = now.toISOString().slice(0, 10);
  return `onerhythm-my-data-${iso}.json`;
}

export function serializeExport(doc: ExportDocument): string {
  // Indented: a member should be able to open this and read it, not need a tool.
  return JSON.stringify(doc, null, 2);
}

export async function collectMyData(client: Client): Promise<ExportDocument> {
  const memberId = await requireUserId(client);

  const profileRes = await client
    .from("profiles")
    .select("*")
    .eq("id", memberId)
    .maybeSingle();
  if (profileRes.error) throw new Error(profileRes.error.message);

  const consent = unwrap(
    await client.from("consent_records").select("*").eq("member_id", memberId),
  ) as Tables["consent_records"]["Row"][];

  const selfIds = unwrap(
    await client.from("health_self_ids").select("*").eq("member_id", memberId),
  ) as Tables["health_self_ids"]["Row"][];

  // Resolve the controlled vocabulary so the file says "AFib", not a uuid.
  let tagged: ExportData["health_self_id_tags"] = selfIds;
  if (selfIds.length > 0) {
    const vocab = unwrap(
      await client
        .from("self_id_tags")
        .select("id, code, label")
        .in(
          "id",
          selfIds.map((r) => r.tag_id),
        ),
    ) as Array<{ id: string; code: string; label: string }>;
    const byId = new Map(vocab.map((t) => [t.id, t]));
    tagged = selfIds.map((r) => ({
      ...r,
      code: byId.get(r.tag_id)?.code,
      label: byId.get(r.tag_id)?.label,
    }));
  }

  const memberships = unwrap(
    await client.from("memberships").select("*").eq("member_id", memberId),
  ) as Tables["memberships"]["Row"][];
  const posts = unwrap(
    await client.from("posts").select("*").eq("author_id", memberId),
  ) as Tables["posts"]["Row"][];
  const comments = unwrap(
    await client.from("comments").select("*").eq("author_id", memberId),
  ) as Tables["comments"]["Row"][];
  const upbeats = unwrap(
    await client.from("upbeats").select("*").eq("member_id", memberId),
  ) as Tables["upbeats"]["Row"][];
  const journeyEntries = unwrap(
    await client.from("journey_entries").select("*").eq("author_id", memberId),
  ) as Tables["journey_entries"]["Row"][];

  // Moderation rows the member can read directly. RLS scopes each table to
  // the member; the predicates say so explicitly as well.
  const untyped = client as unknown as SupabaseClient;
  const own = async (table: string, column: string, columns = "*"): Promise<ModerationRow[]> =>
    unwrap(await untyped.from(table).select(columns).eq(column, memberId)) as unknown as ModerationRow[];
  // The queue's item link and the panel's label for an appellant are internal,
  // so they are left out; everything the member wrote or chose is in.
  const reports = await own(
    "reports",
    "reporter_id",
    "id, post_id, comment_id, reason, note, created_at",
  );
  const memberBlocks = await own("member_blocks", "blocker_id");
  const appeals = await own(
    "appeals",
    "appellant_id",
    "id, action_id, statement, state, outcome, outcome_reason, created_at, decided_at",
  );
  const secondLooks = await own("second_look_requests", "requester_id");
  const reexams = await own("floor_reexamination_requests", "requester_id");
  const removedContent = await own("removed_content", "author_id");

  // Rows with no member table grant come through definer functions that
  // answer only for the caller and never return another person's pseudonym.
  const modRes = await untyped.rpc("export_my_moderation_records");
  if (modRes.error) throw new Error(modRes.error.message);
  const mod = (modRes.data ?? {}) as {
    member_bans?: ModerationRow[];
    moderator_grants?: ModerationRow[];
    moderator_pseudonyms?: ModerationRow[];
  };
  const noticesRes = await untyped.rpc("my_moderation_notices");
  if (noticesRes.error) throw new Error(noticesRes.error.message);

  const notes = [
    "This file holds everything OneRhythm stores about you.",
    "We hold no clinical or medical records of any kind — never have, by design.",
    "Your upbeats are listed one per row. There is no downvote to list: we don't have one.",
  ];
  if (tagged.length === 0) {
    notes.push(
      "No health self-ID tags are included. Either you never added any, or you " +
        "turned health self-ID off — in which case they were deleted at that " +
        "moment, not hidden.",
    );
  }

  return {
    format_version: EXPORT_FORMAT_VERSION,
    exported_at: new Date().toISOString(),
    member_id: memberId,
    notes,
    data: {
      profile: profileRes.data ?? null,
      consent_records: consent,
      health_self_id_tags: tagged,
      memberships,
      posts,
      comments,
      upbeats,
      journey_entries: journeyEntries,
      reports,
      member_blocks: memberBlocks,
      member_bans: mod.member_bans ?? [],
      appeals,
      second_look_requests: secondLooks,
      floor_reexamination_requests: reexams,
      removed_content: removedContent,
      moderator_grants: mod.moderator_grants ?? [],
      moderator_pseudonyms: mod.moderator_pseudonyms ?? [],
    },
    moderation_notices: (noticesRes.data ?? []) as ModerationNotice[],
  };
}
