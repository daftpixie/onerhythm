// Shared shapes for the Phase 1D social core. All data access goes through
// the session (anon-key) client — grants + RLS are the enforcement layer
// (ADR 0005); nothing here ever touches a privileged key.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

export type Client = SupabaseClient<Database>;
export type UserRole = Database["public"]["Enums"]["user_role"];

export interface AuthorSummary {
  display_name: string;
  role: UserRole;
}

export interface CommunitySummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_caregiver: boolean;
}

export interface PostListItem {
  id: string;
  /** Optional so existing fixtures stay valid; populated by the selects. */
  author_id?: string;
  title: string;
  body: string;
  created_at: string;
  author: AuthorSummary | null;
  community: { id: string; name: string; slug: string } | null;
  upbeat_count: number;
  comment_count: number;
}

export interface CommentRow {
  id: string;
  post_id: string;
  parent_comment_id: string | null;
  body: string;
  created_at: string;
  author: AuthorSummary | null;
  upbeat_count: number;
}

export interface CommentTreeNode extends CommentRow {
  children: CommentTreeNode[];
}

export interface JourneyEntry {
  id: string;
  author_id: string;
  title: string;
  body: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  author: AuthorSummary | null;
  upbeat_count: number;
}

// Exactly one subject — mirrors the DB CHECK on upbeats (one of three).
export type UpbeatSubject =
  | { postId: string; commentId?: undefined; journeyEntryId?: undefined }
  | { commentId: string; postId?: undefined; journeyEntryId?: undefined }
  | { journeyEntryId: string; postId?: undefined; commentId?: undefined };
