// Upbeats are PRESENCE/ABSENCE rows — the row's existence is the whole
// signal (no value, weight, or direction anywhere). Add = insert; remove =
// delete; a duplicate insert hits the unique constraint (23505) and resolves
// as "already", a handled state. The DB constraint arbitrates races.
import type { Client, UpbeatSubject } from "./types";

function subjectColumns(
  subject: UpbeatSubject,
): { post_id: string } | { comment_id: string } | { journey_entry_id: string } {
  if (subject.postId !== undefined) return { post_id: subject.postId };
  if (subject.commentId !== undefined) return { comment_id: subject.commentId };
  return { journey_entry_id: subject.journeyEntryId };
}

export async function addUpbeat(
  client: Client,
  subject: UpbeatSubject,
): Promise<"added" | "already"> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Sign in to upbeat");
  const { error } = await client
    .from("upbeats")
    .insert({ member_id: user.id, ...subjectColumns(subject) });
  if (error?.code === "23505") return "already";
  if (error) throw error;
  return "added";
}

export async function removeUpbeat(
  client: Client,
  subject: UpbeatSubject,
): Promise<void> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Sign in to upbeat");
  const { error } = await client
    .from("upbeats")
    .delete()
    .match({ member_id: user.id, ...subjectColumns(subject) });
  if (error) throw error;
}

export async function listMyUpbeats(
  client: Client,
  ids: { postIds?: string[]; commentIds?: string[]; journeyEntryIds?: string[] },
): Promise<{ postIds: string[]; commentIds: string[]; journeyEntryIds: string[] }> {
  const {
    data: { user },
  } = await client.auth.getUser();
  const result = {
    postIds: [] as string[],
    commentIds: [] as string[],
    journeyEntryIds: [] as string[],
  };
  if (!user) return result;

  if (ids.postIds?.length) {
    const { data, error } = await client
      .from("upbeats")
      .select("post_id")
      .eq("member_id", user.id)
      .in("post_id", ids.postIds);
    if (error) throw error;
    result.postIds = (data ?? [])
      .map((row) => row.post_id)
      .filter((id): id is string => id !== null);
  }
  if (ids.commentIds?.length) {
    const { data, error } = await client
      .from("upbeats")
      .select("comment_id")
      .eq("member_id", user.id)
      .in("comment_id", ids.commentIds);
    if (error) throw error;
    result.commentIds = (data ?? [])
      .map((row) => row.comment_id)
      .filter((id): id is string => id !== null);
  }
  if (ids.journeyEntryIds?.length) {
    const { data, error } = await client
      .from("upbeats")
      .select("journey_entry_id")
      .eq("member_id", user.id)
      .in("journey_entry_id", ids.journeyEntryIds);
    if (error) throw error;
    result.journeyEntryIds = (data ?? [])
      .map((row) => row.journey_entry_id)
      .filter((id): id is string => id !== null);
  }
  return result;
}
