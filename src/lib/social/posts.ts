// Posts: feed (joined communities, newest first), community lists, detail,
// and the composer write path. Counts are aggregates per fetch — the
// denormalized upbeat_count stays deferred so the score remains exactly
// count(upbeats) (ADR 0003 #9). The author is ALWAYS the session user; RLS
// WITH CHECK is the enforcement, this code just never claims otherwise.
import type { AuthorSummary, Client, PostListItem } from "./types";
import { listMyMembershipCommunityIds } from "./communities";

const POST_SELECT =
  "id, author_id, title, body, created_at, " +
  "author:profiles(display_name, role), " +
  "community:communities(id, name, slug), " +
  "upbeats(count), comments(count)";

interface RawPostRow {
  id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  author: AuthorSummary | null;
  community: { id: string; name: string; slug: string } | null;
  upbeats: { count: number }[];
  comments: { count: number }[];
}

function toPostListItem(row: RawPostRow): PostListItem {
  return {
    id: row.id,
    author_id: row.author_id,
    title: row.title,
    body: row.body,
    created_at: row.created_at,
    author: row.author,
    community: row.community,
    upbeat_count: row.upbeats?.[0]?.count ?? 0,
    comment_count: row.comments?.[0]?.count ?? 0,
  };
}

export async function getFeed(client: Client): Promise<PostListItem[]> {
  const communityIds = await listMyMembershipCommunityIds(client);
  if (communityIds.length === 0) return [];
  const { data, error } = await client
    .from("posts")
    .select(POST_SELECT)
    .in("community_id", communityIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as RawPostRow[]).map(toPostListItem);
}

export async function listCommunityPosts(
  client: Client,
  communityId: string,
): Promise<PostListItem[]> {
  const { data, error } = await client
    .from("posts")
    .select(POST_SELECT)
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as RawPostRow[]).map(toPostListItem);
}

export async function getPost(
  client: Client,
  postId: string,
): Promise<PostListItem | null> {
  const { data, error } = await client
    .from("posts")
    .select(POST_SELECT)
    .eq("id", postId)
    .maybeSingle();
  if (error) throw error;
  return data ? toPostListItem(data as unknown as RawPostRow) : null;
}

export async function createPost(
  client: Client,
  input: { communityId: string; title: string; body: string },
): Promise<{ id: string }> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Sign in to share a post");
  const { data, error } = await client
    .from("posts")
    .insert({
      author_id: user.id,
      community_id: input.communityId,
      title: input.title,
      body: input.body,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id };
}
