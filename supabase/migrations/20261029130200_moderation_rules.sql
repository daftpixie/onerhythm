-- OneRhythm — moderation build step 3, part 3 of 3: policies, triggers and
-- functions on the tables part 2 created.
--
-- Sources: ADR 0019, ADR 0020, ADR 0021 (accepted 2026-10-29). Tests:
-- supabase/tests/10_ to 21_ (T1-T4, T6, T7, T9, T10, T13, T16-T19, T22, T23,
-- the database half of T8) and tests/unit/moderation-invariants.test.ts (T4,
-- T8, T11).
--
-- Error codes (ADR 0019 §4), so a test cannot pass on an unrelated error:
--   42501  a rule about WHO may act;
--   23514  a rule about the SHAPE of the data.
--
-- Every function: SECURITY DEFINER unless it is a plain trigger guard,
-- `set search_path = ''`, fully qualified names. Since 20261029120000 no
-- function in `public` starts with client EXECUTE; this file grants it only
-- where the matrix below says so.
--
-- ---------------------------------------------------------------------------
-- EXECUTE MATRIX
-- ---------------------------------------------------------------------------
--   function                         | anon | authenticated | service_role
--   ---------------------------------+------+---------------+-------------
--   is_moderator()                   |  -   |       X       |      X
--   moderation_private.              |  -   |       X  (1)  |      X
--     is_blocked_between(uuid, uuid) |      |               |
--   is_banned_now()                  |  -   |       X  (2)  |      X
--   report_content(...)              |  -   |       X       |      -
--   moderation_queue()               |  -   |       X  (3)  |      -
--   moderate(...)                    |  -   |       X  (3)  |      -
--   confirm_action(uuid)             |  -   |       X  (3)  |      -
--   submit_appeal(uuid, text)        |  -   |       X  (4)  |      -
--   withdraw_appeal(uuid)            |  -   |       X  (4)  |      -
--   request_second_look(uuid, text)  |  -   |       X  (4)  |      -
--   decide_appeal(uuid, choice)      |  -   |       X  (5)  |      -
--   my_moderation_notices()          |  -   |       X  (6)  |      -
--   export_my_moderation_records()   |  -   |       X  (6)  |      -
--   interim_moderators_public()      |  X   |       X       |      X
--   grant_moderator(...)             |  -   |       -       |      X
--   has_current_consent(uuid, ...)   |  -   |       -       |      X
--   (internal helpers and trigger functions: no EXECUTE for anon,
--   authenticated or service_role; they run inside the functions above)
--
--   (1) Used by the posts/comments read policies; answers only when the
--       caller is one of the two members. In a schema PostgREST does not
--       expose (supabase/config.toml: public, graphql_public), so it is not
--       an RPC.
--   (2) Used by the posts/comments insert policies; takes no argument and
--       answers only for the caller.
--   (3) Raises 42501 unless the caller holds a current moderator grant.
--   (4) Raises 42501 unless the caller wrote the content.
--   (5) Raises 42501 unless the caller holds a current panelist grant and has
--       no conflict of interest.
--   (6) The caller's own records only; never a pseudonym.

-- ===========================================================================
-- 1. Internal helpers
-- ===========================================================================

-- The audit trail: role, time, function, table, row count. No member id.
create function public.moderation_audit_write(
  p_role text, p_function text, p_table text, p_rows integer)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.moderation_audit (actor_role, function_name, table_name, row_count)
  values (p_role, p_function, p_table, greatest(coalesce(p_rows, 0), 0));
$$;

-- ADR 0019 §6: the only way moderation code touches consent_records. A
-- boolean only. No client role holds EXECUTE (section 15), so it answers only
-- for the definer functions in this file and for service_role. A client never
-- learns another member's consent state through it.
create function public.has_current_consent(p_member uuid, p_purpose public.consent_purpose)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
       select 1 from public.consent_records c
        where c.member_id = p_member
          and c.purpose = p_purpose
          and c.withdrawn_at is null);
$$;

create function public.config_interval(p_key text)
returns interval
language sql
stable
security definer
set search_path = ''
as $$
  select value from public.governance_config where key = p_key;
$$;

create function public.gate_is_met(p_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select status = 'met' from public.launch_gates where key = p_key), false);
$$;

-- A current grant of p_role for the caller: unexpired, unrevoked, started,
-- and for an interim grant, a public name under current naming consent.
create function public.has_current_grant(p_role public.moderation_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.moderator_grants g
     where g.member_id = (select auth.uid())
       and g.role = p_role
       and g.revoked_at is null
       and g.granted_at <= now()
       and g.expires_at > now()
       and (g.basis <> 'interim'
            or (g.public_name is not null
                and public.has_current_consent(g.member_id, 'moderator_public_name'))));
$$;

-- Is the caller's current grant of p_role interim? (Interim limits, T24.)
create function public.current_grant_is_interim(p_role public.moderation_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.moderator_grants g
     where g.member_id = (select auth.uid())
       and g.role = p_role and g.basis = 'elected'
       and g.revoked_at is null and g.granted_at <= now() and g.expires_at > now());
$$;

-- The caller's pseudonym. Every read is logged (Q4).
create function public.caller_pseudonym(p_function text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pseudonym text;
begin
  select pseudonym into v_pseudonym
    from public.moderator_pseudonyms where member_id = (select auth.uid());
  perform public.moderation_audit_write('moderator', p_function, 'moderator_pseudonyms',
    case when v_pseudonym is null then 0 else 1 end);
  return v_pseudonym;
end;
$$;

-- Who wrote an item's content, and did a given member report it? Used only by
-- the conflict-of-interest checks (ADR 0019 §5).
create function public.item_author(p_item uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.author_id from public.moderation_items i
       join public.posts p on p.id = i.post_id where i.id = p_item),
    (select c.author_id from public.moderation_items i
       join public.comments c on c.id = i.comment_id where i.id = p_item));
$$;

create function public.member_reported_item_subject(p_member uuid, p_item uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.moderation_items i
      join public.reports r
        on (i.post_id is not null and r.post_id = i.post_id)
        or (i.comment_id is not null and r.comment_id = i.comment_id)
     where i.id = p_item and r.reporter_id = p_member);
$$;

