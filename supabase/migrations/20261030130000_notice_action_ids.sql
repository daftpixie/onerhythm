-- OneRhythm — the author's moderation notices carry the action id.
--
-- Build step 4 (ADR 0022): a removal or lock notice offers "Ask us to look
-- again", which needs the id of that action (submit_appeal for Tier 1,
-- request_second_look for Tier 3). my_moderation_notices() already returns
-- only the caller's own content's actions, and never a pseudonym (T22); the
-- id names an action, not a person. A ban row has no action id (null).
--
-- Forward-only. The return type changes, so the function is dropped and
-- created again, and its EXECUTE is set again exactly as 20261029130200
-- set it: authenticated only (06_function_execute_allowlist).
-- Pinned by supabase/tests/24_notice_action_ids_test.sql.

drop function public.my_moderation_notices();

create function public.my_moderation_notices()
returns table (action_id uuid, post_id uuid, comment_id uuid, action public.moderation_action_kind,
               floor public.floor_name, floor_version integer, floor_item_number integer,
               floor_item_text text, tier1_rule public.tier1_rule, reason text,
               ends_at timestamptz, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, i.post_id, i.comment_id, a.action, f.floor, f.version, f.item_number, f.text,
         a.tier1_rule, a.reason, a.ends_at, a.created_at
    from public.moderation_actions a
    join public.moderation_items i on i.id = a.item_id
    left join public.floor_items f on f.id = a.floor_item_id
    left join public.posts p on p.id = i.post_id
    left join public.comments c on c.id = i.comment_id
   where a.action in ('remove', 'lock', 'context_note')
     and coalesce(p.author_id, c.author_id) = (select auth.uid())
  union all
  select null, null, null, 'temporary_ban', f.floor, f.version, f.item_number, f.text,
         null, b.reason, b.ends_at, b.created_at
    from public.member_bans b
    join public.floor_items f on f.id = b.floor_item_id
   where b.member_id = (select auth.uid()) and b.confirmed_at is not null
  order by 12;
$$;

revoke execute on function public.my_moderation_notices()
  from public, anon, authenticated, service_role;
grant execute on function public.my_moderation_notices() to authenticated;
