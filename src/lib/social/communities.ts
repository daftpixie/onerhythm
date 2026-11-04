// Communities + self-managed membership. Anon may list communities (the
// approved public-discovery surface); everything else requires a session.
// Duplicate joins resolve at the DB unique constraint, surfaced as a handled
// no-op — the constraint is the arbiter, not client state.
import type { Client, CommunitySummary } from "./types";

export async function listCommunities(
  client: Client,
): Promise<CommunitySummary[]> {
  const { data, error } = await client
    .from("communities")
    .select("id, slug, name, description, is_caregiver")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCommunityBySlug(
  client: Client,
  slug: string,
): Promise<CommunitySummary | null> {
  const { data, error } = await client
    .from("communities")
    .select("id, slug, name, description, is_caregiver")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listMyMembershipCommunityIds(
  client: Client,
): Promise<string[]> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return [];
  const { data, error } = await client
    .from("memberships")
    .select("community_id")
    .eq("member_id", user.id);
  if (error) throw error;
  return (data ?? []).map((row) => row.community_id);
}

export async function joinCommunity(
  client: Client,
  communityId: string,
): Promise<void> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Sign in to join a community");
  const { error } = await client
    .from("memberships")
    .insert({ member_id: user.id, community_id: communityId });
  // 23505 = already a member: joining twice is a no-op, not an error.
  if (error && error.code !== "23505") throw error;
}

export async function leaveCommunity(
  client: Client,
  communityId: string,
): Promise<void> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Sign in to manage your communities");
  const { error } = await client
    .from("memberships")
    .delete()
    .match({ member_id: user.id, community_id: communityId });
  if (error) throw error;
}
