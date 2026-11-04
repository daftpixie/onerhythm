-- OneRhythm — moderation build step 3, part 2 of 3: EXPAND.
--
-- New types, the `posts`/`comments` columns, the 22 moderation tables, RLS
-- switched on, the table grants, and the seed rows (launch gates, empty
-- config). Policies, triggers and functions follow in part 3.
--
-- Sources: ADR 0019 (data model and authorization matrix), ADR 0020 (floors),
-- ADR 0021 (appeals and launch gates), all accepted by the founder on
-- 2026-10-29; plan .claude/plans/phase-2-moderation-core.md §3 and §10 step 3.
--
-- FOUNDER DECISION, 2026-10-29 (G9): these migrations ship with every G9 value
-- NULL, and every rule that depends on one fails closed:
--   - no moderator grant can be made (max_interim_term, interim_gap NULL);
--   - no ban can be issued (max_ban_term NULL);
--   - no purge job is scheduled (every retention period NULL; none is created);
--   - the public log publishes nothing that needs the small-community
--     threshold (NULL), so only site-wide (`scope = 'all'`) rows are accepted.
-- This is acceptable only because no member data exists (ADR 0019,
-- Consequences 1). G9 stays unmet and still blocks member launch.
--
-- SEEDED: the nine launch gates, all `unmet`, and the config keys, all NULL.
-- NOT SEEDED: any floor version, moderator grant, panelist, reviewer,
-- pseudonym, ban or triage term. G1-G4 stay undefined.
--
-- ---------------------------------------------------------------------------
-- AUTHORIZATION MATRIX (table privileges; RLS filters rows inside them)
-- ---------------------------------------------------------------------------
-- Every table below starts with `revoke all ... from anon, authenticated`
-- (docs/PRODUCTION_READINESS.md §1.6: default privileges hand every new table
-- full DML to authenticated), then grants back only these verbs.
--
--   table                         | anon   | authenticated            | service_role
--   ------------------------------+--------+--------------------------+-------------
--   governance_config             | SELECT | SELECT                   | DML
--   floor_versions                | SELECT | SELECT                   | SELECT,INSERT (1)
--   floor_items                   | SELECT | SELECT                   | SELECT,INSERT (1)
--   floor_reexamination_requests  | -      | SELECT,INSERT (own)      | DML
--   floor_reexamination_answers   | SELECT | SELECT                   | DML
--   triage_lists                  | SELECT | SELECT (crisis, misinfo) | DML
--   reports                       | -      | SELECT (own)             | DML
--   moderation_items              | -      | SELECT on 7 columns (2)  | DML
--   moderation_actions            | -      | SELECT (moderators)      | DML
--   removed_content               | -      | SELECT (author, mods)    | DML
--   member_blocks                 | -      | SELECT,INSERT,DELETE (3) | DML
--   member_bans                   | -      | -                        | DML
--   moderator_grants              | -      | -                        | DML
--   moderator_pseudonyms          | -      | -                        | DML
--   appeals                       | -      | SELECT (own)             | DML
--   appeal_decisions              | -      | -                        | DML
--   second_look_requests          | -      | SELECT (own)             | DML
--   legal_holds                   | -      | -                        | DML
--   moderation_log_public         | SELECT | SELECT                   | SELECT,INSERT
--   moderation_audit              | -      | -                        | SELECT,INSERT
--   launch_gates                  | SELECT | SELECT                   | SELECT,UPDATE
--   launch_gate_history           | SELECT | SELECT                   | SELECT
--
--   (1) Published floor rows are never rewritten or deleted, by any role
--       (ADR 0020 point 4); part 3 adds triggers that refuse UPDATE, DELETE and
--       TRUNCATE even for the table owner.
--   (2) id, post_id, comment_id, source, category, tier, state. Never
--       report_count or a timestamp (T6); moderators get those only as
--       `reported` and `age_hours` through moderation_queue().
--   (3) The blocker's own rows only. Moderators have no policy (T23).
--
-- Every other write goes through a SECURITY DEFINER function in part 3.

