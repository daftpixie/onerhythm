// Journey entries — member-owned long-form pages (1B table + RLS; ADR 0009).
// Draft privacy is enforced by RLS (published-or-own), not client filtering;
// the explicit filters here are belt-and-braces on top of that layer. Session
// client only, like every other module in src/lib/social.
import type { AuthorSummary, Client, JourneyEntry } from "./types";

const JOURNEY_SELECT =
  "id, author_id, title, body, is_published, created_at, updated_at, " +
  "author:profiles(display_name, role), upbeats(count)";

interface RawJourneyRow {
  id: string;
  author_id: string;
  title: string;
  body: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  author: AuthorSummary | null;
  upbeats: { count: number }[];
}

function toJourneyEntry(row: RawJourneyRow): JourneyEntry {
  return {
    id: row.id,
    author_id: row.author_id,
    title: row.title,
    body: row.body,
    is_published: row.is_published,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: row.author,
    upbeat_count: row.upbeats?.[0]?.count ?? 0,
  };
}

export async function listMyJourneyEntries(
  client: Client,
): Promise<JourneyEntry[]> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return [];
  const { data, error } = await client
    .from("journey_entries")
    .select(JOURNEY_SELECT)
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as RawJourneyRow[]).map(toJourneyEntry);
}

export async function listMemberJourneyEntries(
  client: Client,
  memberId: string,
): Promise<JourneyEntry[]> {
  const { data, error } = await client
    .from("journey_entries")
    .select(JOURNEY_SELECT)
    .eq("author_id", memberId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as RawJourneyRow[]).map(toJourneyEntry);
}

export async function getJourneyEntry(
  client: Client,
  id: string,
): Promise<JourneyEntry | null> {
  const { data, error } = await client
    .from("journey_entries")
    .select(JOURNEY_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toJourneyEntry(data as unknown as RawJourneyRow) : null;
}

export async function createJourneyEntry(
  client: Client,
  input: { title: string; body: string },
): Promise<{ id: string }> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Sign in to write your journey");
  const { data, error } = await client
    .from("journey_entries")
    .insert({ author_id: user.id, title: input.title, body: input.body })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id };
}

export async function updateJourneyEntry(
  client: Client,
  id: string,
  input: { title: string; body: string },
): Promise<void> {
  const { error } = await client
    .from("journey_entries")
    .update({
      title: input.title,
      body: input.body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function setJourneyPublished(
  client: Client,
  id: string,
  published: boolean,
): Promise<void> {
  const { error } = await client
    .from("journey_entries")
    .update({ is_published: published, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteJourneyEntry(
  client: Client,
  id: string,
): Promise<void> {
  const { error } = await client.from("journey_entries").delete().eq("id", id);
  if (error) throw error;
}