-- Moves a post's or comment's text to removed_content and leaves the public
-- row with an empty body (ADR 0019 §2, T22).
create function public.move_text_out(
  p_post uuid, p_comment uuid, p_kind public.removed_content_kind,
  p_state public.content_moderation_state, p_floor_item uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_post is not null then
    insert into public.removed_content (post_id, author_id, title, body, kind)
      select p.id, p.author_id, p.title, p.body, p_kind
        from public.posts p where p.id = p_post and p.body <> ''
    on conflict (post_id) do nothing;
    update public.posts
       set title = '', body = '', moderation_state = p_state,
           removed_at = case when p_state = 'removed' then now() else removed_at end,
           removed_under = coalesce(p_floor_item, removed_under)
     where id = p_post;
  else
    insert into public.removed_content (comment_id, author_id, title, body, kind)
      select c.id, c.author_id, null, c.body, p_kind
        from public.comments c where c.id = p_comment and c.body <> ''
    on conflict (comment_id) do nothing;
    update public.comments
       set body = '', moderation_state = p_state,
           removed_at = case when p_state = 'removed' then now() else removed_at end,
           removed_under = coalesce(p_floor_item, removed_under)
     where id = p_comment;
  end if;
end;
$$;

create function public.move_text_back(p_post uuid, p_comment uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.removed_content%rowtype;
begin
  select * into v from public.removed_content
   where (p_post is not null and post_id = p_post)
      or (p_comment is not null and comment_id = p_comment);
  if not found then
    raise exception 'nothing to restore' using errcode = '23514';
  end if;
  if p_post is not null then
    update public.posts
       set title = coalesce(v.title, ''), body = v.body, moderation_state = 'visible',
           removed_at = null, removed_under = null
     where id = p_post;
  else
    update public.comments
       set body = v.body, moderation_state = 'visible', removed_at = null, removed_under = null
     where id = p_comment;
  end if;
  delete from public.removed_content where id = v.id;
end;
$$;

-- ===========================================================================
-- 2. Client-callable predicates
-- ===========================================================================
create function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_current_grant('moderator');
$$;

comment on function public.is_moderator() is
  'True only for a current, unexpired, unrevoked moderator grant for auth.uid() '
  '(and, for an interim grant, current naming consent). profiles.role alone is not enough.';

-- Not in `public`, so PostgREST does not expose it as an RPC: a blocked member
-- cannot ask "has X blocked me?" (privacy review, round 1). The read policies
-- on posts and comments still call it, so `authenticated` keeps EXECUTE.
create schema moderation_private;
revoke all on schema moderation_private from public;
grant usage on schema moderation_private to authenticated, service_role;

create function moderation_private.is_blocked_between(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  -- Answers only when the caller is one of the two, and only about members
  -- who have written a post or comment. For them, the hidden posts already
  -- show the block to anyone comparing two accounts. For anyone else it says
  -- false, so it cannot be used to find out who blocked you.
  select coalesce((select auth.uid()) in (p_a, p_b), false)
     and (exists (select 1 from public.posts
                   where author_id = case when p_a = (select auth.uid()) then p_b else p_a end)
          or exists (select 1 from public.comments
                   where author_id = case when p_a = (select auth.uid()) then p_b else p_a end))
     and exists (
       select 1 from public.member_blocks b
        where (b.blocker_id = p_a and b.blocked_id = p_b)
           or (b.blocker_id = p_b and b.blocked_id = p_a));
$$;

create function public.is_banned_now()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.member_bans b
     where b.member_id = (select auth.uid())
       and b.confirmed_at is not null
       and b.ends_at > now());
$$;

-- ===========================================================================
-- 3. Policies
-- ===========================================================================

-- Public, read-only surfaces.
create policy governance_config_read on public.governance_config
  for select to anon, authenticated using (true);
create policy floor_versions_read on public.floor_versions
  for select to anon, authenticated using (true);
create policy floor_items_read on public.floor_items
  for select to anon, authenticated using (true);
create policy floor_reexamination_answers_read on public.floor_reexamination_answers
  for select to anon, authenticated using (true);
create policy moderation_log_public_read on public.moderation_log_public
  for select to anon, authenticated using (true);
create policy launch_gates_read on public.launch_gates
  for select to anon, authenticated using (true);
create policy launch_gate_history_read on public.launch_gate_history
  for select to anon, authenticated using (true);
-- Q5: the crisis and misinformation lists are published in full. Spam and scam
-- terms are not (publishing them would teach spammers the list).
create policy triage_lists_read_published on public.triage_lists
  for select to anon, authenticated using (list in ('crisis', 'misinfo'));

-- A member's own rows.
create policy floor_reexamination_requests_own on public.floor_reexamination_requests
  for select to authenticated using (requester_id = (select auth.uid()));
create policy floor_reexamination_requests_insert_own on public.floor_reexamination_requests
  for insert to authenticated
  with check (requester_id = (select auth.uid()) and state = 'submitted');
-- No moderator policy on reports (T6).
create policy reports_own on public.reports
  for select to authenticated using (reporter_id = (select auth.uid()));
create policy appeals_own on public.appeals
  for select to authenticated using (appellant_id = (select auth.uid()));
create policy second_look_requests_own on public.second_look_requests
  for select to authenticated using (requester_id = (select auth.uid()));
-- Blocks: the blocker only. Never the blocked member, never moderators (T13, T23).
create policy member_blocks_own on public.member_blocks
  for select to authenticated using (blocker_id = (select auth.uid()));
create policy member_blocks_insert_own on public.member_blocks
  for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy member_blocks_delete_own on public.member_blocks
  for delete to authenticated using (blocker_id = (select auth.uid()));

-- Moderators (the column grant on moderation_items limits what they see).
create policy moderation_items_moderators on public.moderation_items
  for select to authenticated using ((select public.is_moderator()));
create policy moderation_actions_moderators on public.moderation_actions
  for select to authenticated using ((select public.is_moderator()));
-- Removed text: the author and moderators only (T22).
create policy removed_content_author_or_moderator on public.removed_content
  for select to authenticated
  using (author_id = (select auth.uid()) or (select public.is_moderator()));

-- posts and comments: a block hides both ways (T13); a confirmed, current ban
-- stops new posts and comments and edits to old ones; a removed or held post
-- cannot be edited back by its author; nobody comments in a locked thread.
drop policy posts_select_authenticated on public.posts;
create policy posts_select_authenticated on public.posts
  for select to authenticated
  using (not moderation_private.is_blocked_between((select auth.uid()), author_id));
drop policy posts_insert_author on public.posts;
create policy posts_insert_author on public.posts
  for insert to authenticated
  with check (author_id = (select auth.uid()) and not (select public.is_banned_now()));
drop policy posts_update_author on public.posts;
create policy posts_update_author on public.posts
  for update to authenticated
  using (author_id = (select auth.uid()) and moderation_state <> 'removed'
         and not exists (select 1 from public.removed_content rc
                          where rc.post_id = posts.id and rc.kind = 'held'))
  with check (author_id = (select auth.uid()) and not (select public.is_banned_now()));

drop policy comments_select_authenticated on public.comments;
create policy comments_select_authenticated on public.comments
  for select to authenticated
  using (not moderation_private.is_blocked_between((select auth.uid()), author_id));
drop policy comments_insert_author on public.comments;
create policy comments_insert_author on public.comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and not (select public.is_banned_now())
    and not exists (select 1 from public.posts p
                     where p.id = post_id and p.moderation_state = 'locked'));
drop policy comments_update_author on public.comments;
create policy comments_update_author on public.comments
  for update to authenticated
  using (author_id = (select auth.uid()) and moderation_state <> 'removed'
         and not exists (select 1 from public.removed_content rc
                          where rc.comment_id = comments.id and rc.kind = 'held'))
  with check (author_id = (select auth.uid()) and not (select public.is_banned_now()));

-- ===========================================================================
-- 4. Content guards: members cannot set moderation columns themselves, and a
--    removal may cite only a safety-floor item.
-- ===========================================================================
create function public.guard_content_moderation_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      if new.moderation_state <> 'visible' or new.removed_at is not null
         or new.removed_under is not null then
        raise exception 'moderation columns are set by moderation functions only'
          using errcode = '42501';
      end if;
    elsif new.moderation_state is distinct from old.moderation_state
       or new.removed_at is distinct from old.removed_at
       or new.removed_under is distinct from old.removed_under then
      raise exception 'moderation columns are set by moderation functions only'
        using errcode = '42501';
    end if;
  end if;
  if new.removed_under is not null and not exists (
       select 1 from public.floor_items f
        where f.id = new.removed_under and f.floor = 'safety') then
    raise exception 'a removal may cite only a safety-floor item' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger posts_guard_moderation_columns
  before insert or update on public.posts
  for each row execute function public.guard_content_moderation_columns();
create trigger comments_guard_moderation_columns
  before insert or update on public.comments
  for each row execute function public.guard_content_moderation_columns();

-- ===========================================================================
-- 5. The floors (ADR 0020 point 4)
-- ===========================================================================
create function public.floor_versions_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_previous integer;
  v_minimum  interval;
begin
  new.recorded_at := now();

  select max(version) into v_previous from public.floor_versions where floor = new.floor;

  -- `initial` only once, and a floor's first version must be `initial`.
  if new.change_kind = 'initial' and v_previous is not null then
    raise exception 'initial is allowed only for a floor with no earlier version'
      using errcode = '23514';
  end if;
  if new.change_kind <> 'initial' and v_previous is null then
    raise exception 'a floor''s first version must be initial' using errcode = '23514';
  end if;
  if new.version <> coalesce(v_previous, 0) + 1 then
    raise exception 'a floor version must be the previous version plus one'
      using errcode = '23514';
  end if;

  -- A change is announced when it is published (this insert), never
  -- back-dated: otherwise a loosening could be inserted already past its
  -- notice, or a tighten already in force. Five minutes allows for the clock
  -- of the service that writes the row.
  if new.change_kind <> 'initial' and new.announced_at < now() - interval '5 minutes' then
    raise exception 'a floor change is announced when it is published, never back-dated'
      using errcode = '23514';
  end if;

  if new.change_kind = 'loosen' then
    v_minimum := public.config_interval('minimum_notice');
    if v_minimum is null then
      raise exception 'no loosening while minimum_notice is not set' using errcode = '23514';
    end if;
    if new.notice_ends_at is not null and new.notice_ends_at < new.announced_at + v_minimum then
      raise exception 'a loosening needs at least the minimum notice' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger floor_versions_rules
  before insert on public.floor_versions
  for each row execute function public.floor_versions_rules();

-- Checks the finished set of items at commit, because the version row is
-- inserted before its items. A tighten keeps every item of the previous
-- version word for word; it may only add. Other kinds need at least one item.
create function public.floor_versions_check_items()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.change_kind in ('tighten', 'tighten_emergency') then
    if exists (
      select 1 from public.floor_items prev
       where prev.floor = new.floor and prev.version = new.version - 1
         and not exists (
           select 1 from public.floor_items cur
            where cur.floor = new.floor and cur.version = new.version
              and cur.item_number = prev.item_number and cur.text = prev.text)) then
      raise exception 'a tighten cannot drop or rewrite an item; record it as loosen'
        using errcode = '23514';
    end if;
  elsif not exists (select 1 from public.floor_items i
                     where i.floor = new.floor and i.version = new.version) then
    raise exception 'every floor version has at least one item' using errcode = '23514';
  end if;
  return null;
end;
$$;

create constraint trigger floor_versions_check_items
  after insert on public.floor_versions
  deferrable initially deferred
  for each row execute function public.floor_versions_check_items();

-- Every change goes to the public log history, pointing at the version row
-- that holds the reason.
create function public.floor_versions_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.moderation_log_public (week_start, kind, scope, action, fewer_than_five)
  values (date_trunc('week', now())::date, 'floor_change', 'floor:' || new.floor::text,
          'version:' || new.version::text, false);
  return null;
end;
$$;

create trigger floor_versions_log
  after insert on public.floor_versions
  for each row execute function public.floor_versions_log();

create function public.floor_items_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.floor_versions%rowtype;
begin
  select * into v from public.floor_versions where floor = new.floor and version = new.version;
  -- Items are published with their version, in the same transaction, and
  -- never added afterwards (published rows are never rewritten).
  if found and v.recorded_at <> now() then
    raise exception 'items are added only in the transaction that publishes their version'
      using errcode = '23514';
  end if;
  if exists (select 1 from public.floor_versions
              where floor = new.floor and version > new.version) then
    raise exception 'items cannot be added to a version that has been superseded'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger floor_items_rules
  before insert on public.floor_items
  for each row execute function public.floor_items_rules();

-- Published rows are never rewritten or deleted, by any role (ADR 0020).
-- A genuine correction is an owner-run migration with its own ADR.
create function public.refuse_rewrite()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% rows are never rewritten or deleted; publish a new version', tg_table_name
    using errcode = '23514';
end;
$$;

create trigger floor_versions_never_rewritten
  before update or delete on public.floor_versions
  for each row execute function public.refuse_rewrite();
create trigger floor_versions_never_truncated
  before truncate on public.floor_versions
  for each statement execute function public.refuse_rewrite();
create trigger floor_items_never_rewritten
  before update or delete on public.floor_items
  for each row execute function public.refuse_rewrite();
create trigger floor_items_never_truncated
  before truncate on public.floor_items
  for each statement execute function public.refuse_rewrite();
create trigger launch_gate_history_never_rewritten
  before update or delete on public.launch_gate_history
  for each row execute function public.refuse_rewrite();
create trigger launch_gate_history_never_truncated
  before truncate on public.launch_gate_history
  for each statement execute function public.refuse_rewrite();
create trigger launch_gates_never_deleted
  before delete on public.launch_gates
  for each row execute function public.refuse_rewrite();

-- ===========================================================================
-- 6. Launch gates: every change leaves a history row and a log row.
-- ===========================================================================
create function public.launch_gates_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.key <> old.key or new.title <> old.title then
    raise exception 'a gate''s key and title do not change' using errcode = '23514';
  end if;
  if new.status is distinct from old.status or new.definition is distinct from old.definition then
    insert into public.launch_gate_history (gate_key, old_status, new_status, definition)
    values (new.key, old.status, new.status, new.definition);
    insert into public.moderation_log_public (week_start, kind, scope, action, fewer_than_five)
    values (date_trunc('week', now())::date, 'gate_change', 'gate:' || new.key,
            case when new.status is distinct from old.status then new.status::text
                 else 'defined' end, false);
  end if;
  return new;
end;
$$;

create trigger launch_gates_history
  after update on public.launch_gates
  for each row execute function public.launch_gates_history();

-- ===========================================================================
-- 7. The public log: nothing that needs the small-community threshold while
--    it is NULL (G9, founder decision 2026-10-29).
-- ===========================================================================
create function public.moderation_log_public_threshold()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.scope like 'community:%' and (
       select int_value from public.governance_config
        where key = 'small_community_threshold') is null then
    raise exception 'no per-community rows until the small-community threshold is set (G9)'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger moderation_log_public_threshold
  after insert on public.moderation_log_public
  for each row execute function public.moderation_log_public_threshold();

-- ===========================================================================
-- 8. Moderation items: tier changes, closing, report counts
-- ===========================================================================
create function public.moderation_items_tier_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- A Tier 3 item is never re-tiered into something a vote could decide (T7).
  if old.tier = 3 and new.tier <> 3 then
    raise exception 'a Tier 3 item cannot be moved to Tier 1' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger moderation_items_tier_guard
  before update of tier on public.moderation_items
  for each row execute function public.moderation_items_tier_guard();

-- Once a moderator has acted, or the item closes, report notes are purged:
-- they have done their job. A closed crisis item is reduced to a count: its
-- reports are deleted, its subject cleared, and every action reason on it
-- replaced with a fixed line, because the reason may describe the author's
-- mental health (ADR 0019 §8). None of this needs a G9 value (ADR 0019,
-- Consequences 1).
create function public.moderation_items_on_close()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.state in ('actioned', 'closed') and old.state not in ('actioned', 'closed') then
    update public.reports set note = null where item_id = new.id and note is not null;
  end if;
  if new.state = 'closed' and old.state <> 'closed' then
    update public.reports set note = null where item_id = new.id and note is not null;
    if new.category = 'crisis' then
      delete from public.reports where item_id = new.id;
      update public.moderation_actions set reason = 'Closed crisis item.'
       where item_id = new.id and reason <> 'Closed crisis item.';
      update public.moderation_items
         set post_id = null, comment_id = null, closed_at = coalesce(closed_at, now())
       where id = new.id;
    end if;
  end if;
  return null;
end;
$$;

create trigger moderation_items_on_close
  after update of state on public.moderation_items
  for each row execute function public.moderation_items_on_close();

-- When a reporter's account is deleted, report_count drops.
create function public.reports_count_on_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.moderation_items
     set report_count = greatest(report_count - 1, 0)
   where id = old.item_id;
  return null;
end;
$$;

create trigger reports_count_on_delete
  after delete on public.reports
  for each row execute function public.reports_count_on_delete();

-- ===========================================================================
-- 9. Actions: a floor item only on a Tier 3 item, a Tier 1 rule only on a
--    Tier 1 item, and removal and bans only under the safety floor (T7, T9).
-- ===========================================================================
create function public.moderation_actions_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier smallint;
  v_floor public.floor_name;
begin
  select tier into v_tier from public.moderation_items where id = new.item_id;
  if new.floor_item_id is not null then
    if v_tier <> 3 then
      raise exception 'a floor item can only be cited on a Tier 3 item' using errcode = '23514';
    end if;
    select floor into v_floor from public.floor_items where id = new.floor_item_id;
    -- Content actions cite the safety floor. The privacy floor binds the
    -- operator, not what members post.
    if v_floor is distinct from 'safety' then
      raise exception 'an action on content cites a safety-floor item' using errcode = '23514';
    end if;
  end if;
  if new.tier1_rule is not null and v_tier <> 1 then
    raise exception 'a Tier 1 rule can only be cited on a Tier 1 item' using errcode = '23514';
  end if;
  if new.action in ('remove', 'temporary_ban')
     and (new.floor_item_id is null or v_floor is distinct from 'safety') then
    raise exception 'removal and bans need a safety-floor item' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger moderation_actions_rules
  before insert or update on public.moderation_actions
  for each row execute function public.moderation_actions_rules();

-- ===========================================================================
-- 10. Bans: safety floor only, an end date in the future, within max_ban_term.
--     While max_ban_term is NULL every ban is rejected (G9).
-- ===========================================================================
create function public.member_bans_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cap interval;
begin
  if tg_op = 'UPDATE' and new.ends_at > old.ends_at then
    raise exception 'a ban is never lengthened; propose a new one' using errcode = '23514';
  end if;
  if tg_op = 'INSERT' or new.ends_at is distinct from old.ends_at
     or new.floor_item_id is distinct from old.floor_item_id then
    if not exists (select 1 from public.floor_items
                    where id = new.floor_item_id and floor = 'safety') then
      raise exception 'a ban needs a safety-floor item' using errcode = '23514';
    end if;
    if new.ends_at <= now() then
      raise exception 'a ban needs an end date in the future' using errcode = '23514';
    end if;
    v_cap := public.config_interval('max_ban_term');
    if v_cap is null then
      raise exception 'no ban while max_ban_term is not set (G9)' using errcode = '23514';
    end if;
    if new.ends_at > now() + v_cap then
      raise exception 'a ban cannot exceed max_ban_term' using errcode = '23514';
    end if;
  end if;
  if new.confirmed_at is not null and old.confirmed_at is null and new.ends_at <= now() then
    raise exception 'a ban can only be confirmed while its end date is in the future'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger member_bans_rules
  before insert or update on public.member_bans
  for each row execute function public.member_bans_rules();

-- ===========================================================================
-- 11. Grants (ADR 0019 §6; T19). AFTER triggers, so NOT NULL and CHECK
--     failures surface first with their own codes.
-- ===========================================================================
create function public.moderator_grants_on_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max interval;
  v_gap interval;
begin
  if not public.gate_is_met('G4') then
    raise exception 'no moderator grant while G4 is unmet' using errcode = '23514';
  end if;
  if new.basis = 'elected' then
    -- Elections are Phase 3. Until then no grant may be labelled elected, so
    -- the interim limits cannot be skipped.
    raise exception 'no elected grant exists before elections do' using errcode = '23514';
  end if;

  -- Interim grants (the only kind until elections).
  if new.basis = 'interim' then
    v_max := public.config_interval('max_interim_term');
    if v_max is null then
      raise exception 'no interim grant while max_interim_term is not set (G9)'
        using errcode = '23514';
    end if;
    if new.expires_at - new.granted_at > v_max then
      raise exception 'an interim grant cannot exceed max_interim_term' using errcode = '23514';
    end if;
    if new.public_name is null then
      raise exception 'an interim grant must carry a public name (Q3)' using errcode = '23514';
    end if;
    if not public.has_current_consent(new.member_id, 'moderator_public_name') then
      raise exception 'an interim grant needs current naming consent' using errcode = '23514';
    end if;
    if exists (select 1 from public.moderator_grants g
                where g.member_id = new.member_id and g.role = new.role
                  and g.basis = 'interim' and g.id <> new.id) then
      v_gap := public.config_interval('interim_gap');
      if v_gap is null then
        raise exception 'no second interim grant while interim_gap is not set (G9)'
          using errcode = '23514';
      end if;
      if exists (select 1 from public.moderator_grants g
                  where g.member_id = new.member_id and g.role = new.role
                    and g.basis = 'interim' and g.id <> new.id
                    and new.granted_at < least(g.expires_at, coalesce(g.revoked_at, g.expires_at)) + v_gap) then
        raise exception 'a second interim grant must wait for interim_gap' using errcode = '23514';
      end if;
    end if;
  end if;
  return null;
end;
$$;

create trigger moderator_grants_on_insert
  after insert on public.moderator_grants
  for each row execute function public.moderator_grants_on_insert();

create function public.moderator_grants_on_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.member_id <> old.member_id or new.role <> old.role or new.basis <> old.basis
     or new.granted_at <> old.granted_at
     or new.election_ref is distinct from old.election_ref then
    raise exception 'a grant''s holder, role, basis and start never change' using errcode = '23514';
  end if;
  if old.basis = 'interim' and new.expires_at <> old.expires_at then
    raise exception 'an interim end date can never be changed' using errcode = '23514';
  end if;
  if old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at then
    raise exception 'a revocation cannot be undone' using errcode = '23514';
  end if;
  if new.public_name is not null and new.public_name is distinct from old.public_name then
    raise exception 'a public name is set only when the grant is made' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger moderator_grants_on_update
  before update on public.moderator_grants
  for each row execute function public.moderator_grants_on_update();

-- Withdrawing naming consent removes the name and so ends an interim grant.
create function public.moderator_name_consent_withdrawn()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.purpose = 'moderator_public_name' and new.withdrawn_at is not null
     and old.withdrawn_at is null
     and not public.has_current_consent(new.member_id, 'moderator_public_name') then
    update public.moderator_grants set public_name = null
     where member_id = new.member_id and public_name is not null;
  end if;
  return null;
end;
$$;

create trigger moderator_name_consent_withdrawn
  after update on public.consent_records
  for each row execute function public.moderator_name_consent_withdrawn();

-- A pseudonym is never reused after its mapping is deleted (ADR 0019 §4).
create function public.moderator_pseudonyms_never_reused()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.moderation_actions
              where actor_pseudonym = new.pseudonym or confirmed_by_pseudonym = new.pseudonym)
     or exists (select 1 from public.member_bans
              where proposed_by_pseudonym = new.pseudonym or confirmed_by_pseudonym = new.pseudonym)
     or exists (select 1 from public.appeal_decisions where panelist_pseudonym = new.pseudonym) then
    raise exception 'a pseudonym is never reused' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and new.pseudonym <> old.pseudonym then
    raise exception 'a pseudonym does not change' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger moderator_pseudonyms_never_reused
  before insert or update on public.moderator_pseudonyms
  for each row execute function public.moderator_pseudonyms_never_reused();