-- ===========================================================================
-- 1. Types
-- ===========================================================================
create type public.content_moderation_state as enum ('visible', 'removed', 'locked');
create type public.floor_name as enum ('safety', 'privacy');
create type public.floor_change_kind as enum ('initial', 'tighten', 'tighten_emergency', 'loosen');
create type public.triage_list_name as enum ('crisis', 'misinfo', 'spam', 'scam');
create type public.report_reason as enum
  ('self_harm', 'dangerous_misinfo', 'harassment', 'spam_or_scam', 'other_safety',
   'off_topic', 'unkind');
create type public.moderation_source as enum ('report', 'triage');
-- Every category except tier1 is Tier 3 (ADR 0019 §4).
create type public.moderation_category as enum
  ('crisis', 'dangerous_misinfo', 'harassment', 'doxxing', 'illegal', 'impersonation',
   'spam', 'scam', 'other_safety', 'tier1');
create type public.moderation_item_state as enum
  ('queued', 'checking', 'in_review', 'escalated', 'actioned', 'appealed', 'closed');
create type public.moderation_action_kind as enum
  ('remove', 'restore', 'context_note', 'lock', 'no_action', 'escalate',
   'temporary_ban', 'sent_crisis_resources', 'request_edit');
-- The Tier 1 rules a moderator can cite. They mirror the two Tier 1 report
-- reasons; the community guidelines (Tier 1, member-governed) may add more.
create type public.tier1_rule as enum ('off_topic', 'unkind');
create type public.removed_content_kind as enum ('removed', 'held');
create type public.moderation_role as enum ('moderator', 'panelist');
create type public.grant_basis as enum ('interim', 'elected');
create type public.appeal_state as enum ('submitted', 'waiting_for_panel', 'decided', 'withdrawn');
create type public.appeal_choice as enum ('uphold', 'overturn');
create type public.request_state as enum ('submitted', 'answered', 'withdrawn');
create type public.gate_status as enum ('unmet', 'met');
create type public.moderation_log_kind as enum
  ('action', 'appeal_outcome', 'legal_hold', 'grant_count', 'floor_change', 'gate_change');

-- ===========================================================================
-- 2. governance_config — founder and charter values. Every value starts NULL
--    and each rule that reads one fails closed while it is NULL.
-- ===========================================================================
create table public.governance_config (
  key       text primary key,
  -- Durations: notice periods, terms, ban cap, retention periods.
  value     interval,
  -- The one count: the small-community threshold for the public log. Kept in
  -- its own column so a duration can never be read as a count.
  int_value integer,
  constraint governance_config_known_key check (key in (
    'minimum_notice', 'max_interim_term', 'interim_gap', 'max_ban_term',
    'retention_removed_content', 'retention_closed_crisis_items', 'retention_reports',
    'retention_appeal_statements', 'retention_action_reasons',
    'retention_expired_grants', 'retention_access_logs',
    'small_community_threshold')),
  constraint governance_config_value_positive check (value is null or value > interval '0'),
  constraint governance_config_threshold_floor check (int_value is null or int_value >= 5),
  constraint governance_config_one_kind check (
    (key = 'small_community_threshold' and value is null)
    or (key <> 'small_community_threshold' and int_value is null))
);

insert into public.governance_config (key) values
  -- ADR 0020: set by the governance charter or a rule-file change.
  ('minimum_notice'),
  -- G9 (founder decision 2026-10-29: NULL, fail closed, set with counsel).
  ('max_interim_term'), ('interim_gap'), ('max_ban_term'),
  ('retention_removed_content'), ('retention_closed_crisis_items'), ('retention_reports'),
  ('retention_appeal_statements'), ('retention_action_reasons'),
  ('retention_expired_grants'), ('retention_access_logs'),
  ('small_community_threshold');

