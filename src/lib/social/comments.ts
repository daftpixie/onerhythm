// Threaded comments: one flat fetch per thread (RLS-filtered), a pure tree
// builder keyed on parent_comment_id, and the reply write path. Siblings read
// oldest-first so a conversation reads top-down.
import type { AuthorSummary, Client, CommentRow, CommentTreeNode } from "./types";

const COMMENT_SELECT =
  "id, post_id, parent_comment_id, body, created_at, " +
  "author:profiles(display_name, role), upbeats(count)";

interface RawCommentRow {
  id: string;
  post_id: string;
  parent_comment_id: string | null;
  body: string;
  created_at: string;
  author: AuthorSummary | null;
  upbeats: { count: number }[];
}

export async function listComments(
  client: Client,
  postId: string,
): Promise<CommentRow[]> {
  const { data, error } = await client
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as RawCommentRow[]).map((row) => ({
    id: row.id,
    post_id: row.post_id,
    parent_comment_id: row.parent_comment_id,
    body: row.body,
    created_at: row.created_at,
    author: row.author,
    upbeat_count: row.upbeats?.[0]?.count ?? 0,
  }));
}

export function buildCommentTree(rows: CommentRow[]): CommentTreeNode[] {
  const byId = new Map<string, CommentTreeNode>();
  for (const row of rows) byId.set(row.id, { ...row, children: [] });
  const roots: CommentTreeNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parent_comment_id
      ? byId.get(node.parent_comment_id)
      : undefined;
    // A missing parent (not fetched / deleted) degrades to root rather than
    // dropping the comment.
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export async function createComment(
  client: Client,
  input: { postId: string; parentCommentId?: string | null; body: string },
): Promise<{ id: string }> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Sign in to reply");
  const { data, error } = await client
    .from("comments")
    .insert({
      post_id: input.postId,
      author_id: user.id,
      parent_comment_id: input.parentCommentId ?? null,
      body: input.body,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id };
}