-- Service only: make a grant and, the first time, a pseudonym.
create function public.grant_moderator(
  p_member uuid, p_role public.moderation_role, p_basis public.grant_basis,
  p_expires_at timestamptz, p_public_name text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_pseudonym text;
begin
  insert into public.moderator_grants (member_id, role, basis, expires_at, public_name)
  values (p_member, p_role, p_basis, p_expires_at, p_public_name)
  returning id into v_id;
  if not exists (select 1 from public.moderator_pseudonyms where member_id = p_member) then
    loop
      v_pseudonym := 'Moderator ' || nextval('public.moderator_pseudonym_seq')::text;
      exit when not exists (select 1 from public.moderator_pseudonyms where pseudonym = v_pseudonym)
        and not exists (select 1 from public.moderation_actions
                         where actor_pseudonym = v_pseudonym or confirmed_by_pseudonym = v_pseudonym)
        and not exists (select 1 from public.member_bans
                         where proposed_by_pseudonym = v_pseudonym or confirmed_by_pseudonym = v_pseudonym)
        and not exists (select 1 from public.appeal_decisions where panelist_pseudonym = v_pseudonym);
    end loop;
    insert into public.moderator_pseudonyms (member_id, pseudonym) values (p_member, v_pseudonym);
  end if;
  perform public.moderation_audit_write('service', 'grant_moderator', 'moderator_grants', 1);
  return v_id;
end;
$$;

-- Q3: interim moderators are named publicly with their end dates. A named
-- list, never beside a pseudonym. A function rather than a view: anon has no
-- grant on moderator_grants (T2).
create function public.interim_moderators_public()
returns table (public_name text, role public.moderation_role,
               granted_at timestamptz, expires_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select g.public_name, g.role, g.granted_at, g.expires_at
    from public.moderator_grants g
   where g.basis = 'interim' and g.public_name is not null
     and g.revoked_at is null and g.expires_at > now()
     and public.has_current_consent(g.member_id, 'moderator_public_name')
   order by g.granted_at, g.public_name;
$$;

-- ===========================================================================
-- 12. Triage (decision 2; T11). Published lists only: lower-case, whole-word
--     matching, no scoring, no model, no network call, nothing written to any
--     log. It stores the category, never what matched.
--     - Crisis-list triage does not run on member content until G6 (counsel)
--       is met (ADR 0019 §8, privacy floor item 1).
--     - Spam and scam matches are held only while G1 is met (Q7); until then
--       the item is queued and the post stays visible.
-- ===========================================================================
create function public.triage_content()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_text      text;
  v_list      public.triage_list_name;
  v_category  public.moderation_category;
  v_post      uuid;
  v_comment   uuid;
  v_hold      boolean;
begin
  if new.moderation_state <> 'visible' or new.body = '' then
    return null;
  end if;
  if tg_table_name = 'posts' then
    v_post := new.id;
    v_text := lower(new.title || ' ' || new.body);
  else
    v_comment := new.id;
    v_text := lower(new.body);
  end if;
  v_text := regexp_replace(v_text, '\s+', ' ', 'g');

  for v_list in
    select distinct t.list from public.triage_lists t
     where t.active
       and (t.list <> 'crisis' or public.gate_is_met('G6'))
       and v_text ~ ('\m' || regexp_replace(lower(t.term), '([.^$*+?()\[\]{}|\\])', '\\\1', 'g') || '\M')
  loop
    v_category := case v_list when 'crisis' then 'crisis'
                              when 'misinfo' then 'dangerous_misinfo'
                              when 'spam' then 'spam'
                              else 'scam' end;
    v_hold := v_list in ('spam', 'scam') and public.gate_is_met('G1');
    if not exists (
      select 1 from public.moderation_items i
       where i.category = v_category and i.state <> 'closed'
         and ((v_post is not null and i.post_id = v_post)
           or (v_comment is not null and i.comment_id = v_comment))) then
      insert into public.moderation_items (post_id, comment_id, source, category, tier, state)
      values (v_post, v_comment, 'triage', v_category, 3,
              case when v_hold then 'checking' else 'queued' end);
      if v_hold then
        perform public.move_text_out(v_post, v_comment, 'held', 'visible', null);
      end if;
    end if;
  end loop;
  return null;
end;
$$;

create trigger posts_triage
  after insert or update of title, body on public.posts
  for each row execute function public.triage_content();
create trigger comments_triage
  after insert or update of body on public.comments
  for each row execute function public.triage_content();

-- No panel decision row can exist for a Tier 3 action, whoever writes it
-- (governance review, round 1). Tier 3 is never put to a vote (T7).
create function public.appeal_decisions_tier1_only()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.appeals a
               join public.moderation_actions m on m.id = a.action_id
               join public.moderation_items i on i.id = m.item_id
              where a.id = new.appeal_id
                and (m.floor_item_id is not null or i.tier = 3)) then
    raise exception 'a safety-floor decision is never put to a vote' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger appeal_decisions_tier1_only
  before insert or update on public.appeal_decisions
  for each row execute function public.appeal_decisions_tier1_only();

-- ===========================================================================
-- 13. Member functions
-- ===========================================================================
create function public.report_content(
  p_post uuid, p_comment uuid, p_reason public.report_reason, p_note text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member   uuid := (select auth.uid());
  v_category public.moderation_category;
  v_tier     smallint;
  v_item     uuid;
  v_rows     integer;
begin
  if v_member is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if num_nonnulls(p_post, p_comment) <> 1 then
    raise exception 'a report is about exactly one post or comment' using errcode = '23514';
  end if;
  if p_note is not null and length(p_note) > 500 then
    raise exception 'a report note is 500 characters or fewer' using errcode = '23514';
  end if;
  if (p_post is not null and not exists (select 1 from public.posts where id = p_post))
     or (p_comment is not null and not exists (select 1 from public.comments where id = p_comment)) then
    raise exception 'nothing to report' using errcode = '23514';
  end if;

  v_category := case p_reason
    when 'self_harm' then 'crisis'
    when 'dangerous_misinfo' then 'dangerous_misinfo'
    when 'harassment' then 'harassment'
    when 'spam_or_scam' then 'spam'
    when 'other_safety' then 'other_safety'
    else 'tier1' end;
  v_tier := case when v_category = 'tier1' then 1 else 3 end;

  select i.id into v_item from public.moderation_items i
   where i.category = v_category and i.state <> 'closed'
     and ((p_post is not null and i.post_id = p_post)
       or (p_comment is not null and i.comment_id = p_comment))
   order by i.created_at limit 1;

  -- One report per member per open item. A repeat for the same category
  -- changes nothing and makes no new item; a report under another category
  -- (for example "unkind", then "self-harm") still reaches its own item.
  if v_item is not null and exists (
       select 1 from public.reports r where r.item_id = v_item and r.reporter_id = v_member) then
    perform public.moderation_audit_write('member', 'report_content', 'reports', 0);
    return v_item;
  end if;
  if v_item is null then
    insert into public.moderation_items (post_id, comment_id, source, category, tier)
    values (p_post, p_comment, 'report', v_category, v_tier)
    returning id into v_item;
  end if;

  -- A self-harm report is minimized like a crisis item: no note is kept.
  insert into public.reports (reporter_id, post_id, comment_id, reason, note, item_id)
  values (v_member, p_post, p_comment, p_reason,
          case when p_reason = 'self_harm' then null else nullif(btrim(p_note), '') end, v_item)
  -- Two identical reports sent at once: the second changes nothing.
  on conflict (reporter_id, item_id) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    update public.moderation_items set report_count = report_count + 1 where id = v_item;
  end if;
  perform public.moderation_audit_write('member', 'report_content', 'reports', v_rows);
  return v_item;
end;
$$;

create function public.submit_appeal(p_action uuid, p_statement text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member uuid := (select auth.uid());
  v_action public.moderation_actions%rowtype;
  v_tier   smallint;
  v_id     uuid;
begin
  select * into v_action from public.moderation_actions where id = p_action;
  if not found then
    raise exception 'no such action' using errcode = '42501';
  end if;
  select tier into v_tier from public.moderation_items where id = v_action.item_id;
  -- Tier 3 is never put to a vote (T7). A Tier 3 "look again" goes to a
  -- trained human through request_second_look().
  if v_action.floor_item_id is not null or v_tier = 3 then
    raise exception 'a safety-floor decision is never appealed to a vote' using errcode = '42501';
  end if;
  if v_member is null or public.item_author(v_action.item_id) is distinct from v_member then
    raise exception 'only the author can appeal' using errcode = '42501';
  end if;
  insert into public.appeals (action_id, appellant_id, appellant_label, statement)
  values (p_action, v_member, 'Member 1', p_statement)
  returning id into v_id;
  update public.moderation_items set state = 'appealed' where id = v_action.item_id;
  perform public.moderation_audit_write('member', 'submit_appeal', 'appeals', 1);
  return v_id;
end;
$$;

create function public.withdraw_appeal(p_appeal uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.appeals set state = 'withdrawn'
   where id = p_appeal and appellant_id = (select auth.uid())
     and state in ('submitted', 'waiting_for_panel');
  if not found then
    raise exception 'no open appeal of yours to withdraw' using errcode = '42501';
  end if;
  perform public.moderation_audit_write('member', 'withdraw_appeal', 'appeals', 1);
end;
$$;

create function public.request_second_look(p_action uuid, p_statement text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member uuid := (select auth.uid());
  v_action public.moderation_actions%rowtype;
  v_id     uuid;
begin
  select * into v_action from public.moderation_actions where id = p_action;
  if not found or v_member is null
     or public.item_author(v_action.item_id) is distinct from v_member then
    raise exception 'only the author can ask for a second look' using errcode = '42501';
  end if;
  if v_action.floor_item_id is null then
    raise exception 'a Tier 1 action is appealed, not sent for a second look'
      using errcode = '23514';
  end if;
  insert into public.second_look_requests (requester_id, action_id, statement)
  values (v_member, p_action, p_statement)
  returning id into v_id;
  perform public.moderation_audit_write('member', 'request_second_look', 'second_look_requests', 1);
  return v_id;
end;
$$;

-- The author's view of actions on their content: remove, lock and context
-- notes, plus their own confirmed bans. Never a pseudonym.
create function public.my_moderation_notices()
returns table (post_id uuid, comment_id uuid, action public.moderation_action_kind,
               floor public.floor_name, floor_version integer, floor_item_number integer,
               floor_item_text text, tier1_rule public.tier1_rule, reason text,
               ends_at timestamptz, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select i.post_id, i.comment_id, a.action, f.floor, f.version, f.item_number, f.text,
         a.tier1_rule, a.reason, a.ends_at, a.created_at
    from public.moderation_actions a
    join public.moderation_items i on i.id = a.item_id
    left join public.floor_items f on f.id = a.floor_item_id
    left join public.posts p on p.id = i.post_id
    left join public.comments c on c.id = i.comment_id
   where a.action in ('remove', 'lock', 'context_note')
     and coalesce(p.author_id, c.author_id) = (select auth.uid())
  union all
  select null, null, 'temporary_ban', f.floor, f.version, f.item_number, f.text,
         null, b.reason, b.ends_at, b.created_at
    from public.member_bans b
    join public.floor_items f on f.id = b.floor_item_id
   where b.member_id = (select auth.uid()) and b.confirmed_at is not null
  order by 11;
$$;

-- Rows the member has no table grant on, for the data export (ADR 0019 §9):
-- their bans (no pseudonyms), their own grants, their own pseudonym and the
-- panel decisions made under it.
create function public.export_my_moderation_records()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_member    uuid := (select auth.uid());
  v_pseudonym text;
  v_result    jsonb;
begin
  if v_member is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  select pseudonym into v_pseudonym from public.moderator_pseudonyms where member_id = v_member;
  v_result := jsonb_build_object(
    'member_bans', coalesce((
      select jsonb_agg(jsonb_build_object(
               'floor_item_id', b.floor_item_id, 'reason', b.reason, 'ends_at', b.ends_at,
               'confirmed_at', b.confirmed_at, 'created_at', b.created_at) order by b.created_at)
        from public.member_bans b where b.member_id = v_member), '[]'::jsonb),
    'moderator_grants', coalesce((
      select jsonb_agg(jsonb_build_object(
               'role', g.role, 'basis', g.basis, 'granted_at', g.granted_at,
               'expires_at', g.expires_at, 'revoked_at', g.revoked_at,
               'public_name', g.public_name) order by g.granted_at)
        from public.moderator_grants g where g.member_id = v_member), '[]'::jsonb),
    'moderator_pseudonyms', case when v_pseudonym is null then '[]'::jsonb else
      jsonb_build_array(jsonb_build_object(
        'pseudonym', v_pseudonym,
        'panel_decisions', coalesce((
          select jsonb_agg(jsonb_build_object(
                   'appeal_id', d.appeal_id, 'choice', d.choice, 'decided_at', d.decided_at)
                   order by d.decided_at)
            from public.appeal_decisions d where d.panelist_pseudonym = v_pseudonym), '[]'::jsonb)))
      end);
  return v_result;
end;
$$;

-- ===========================================================================
-- 14. Moderator and panel functions
-- ===========================================================================

-- T6: item id, subject, category, tier, state, `reported` and `age_hours`.
-- Never the reporter, the note, the count or a timestamp.
create function public.moderation_queue()
returns table (item_id uuid, post_id uuid, comment_id uuid,
               category public.moderation_category, tier smallint,
               state public.moderation_item_state, reported boolean, age_hours integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then
    raise exception 'moderators only' using errcode = '42501';
  end if;
  return query
    select i.id, i.post_id, i.comment_id, i.category, i.tier, i.state,
           i.report_count > 0,
           round(extract(epoch from (now() - i.created_at)) / 3600)::integer
      from public.moderation_items i
     where i.state <> 'closed'
     order by i.tier desc, (i.category = 'crisis') desc, i.created_at;
end;
$$;

create function public.moderate(
  p_item uuid, p_action public.moderation_action_kind, p_floor_item uuid,
  p_tier1_rule public.tier1_rule, p_reason text, p_ends_at timestamptz)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member    uuid := (select auth.uid());
  v_item      public.moderation_items%rowtype;
  v_floor     public.floor_name;
  v_author    uuid;
  v_pseudonym text;
  v_cap       interval;
  v_action    uuid;
begin
  -- Who may act (42501).
  if not public.is_moderator() then
    raise exception 'moderators only' using errcode = '42501';
  end if;
  select * into v_item from public.moderation_items where id = p_item;
  if not found then
    raise exception 'no such item' using errcode = '42501';
  end if;
  v_author := public.item_author(p_item);
  if v_author = v_member then
    raise exception 'a moderator cannot act on their own content' using errcode = '42501';
  end if;
  if public.member_reported_item_subject(v_member, p_item) then
    raise exception 'a moderator cannot act on an item they reported' using errcode = '42501';
  end if;

  -- The shape of the action (23514).
  if p_reason is null or length(btrim(p_reason)) not between 1 and 280 then
    raise exception 'every action needs a reason of 1 to 280 characters' using errcode = '23514';
  end if;
  if p_floor_item is not null then
    select floor into v_floor from public.floor_items where id = p_floor_item;
  end if;
  if p_action in ('remove', 'temporary_ban') then
    if v_item.tier = 1 then
      raise exception 'a Tier 1 item is never removed or banned' using errcode = '23514';
    end if;
    if p_floor_item is null or v_floor is distinct from 'safety' then
      raise exception 'removal and bans need a safety-floor item' using errcode = '23514';
    end if;
    if v_item.category = 'crisis' then
      raise exception 'a crisis item is never removed or banned' using errcode = '23514';
    end if;
  end if;
  if num_nonnulls(p_floor_item, p_tier1_rule) <> 1 then
    raise exception 'cite exactly one floor item or Tier 1 rule' using errcode = '23514';
  end if;
  if p_action = 'temporary_ban' then
    if p_ends_at is null or p_ends_at <= now() then
      raise exception 'a temporary ban needs an end date in the future' using errcode = '23514';
    end if;
    v_cap := public.config_interval('max_ban_term');
    if v_cap is null then
      raise exception 'no ban while max_ban_term is not set (G9)' using errcode = '23514';
    end if;
    if p_ends_at > now() + v_cap then
      raise exception 'a ban cannot exceed max_ban_term' using errcode = '23514';
    end if;
  end if;
  if p_action = 'lock' and v_item.post_id is null then
    raise exception 'only a post (a thread) can be locked' using errcode = '23514';
  end if;
  if p_action = 'context_note' and not public.gate_is_met('G3') then
    raise exception 'context notes wait for G3' using errcode = '23514';
  end if;
  if p_action = 'sent_crisis_resources' and not public.gate_is_met('G1') then
    raise exception 'sending crisis resources waits for G1' using errcode = '23514';
  end if;
  if v_item.state = 'closed' then
    raise exception 'this item is closed' using errcode = '23514';
  end if;

  -- Interim limits (T24), after the shape checks: a Tier 1 removal or ban is
  -- refused for everyone (23514) before the interim rule is reached.
  if p_tier1_rule is not null and p_action in ('remove', 'lock', 'temporary_ban')
     and public.current_grant_is_interim('moderator') then
    raise exception 'an interim moderator cannot remove, lock or ban for a Tier 1 reason'
      using errcode = '42501';
  end if;

  v_pseudonym := public.caller_pseudonym('moderate');
  if v_pseudonym is null then
    raise exception 'a moderator needs a pseudonym to act' using errcode = '42501';
  end if;

  insert into public.moderation_actions
    (item_id, action, floor_item_id, tier1_rule, reason, actor_pseudonym, ends_at)
  values (p_item, p_action, p_floor_item, p_tier1_rule, btrim(p_reason), v_pseudonym,
          case when p_action = 'temporary_ban' then p_ends_at end)
  returning id into v_action;

  if p_action = 'remove' then
    perform public.move_text_out(v_item.post_id, v_item.comment_id, 'removed', 'removed', p_floor_item);
  elsif p_action = 'restore' then
    perform public.move_text_back(v_item.post_id, v_item.comment_id);
  elsif p_action = 'lock' then
    update public.posts set moderation_state = 'locked' where id = v_item.post_id;
  elsif p_action = 'temporary_ban' then
    -- Pending until a different moderator confirms it (Q9; T18).
    insert into public.member_bans
      (member_id, floor_item_id, reason, ends_at, proposed_by_pseudonym, action_id)
    values (v_author, p_floor_item, btrim(p_reason), p_ends_at, v_pseudonym, v_action);
  end if;

  update public.moderation_items
     set state = case p_action
                   when 'no_action' then 'closed'::public.moderation_item_state
                   -- Resources sent is the end of a crisis item: close it, so it
                   -- is reduced to a count.
                   when 'sent_crisis_resources' then 'closed'::public.moderation_item_state
                   when 'escalate' then 'escalated'::public.moderation_item_state
                   else 'actioned'::public.moderation_item_state end,
         first_reviewed_at = coalesce(first_reviewed_at, now()),
         closed_at = case when p_action in ('no_action', 'sent_crisis_resources') then now()
                          else closed_at end
   where id = p_item;

  perform public.moderation_audit_write('moderator', 'moderate', 'moderation_actions', 1);
  return v_action;
end;
$$;

-- The second look by a different person (T16, T18).
create function public.confirm_action(p_action uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member    uuid := (select auth.uid());
  v_action    public.moderation_actions%rowtype;
  v_pseudonym text;
begin
  if not public.is_moderator() then
    raise exception 'moderators only' using errcode = '42501';
  end if;
  select * into v_action from public.moderation_actions where id = p_action;
  if not found then
    raise exception 'no such action' using errcode = '42501';
  end if;
  v_pseudonym := public.caller_pseudonym('confirm_action');
  if v_pseudonym is null or v_pseudonym = v_action.actor_pseudonym then
    raise exception 'the confirmer must be a different person from the proposer'
      using errcode = '42501';
  end if;
  if public.item_author(v_action.item_id) = v_member
     or public.member_reported_item_subject(v_member, v_action.item_id) then
    raise exception 'a confirmer cannot have a conflict of interest' using errcode = '42501';
  end if;
  if v_action.tier1_rule is not null and v_action.action in ('remove', 'lock', 'temporary_ban')
     and public.current_grant_is_interim('moderator') then
    raise exception 'an interim moderator cannot confirm this for a Tier 1 reason'
      using errcode = '42501';
  end if;
  if v_action.confirmed_by_pseudonym is not null then
    raise exception 'this action is already confirmed' using errcode = '23514';
  end if;

  update public.moderation_actions set confirmed_by_pseudonym = v_pseudonym where id = p_action;
  update public.member_bans
     set confirmed_by_pseudonym = v_pseudonym, confirmed_at = now()
   where action_id = p_action and confirmed_at is null;
  perform public.moderation_audit_write('moderator', 'confirm_action', 'moderation_actions', 1);
end;
$$;

-- One equal vote per panelist (T1, T17). Records the decision; an outcome is
-- final only once G2's published quorum exists, which it does not yet.
create function public.decide_appeal(p_appeal uuid, p_choice public.appeal_choice)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member    uuid := (select auth.uid());
  v_appeal    public.appeals%rowtype;
  v_action    public.moderation_actions%rowtype;
  v_tier      smallint;
  v_pseudonym text;
begin
  if not public.has_current_grant('panelist') then
    raise exception 'panelists only' using errcode = '42501';
  end if;
  select * into v_appeal from public.appeals where id = p_appeal;
  if not found or v_appeal.state not in ('submitted', 'waiting_for_panel') then
    raise exception 'no open appeal' using errcode = '42501';
  end if;
  select * into v_action from public.moderation_actions where id = v_appeal.action_id;
  select tier into v_tier from public.moderation_items where id = v_action.item_id;
  if v_action.floor_item_id is not null or v_tier = 3 then
    raise exception 'a safety-floor decision is never put to a vote' using errcode = '42501';
  end if;
  if v_appeal.appellant_id = v_member then
    raise exception 'the appellant cannot decide their own appeal' using errcode = '42501';
  end if;
  if public.item_author(v_action.item_id) = v_member
     or public.member_reported_item_subject(v_member, v_action.item_id) then
    raise exception 'a panelist who wrote or reported the content cannot decide'
      using errcode = '42501';
  end if;
  v_pseudonym := public.caller_pseudonym('decide_appeal');
  if v_pseudonym is null then
    raise exception 'a panelist needs a pseudonym' using errcode = '42501';
  end if;
  if v_pseudonym in (v_action.actor_pseudonym, coalesce(v_action.confirmed_by_pseudonym, '')) then
    raise exception 'the acting moderator cannot decide the appeal' using errcode = '42501';
  end if;

  insert into public.appeal_decisions (appeal_id, panelist_pseudonym, choice)
  values (p_appeal, v_pseudonym, p_choice);
  update public.appeals set state = 'waiting_for_panel' where id = p_appeal and state = 'submitted';
  perform public.moderation_audit_write('panelist', 'decide_appeal', 'appeal_decisions', 1);
end;
$$;

-- ===========================================================================
-- 15. EXECUTE (see the matrix in the header).
--
--     PostgreSQL gives PUBLIC EXECUTE on every new function, and
--     `alter default privileges ... in schema` cannot take that built-in
--     grant away (it only adds to or removes from the global defaults). So
--     every function this file creates loses PUBLIC, anon and authenticated
--     EXECUTE here, by name, and then gets back exactly the matrix.
-- ===========================================================================
do $$
declare
  f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and p.proname = any (array[
         'moderation_audit_write', 'has_current_consent', 'config_interval', 'gate_is_met',
         'has_current_grant', 'current_grant_is_interim', 'caller_pseudonym', 'item_author',
         'member_reported_item_subject', 'move_text_out', 'move_text_back',
         'is_moderator', 'is_banned_now', 'appeal_decisions_tier1_only',
         'guard_content_moderation_columns', 'floor_versions_rules',
         'floor_versions_check_items', 'floor_versions_log', 'floor_items_rules',
         'refuse_rewrite', 'launch_gates_history', 'moderation_log_public_threshold',
         'moderation_items_tier_guard', 'moderation_items_on_close', 'reports_count_on_delete',
         'moderation_actions_rules', 'member_bans_rules', 'moderator_grants_on_insert',
         'moderator_grants_on_update', 'moderator_name_consent_withdrawn',
         'moderator_pseudonyms_never_reused', 'grant_moderator', 'interim_moderators_public',
         'triage_content', 'report_content', 'submit_appeal', 'withdraw_appeal',
         'request_second_look', 'my_moderation_notices', 'export_my_moderation_records',
         'moderation_queue', 'moderate', 'confirm_action', 'decide_appeal'])
  loop
    execute format('revoke execute on function %s from public, anon, authenticated, service_role', f);
  end loop;
end $$;
revoke execute on function moderation_private.is_blocked_between(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute on function moderation_private.is_blocked_between(uuid, uuid)
  to authenticated, service_role;

grant execute on function
  public.is_moderator(),
  public.is_banned_now(),
  public.report_content(uuid, uuid, public.report_reason, text),
  public.moderation_queue(),
  public.moderate(uuid, public.moderation_action_kind, uuid, public.tier1_rule, text, timestamptz),
  public.confirm_action(uuid),
  public.submit_appeal(uuid, text),
  public.withdraw_appeal(uuid),
  public.request_second_look(uuid, text),
  public.decide_appeal(uuid, public.appeal_choice),
  public.my_moderation_notices(),
  public.export_my_moderation_records(),
  public.interim_moderators_public()
  to authenticated;
grant execute on function public.interim_moderators_public() to anon;
grant execute on function
  public.is_moderator(),
  public.is_banned_now(),
  public.interim_moderators_public(),
  public.grant_moderator(uuid, public.moderation_role, public.grant_basis, timestamptz, text),
  public.has_current_consent(uuid, public.consent_purpose)
  to service_role;