-- ===========================================================================
-- 3. The floors (ADR 0020). Not member data.
-- ===========================================================================
create table public.floor_versions (
  id                   uuid primary key default gen_random_uuid(),
  floor                public.floor_name not null,
  version              integer not null check (version >= 1),
  content_sha256       text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  change_kind          public.floor_change_kind not null,
  reason               text not null,
  announced_at         timestamptz not null,
  effective_at         timestamptz not null,
  notice_ends_at       timestamptz,
  adr_ref              text,
  legal_review_ref     text,
  applies_from         timestamptz,
  requires_fresh_optin boolean not null default false,
  policy_version       text,
  -- Set by trigger to the inserting transaction's time; lets items be added in
  -- the same transaction as their version, and never later once it is in force.
  recorded_at          timestamptz not null default now(),
  unique (floor, version),
  constraint floor_versions_reason_required check (length(btrim(reason)) > 0),
  -- A plain tighten is announced with its reason first (ADR 0017).
  constraint floor_versions_tighten_announced_first
    check (change_kind <> 'tighten' or announced_at < effective_at),
  -- Only an emergency tightening may take effect at announcement.
  constraint floor_versions_not_before_announcement check (announced_at <= effective_at),
  constraint floor_versions_loosen_needs_adr
    check (change_kind <> 'loosen' or length(btrim(coalesce(adr_ref, ''))) > 0),
  constraint floor_versions_loosen_needs_legal_review
    check (change_kind <> 'loosen' or length(btrim(coalesce(legal_review_ref, ''))) > 0),
  constraint floor_versions_loosen_waits_for_notice
    check (change_kind <> 'loosen'
           or (notice_ends_at is not null and effective_at >= notice_ends_at)),
  -- A loosened privacy item applies only to data collected afterward, with
  -- fresh opt-in recorded in the consent ledger.
  constraint floor_versions_privacy_loosen_fresh_optin
    check (change_kind <> 'loosen' or floor <> 'privacy'
           or (applies_from is not null and requires_fresh_optin
               and length(btrim(coalesce(policy_version, ''))) > 0))
);

create table public.floor_items (
  id          uuid primary key default gen_random_uuid(),
  floor       public.floor_name not null,
  version     integer not null,
  item_number integer not null check (item_number >= 1),
  text        text not null check (length(btrim(text)) > 0),
  unique (floor, version, item_number),
  foreign key (floor, version) references public.floor_versions (floor, version)
);

-- Re-examination requests (ADR 0020 point 5). Member-linked; the request text
-- is health data (ADR 0019 §8). Published only after human review, through the
-- answers table below, which never holds the member's own words.
create table public.floor_reexamination_requests (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles (id) on delete cascade,
  floor_item_id uuid not null references public.floor_items (id),
  request_text  text not null check (length(btrim(request_text)) between 1 and 2000),
  state         public.request_state not null default 'submitted',
  created_at    timestamptz not null default now()
);

-- No requester column, so a published answer survives the requester's account
-- deletion with nothing that identifies them. The opt-in shown name
-- (`reexam_show_name`) is NOT built here: with no member link, a name could
-- not be removed on withdrawal or deletion. It waits for build step 6.
create table public.floor_reexamination_answers (
  id               uuid primary key default gen_random_uuid(),
  floor_item_id    uuid not null references public.floor_items (id),
  question_summary text not null check (length(btrim(question_summary)) between 1 and 2000),
  answer           text not null check (length(btrim(answer)) > 0),
  answered_at      timestamptz not null default now()
);

-- ===========================================================================
-- 4. Triage lists (decision 2). Terms only; no member data. Empty at launch.
-- ===========================================================================
create table public.triage_lists (
  id         uuid primary key default gen_random_uuid(),
  list       public.triage_list_name not null,
  term       text not null check (length(btrim(term)) > 0),
  version    integer not null check (version >= 1),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (list, term, version)
);

-- ===========================================================================
-- 5. posts and comments — moderation state (ADR 0019 §2). Expand only: new
--    nullable or defaulted columns, no backfill needed (every existing row is
--    `visible`). REPLICA IDENTITY stays DEFAULT (T22).
-- ===========================================================================
alter table public.posts
  add column moderation_state public.content_moderation_state not null default 'visible',
  add column removed_at       timestamptz,
  add column removed_under    uuid references public.floor_items (id);

alter table public.comments
  add column moderation_state public.content_moderation_state not null default 'visible',
  add column removed_at       timestamptz,
  add column removed_under    uuid references public.floor_items (id),
  -- `locked` is for posts (threads) only.
  add constraint comments_never_locked check (moderation_state <> 'locked');

-- The block check in the posts and comments read policies looks up whether a
-- member has written anything (20261029130200); index the author columns.
create index if not exists posts_author_id_idx on public.posts (author_id);
create index if not exists comments_author_id_idx on public.comments (author_id);

-- ===========================================================================
-- 6. The queue
-- ===========================================================================
create table public.moderation_items (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid references public.posts (id) on delete cascade,
  comment_id        uuid references public.comments (id) on delete cascade,
  source            public.moderation_source not null,
  category          public.moderation_category not null,
  tier              smallint not null,
  state             public.moderation_item_state not null default 'queued',
  report_count      integer not null default 0 check (report_count >= 0),
  created_at        timestamptz not null default now(),
  first_reviewed_at timestamptz,
  closed_at         timestamptz,
  -- Exactly one subject. A closed crisis item is reduced to a count: its
  -- subject is cleared, so it no longer points at anyone (ADR 0019 §8).
  constraint moderation_items_one_subject check (
    num_nonnulls(post_id, comment_id) = 1
    or (num_nonnulls(post_id, comment_id) = 0 and category = 'crisis' and state = 'closed')),
  -- Tier 1 or Tier 3 only (T7).
  constraint moderation_items_tier_1_or_3 check (tier in (1, 3)),
  -- tier1 is the only Tier 1 category; every other category is Tier 3.
  constraint moderation_items_tier1_category check (tier <> 1 or category = 'tier1'),
  constraint moderation_items_tier3_category check (tier <> 3 or category <> 'tier1')
);
create index moderation_items_post_idx on public.moderation_items (post_id);
create index moderation_items_comment_idx on public.moderation_items (comment_id);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  post_id     uuid references public.posts (id) on delete cascade,
  comment_id  uuid references public.comments (id) on delete cascade,
  reason      public.report_reason not null,
  -- Health data (ADR 0019 §8). Purged when the item closes.
  note        text check (note is null or length(note) <= 500),
  item_id     uuid not null references public.moderation_items (id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint reports_one_subject check (num_nonnulls(post_id, comment_id) = 1),
  -- One report per member per item. A member can still report the same post
  -- under another category, so a safety escalation reaches its own item.
  constraint reports_one_per_member_item unique (reporter_id, item_id)
);
create index reports_item_idx on public.reports (item_id);

create table public.moderation_actions (
  id                     uuid primary key default gen_random_uuid(),
  item_id                uuid not null references public.moderation_items (id) on delete cascade,
  action                 public.moderation_action_kind not null,
  floor_item_id          uuid references public.floor_items (id),
  tier1_rule             public.tier1_rule,
  -- Health data (ADR 0019 §8); the form hint says "Don't quote health details".
  reason                 text not null check (length(btrim(reason)) between 1 and 280),
  actor_pseudonym        text not null,
  confirmed_by_pseudonym text,
  ends_at                timestamptz,
  created_at             timestamptz not null default now(),
  -- Every action cites exactly one rule: a floor item or a Tier 1 rule.
  constraint moderation_actions_one_rule check (num_nonnulls(floor_item_id, tier1_rule) = 1),
  -- The two-person rule, at the table too (governance review, round 1).
  constraint moderation_actions_two_people check (confirmed_by_pseudonym is distinct from actor_pseudonym),
  constraint moderation_actions_ban_has_end check (action <> 'temporary_ban' or ends_at is not null)
);
create index moderation_actions_item_idx on public.moderation_actions (item_id);

-- Removal moves the text here (ADR 0019 §2). Author and moderators only.
create table public.removed_content (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid unique references public.posts (id) on delete cascade,
  comment_id uuid unique references public.comments (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  title      text,
  body       text not null,
  kind       public.removed_content_kind not null,
  removed_at timestamptz not null default now(),
  constraint removed_content_one_subject check (num_nonnulls(post_id, comment_id) = 1)
);

-- ===========================================================================
-- 7. Blocks and bans
-- ===========================================================================
create table public.member_blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint member_blocks_no_self_block check (blocker_id <> blocked_id)
);
create index member_blocks_blocked_idx on public.member_blocks (blocked_id);

create table public.member_bans (
  id                     uuid primary key default gen_random_uuid(),
  member_id              uuid not null references public.profiles (id) on delete cascade,
  -- Safety floor only (trigger in part 3).
  floor_item_id          uuid not null references public.floor_items (id),
  reason                 text not null check (length(btrim(reason)) between 1 and 280),
  ends_at                timestamptz not null,
  proposed_by_pseudonym  text not null,
  confirmed_by_pseudonym text,
  confirmed_at           timestamptz,
  -- The proposing action, so confirm_action() can find the ban. Keyed to the
  -- member, not the content: deleting the post does not clear the ban.
  action_id              uuid references public.moderation_actions (id) on delete set null,
  created_at             timestamptz not null default now(),
  constraint member_bans_ends_after_start check (ends_at > created_at),
  constraint member_bans_two_people check (confirmed_by_pseudonym is distinct from proposed_by_pseudonym),
  constraint member_bans_confirmed_together
    check ((confirmed_at is null) = (confirmed_by_pseudonym is null))
);
create index member_bans_member_idx on public.member_bans (member_id);

-- ===========================================================================
-- 8. Who moderates (ADR 0019 §6)
-- ===========================================================================
create table public.moderator_grants (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references public.profiles (id) on delete cascade,
  role         public.moderation_role not null,
  basis        public.grant_basis not null,
  granted_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  revoked_at   timestamptz,
  -- Only under current `moderator_public_name` consent; nulled on withdrawal.
  public_name  text check (public_name is null or length(btrim(public_name)) between 1 and 80),
  election_ref text,
  constraint moderator_grants_ends_after_start check (expires_at > granted_at),
  constraint moderator_grants_elected_needs_election
    check (basis <> 'elected' or length(btrim(coalesce(election_ref, ''))) > 0)
);
create index moderator_grants_member_idx on public.moderator_grants (member_id);

-- Q4: held apart, never public, deletable, every read logged. No client role.
create table public.moderator_pseudonyms (
  member_id  uuid primary key references public.profiles (id) on delete cascade,
  pseudonym  text not null unique check (length(btrim(pseudonym)) between 1 and 40),
  created_at timestamptz not null default now()
);
create sequence public.moderator_pseudonym_seq;

-- ===========================================================================
-- 9. Appeals and second looks (ADR 0021)
-- ===========================================================================
create table public.appeals (
  id              uuid primary key default gen_random_uuid(),
  action_id       uuid not null references public.moderation_actions (id) on delete cascade,
  appellant_id    uuid not null references public.profiles (id) on delete cascade,
  -- How panelists see the appellant ("Member 1"); no lasting mapping.
  appellant_label text not null check (length(btrim(appellant_label)) between 1 and 40),
  -- Health data (ADR 0019 §8).
  statement       text not null check (length(btrim(statement)) between 1 and 1000),
  state           public.appeal_state not null default 'submitted',
  outcome         public.appeal_choice,
  outcome_reason  text check (outcome_reason is null or length(outcome_reason) <= 280),
  created_at      timestamptz not null default now(),
  decided_at      timestamptz,
  unique (action_id, appellant_id)
);

-- One equal vote per panelist; no weight column (T1).
create table public.appeal_decisions (
  id                 uuid primary key default gen_random_uuid(),
  appeal_id          uuid not null references public.appeals (id) on delete cascade,
  panelist_pseudonym text not null,
  choice             public.appeal_choice not null,
  decided_at         timestamptz not null default now(),
  constraint appeal_decisions_one_per_panelist unique (appeal_id, panelist_pseudonym)
);

-- Tier 3 "look again": a trained human, never a panel (T7).
create table public.second_look_requests (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  action_id    uuid not null references public.moderation_actions (id) on delete cascade,
  -- Health data (ADR 0019 §8).
  statement    text not null check (length(btrim(statement)) between 1 and 1000),
  state        public.request_state not null default 'submitted',
  created_at   timestamptz not null default now(),
  unique (action_id, requester_id)
);

-- ===========================================================================
-- 10. Legal holds (privacy floor item 8). Table only in this step: placing,
--     reading and releasing a hold, and keeping held rows through the cascade
--     (T25), are not built yet. Counsel defines holds (G6).
-- ===========================================================================
create table public.legal_holds (
  id          uuid primary key default gen_random_uuid(),
  held_table  text not null check (length(btrim(held_table)) > 0),
  held_id     uuid not null,
  legal_basis text not null check (length(btrim(legal_basis)) > 0),
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now(),
  constraint legal_holds_ends_after_start check (expires_at > created_at)
);

-- ===========================================================================
-- 11. The public log and the audit log (ADR 0019 §7; T3). No member
--     identifiers, no foreign keys, no free text.
-- ===========================================================================
create table public.moderation_log_public (
  id              uuid primary key default gen_random_uuid(),
  week_start      date not null check (extract(isodow from week_start) = 1),
  kind            public.moderation_log_kind not null,
  -- 'all', 'community:<slug>', or for a floor or gate change the public row it
  -- points at: 'floor:<safety|privacy>', 'gate:<G1-G9>'.
  scope           text not null check (
    scope = 'all' or scope ~ '^community:[a-z0-9-]{1,64}$'
    or scope ~ '^floor:(safety|privacy)$' or scope ~ '^gate:G[1-9]$'),
  category        public.moderation_category,
  -- An action label, a floor version ('version:<n>') or a gate change.
  action          text check (action is null or action ~ '^[a-z_]{1,40}$' or action ~ '^version:[0-9]{1,6}$'),
  count           integer,
  fewer_than_five boolean not null,
  -- Count kinds: a cell under 5 is never published; it shows "fewer than 5".
  constraint moderation_log_public_small_cells check (
    kind not in ('action', 'appeal_outcome', 'legal_hold', 'grant_count')
    or ((count is null or count >= 5) and fewer_than_five = (count is null))),
  -- Floor and gate changes carry no count and point at the public row that
  -- holds the reason.
  constraint moderation_log_public_change_rows check (
    kind not in ('floor_change', 'gate_change')
    or (count is null and not fewer_than_five and category is null
        and ((kind = 'floor_change' and scope ~ '^floor:' and action ~ '^version:')
          or (kind = 'gate_change' and scope ~ '^gate:' and action in ('met', 'unmet', 'defined'))))),
  constraint moderation_log_public_count_scope check (
    kind in ('floor_change', 'gate_change') or scope = 'all' or scope ~ '^community:'),
  -- Crisis is never shown per room.
  constraint moderation_log_public_crisis_site_wide check (category is distinct from 'crisis' or scope = 'all')
);

create table public.moderation_audit (
  id            uuid primary key default gen_random_uuid(),
  at            timestamptz not null default now(),
  actor_role    text not null,
  function_name text not null,
  table_name    text not null,
  row_count     integer not null check (row_count >= 0)
);

-- ===========================================================================
-- 12. Launch gates (ADR 0021). Seeded unmet. G1-G4 stay undefined until the
--     founder recruits and defines them; G5-G9 carry the plan §8 definition.
-- ===========================================================================
create table public.launch_gates (
  key        text primary key check (key ~ '^G[1-9]$'),
  title      text not null check (length(btrim(title)) > 0),
  status     public.gate_status not null default 'unmet',
  definition text not null default 'Not defined yet' check (length(btrim(definition)) > 0),
  defined_at timestamptz,
  met_at     timestamptz,
  constraint launch_gates_met_needs_definition check (
    status <> 'met' or (definition <> 'Not defined yet' and met_at is not null))
);

create table public.launch_gate_history (
  id         uuid primary key default gen_random_uuid(),
  gate_key   text not null references public.launch_gates (key),
  old_status public.gate_status not null,
  new_status public.gate_status not null,
  definition text not null,
  changed_at timestamptz not null default now()
);

insert into public.launch_gates (key, title, definition) values
  ('G1', 'Crisis response and review staffing', 'Not defined yet'),
  ('G2', 'Appeals panel', 'Not defined yet'),
  ('G3', 'Context-note oversight', 'Not defined yet'),
  ('G4', 'Who moderates before elections', 'Not defined yet'),
  ('G5', 'Published floors v1',
   'Both floors published in docs/policy/ and in the app, each item with its basis, '
   'and minimum_notice set in the governance charter.'),
  ('G6', 'Legal review',
   'Counsel has reviewed the floors, crisis routing, triage-match inference and its '
   'disclosure, legal holds, appeals copy, the public log, and Section 230.'),
  ('G7', 'Manual accessibility pass',
   'A recorded manual pass, with screen readers, on every moderation surface, '
   'the moderator console included.'),
  ('G8', 'Database tests run',
   'pgTAP and the db jest project pass against a local Supabase stack.'),
  ('G9', 'Data inventory entries',
   'Retention for removed content, closed crisis items, reports, appeal statements, '
   'action reasons, expired grant rows and access logs; the small-community threshold '
   'for the public log; max_interim_term and the interim gap; max_ban_term. Deferred: '
   'the migrations ship with these values NULL and fail closed. They are set with '
   'counsel before launch.');

-- ===========================================================================
-- 13. RLS on, and the table gate (see the matrix in the header)
-- ===========================================================================
alter table public.governance_config            enable row level security;
alter table public.floor_versions               enable row level security;
alter table public.floor_items                  enable row level security;
alter table public.floor_reexamination_requests enable row level security;
alter table public.floor_reexamination_answers  enable row level security;
alter table public.triage_lists                 enable row level security;
alter table public.reports                      enable row level security;
alter table public.moderation_items             enable row level security;
alter table public.moderation_actions           enable row level security;
alter table public.removed_content              enable row level security;
alter table public.member_blocks                enable row level security;
alter table public.member_bans                  enable row level security;
alter table public.moderator_grants             enable row level security;
alter table public.moderator_pseudonyms         enable row level security;
alter table public.appeals                      enable row level security;
alter table public.appeal_decisions             enable row level security;
alter table public.second_look_requests         enable row level security;
alter table public.legal_holds                  enable row level security;
alter table public.moderation_log_public        enable row level security;
alter table public.moderation_audit             enable row level security;
alter table public.launch_gates                 enable row level security;
alter table public.launch_gate_history          enable row level security;

-- The repeated REVOKE (PRODUCTION_READINESS §1.6), then service_role reset to
-- exactly the matrix.
revoke all on
  public.governance_config, public.floor_versions, public.floor_items,
  public.floor_reexamination_requests, public.floor_reexamination_answers,
  public.triage_lists, public.reports, public.moderation_items,
  public.moderation_actions, public.removed_content, public.member_blocks,
  public.member_bans, public.moderator_grants, public.moderator_pseudonyms,
  public.appeals, public.appeal_decisions, public.second_look_requests,
  public.legal_holds, public.moderation_log_public, public.moderation_audit,
  public.launch_gates, public.launch_gate_history
  from anon, authenticated, service_role;
revoke all on sequence public.moderator_pseudonym_seq from anon, authenticated;

-- anon: the public surfaces only.
grant select on public.governance_config, public.floor_versions, public.floor_items,
  public.floor_reexamination_answers, public.triage_lists, public.moderation_log_public,
  public.launch_gates, public.launch_gate_history
  to anon;

-- authenticated: reads, plus the member's own block and re-examination rows.
grant select on public.governance_config, public.floor_versions, public.floor_items,
  public.floor_reexamination_answers, public.triage_lists, public.moderation_log_public,
  public.launch_gates, public.launch_gate_history,
  public.reports, public.moderation_actions, public.removed_content,
  public.appeals, public.second_look_requests
  to authenticated;
grant select (id, post_id, comment_id, source, category, tier, state)
  on public.moderation_items to authenticated;
grant select, insert         on public.floor_reexamination_requests to authenticated;
grant select, insert, delete on public.member_blocks                to authenticated;

-- service_role: backend only (db.md).
grant select, insert, update, delete on
  public.governance_config, public.floor_reexamination_requests,
  public.floor_reexamination_answers, public.triage_lists, public.reports,
  public.moderation_items, public.moderation_actions, public.removed_content,
  public.member_blocks, public.member_bans, public.moderator_grants,
  public.moderator_pseudonyms, public.appeals, public.appeal_decisions,
  public.second_look_requests, public.legal_holds
  to service_role;
grant select, insert on public.floor_versions, public.floor_items,
  public.moderation_log_public, public.moderation_audit
  to service_role;
grant select, update on public.launch_gates to service_role;
grant select on public.launch_gate_history to service_role;
grant usage, select on sequence public.moderator_pseudonym_seq to service_role;
