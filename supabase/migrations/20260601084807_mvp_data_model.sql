-- OneRhythm Phase 1B — MVP data model
-- Identity/roles, controlled-vocabulary health self-ID (consent-gated), the
-- versioned consent ledger, communities + memberships, posts + threaded
-- comments, upbeats (presence/absence), journey entries.
--
-- Invariants enforced here (proven by supabase/tests/*):
--   1. no downvote  — upbeats are presence/absence only; one per member+subject.
--   2. RLS default-deny — every table has RLS enabled with explicit policies.
--   3. consent-gating — health self-ID requires a current consent record.
--   4. deletion cascade — deleting auth.users purges every member-owned row.
--
-- NO clinical/ECG columns anywhere. No payment/entitlement tables.
-- See docs/adr/0003-mvp-data-model.md for the research-spec reconciliation notes.

-- ===========================================================================
-- Enums
-- ===========================================================================
create type public.user_role as enum
  ('patient', 'caregiver', 'professional', 'moderator', 'admin');

create type public.self_id_tag_type as enum
  ('diagnosis', 'physical_symptom', 'emotional_symptom');

-- Only one consent purpose this phase; extensible later (see ADR 0003).
create type public.consent_purpose as enum ('health_self_id');

-- ===========================================================================
-- profiles — 1:1 with auth.users; identity + role. No clinical data.
-- ===========================================================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         public.user_role not null default 'patient',
  display_name text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Any authenticated member may read profiles (public display_name/role).
create policy profiles_select_authenticated on public.profiles
  for select to authenticated using (true);
-- A member may create/update/delete only their own profile row.
create policy profiles_insert_self on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_delete_self on public.profiles
  for delete to authenticated using (id = auth.uid());

grant select, insert, update, delete on public.profiles to authenticated;

-- ===========================================================================
-- self_id_tags — controlled vocabulary of allowed tags. NOT member data,
-- therefore NOT consent-gated. Authenticated-readable; writes are admin/
-- service_role only this phase (governance-extensible later — ADR 0003).
-- ===========================================================================
create table public.self_id_tags (
  id         uuid primary key default gen_random_uuid(),
  tag_type   public.self_id_tag_type not null,
  code       text not null unique,
  label      text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.self_id_tags enable row level security;

-- Read-only vocabulary for members; no member write policies (default-deny).
create policy self_id_tags_select_authenticated on public.self_id_tags
  for select to authenticated using (true);

grant select on public.self_id_tags to authenticated;

-- ===========================================================================
-- consent_records — versioned consent ledger (append-only; deletable only via
-- the rights workflow / account-deletion cascade). "Current consent" for a
-- purpose = a row with withdrawn_at IS NULL.
-- ===========================================================================
create table public.consent_records (
  id             uuid primary key default gen_random_uuid(),
  member_id      uuid not null references public.profiles(id) on delete cascade,
  purpose        public.consent_purpose not null,
  policy_version text not null,
  granted_at     timestamptz not null default now(),
  withdrawn_at   timestamptz,
  source         text not null
);
alter table public.consent_records enable row level security;

-- A member sees and grants only their own consent.
create policy consent_select_self on public.consent_records
  for select to authenticated using (member_id = auth.uid());
create policy consent_insert_self on public.consent_records
  for insert to authenticated with check (member_id = auth.uid());
-- A member may UPDATE only their own row, and only to withdraw it (the
-- append-only guard trigger below blocks any other mutation). No DELETE policy:
-- removal happens solely through the rights workflow (account-deletion cascade).
create policy consent_update_self on public.consent_records
  for update to authenticated using (member_id = auth.uid())
  with check (member_id = auth.uid());

grant select, insert, update on public.consent_records to authenticated;

-- Append-only guard: the only permitted update is a one-way withdrawal
-- (withdrawn_at NULL -> timestamp). Every other field is immutable, and a
-- withdrawn record cannot be revived or re-edited.
create or replace function public.consent_records_append_only()
returns trigger
language plpgsql
as $$
begin
  if old.withdrawn_at is not null then
    raise exception 'consent_records are append-only: a withdrawn record cannot be modified'
      using errcode = 'check_violation';
  end if;
  if new.member_id      is distinct from old.member_id
     or new.purpose        is distinct from old.purpose
     or new.policy_version is distinct from old.policy_version
     or new.granted_at     is distinct from old.granted_at
     or new.source         is distinct from old.source
     or new.id             is distinct from old.id then
    raise exception 'consent_records are append-only: only withdrawn_at may change'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger consent_records_append_only_guard
  before update on public.consent_records
  for each row execute function public.consent_records_append_only();

-- ===========================================================================
-- health_self_ids — member's opt-in diagnosis/symptom tags. CONSENT-GATED:
-- a row can neither be written nor read without a current health_self_id
-- consent record. Regulated consumer health data (MHMDA/GDPR).
-- ===========================================================================
create table public.health_self_ids (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.profiles(id) on delete cascade,
  tag_id     uuid not null references public.self_id_tags(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (member_id, tag_id)
);
alter table public.health_self_ids enable row level security;

-- Helper: does the current member hold a current (non-withdrawn) health_self_id
-- consent? SECURITY DEFINER so the gating check is reliable regardless of the
-- caller's direct grants on consent_records.
create or replace function public.has_current_health_consent(p_member uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.consent_records c
    where c.member_id = p_member
      and c.purpose = 'health_self_id'
      and c.withdrawn_at is null
  );
$$;

-- Self + current consent gate every read and write. Self-ID cannot be read
-- without current consent (withdrawal makes it disappear), and cannot be
-- created/updated without it.
create policy health_self_ids_select on public.health_self_ids
  for select to authenticated
  using (member_id = auth.uid() and public.has_current_health_consent(auth.uid()));
create policy health_self_ids_insert on public.health_self_ids
  for insert to authenticated
  with check (member_id = auth.uid() and public.has_current_health_consent(auth.uid()));
create policy health_self_ids_update on public.health_self_ids
  for update to authenticated
  using (member_id = auth.uid() and public.has_current_health_consent(auth.uid()))
  with check (member_id = auth.uid() and public.has_current_health_consent(auth.uid()));
create policy health_self_ids_delete on public.health_self_ids
  for delete to authenticated using (member_id = auth.uid());

grant select, insert, update, delete on public.health_self_ids to authenticated;

-- Withdrawal hardening: when consent is withdrawn, the member's self-ID rows are
-- deleted so the data cannot exist at rest without current consent. SECURITY
-- DEFINER so the purge always completes.
create or replace function public.purge_self_id_on_withdrawal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.purpose = 'health_self_id'
     and old.withdrawn_at is null and new.withdrawn_at is not null then
    delete from public.health_self_ids where member_id = new.member_id;
  end if;
  return new;
end;
$$;

create trigger purge_self_id_on_consent_withdrawal
  after update on public.consent_records
  for each row execute function public.purge_self_id_on_withdrawal();

-- ===========================================================================
-- communities — diagnosis/caregiver/general spaces. Names are publicly
-- readable (anon) for discovery; creation/edit is admin/service_role only this
-- phase (Tier-1 community-creation governance is Phase 3).
-- ===========================================================================
create table public.communities (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  description  text,
  is_caregiver boolean not null default false,
  created_at   timestamptz not null default now()
);
alter table public.communities enable row level security;

create policy communities_select_public on public.communities
  for select to anon, authenticated using (true);

grant select on public.communities to anon, authenticated;

-- ===========================================================================
-- memberships — member <-> community join. Self-managed join/leave.
-- ===========================================================================
create table public.memberships (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references public.profiles(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  unique (member_id, community_id)
);
alter table public.memberships enable row level security;

create policy memberships_select_self on public.memberships
  for select to authenticated using (member_id = auth.uid());
create policy memberships_insert_self on public.memberships
  for insert to authenticated with check (member_id = auth.uid());
create policy memberships_delete_self on public.memberships
  for delete to authenticated using (member_id = auth.uid());

grant select, insert, delete on public.memberships to authenticated;

-- ===========================================================================
-- posts — authored within a community. Authenticated-only read.
-- ===========================================================================
create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.profiles(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  title        text not null,
  body         text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.posts enable row level security;

create policy posts_select_authenticated on public.posts
  for select to authenticated using (true);
create policy posts_insert_author on public.posts
  for insert to authenticated with check (author_id = auth.uid());
create policy posts_update_author on public.posts
  for update to authenticated using (author_id = auth.uid())
  with check (author_id = auth.uid());
create policy posts_delete_author on public.posts
  for delete to authenticated using (author_id = auth.uid());

grant select, insert, update, delete on public.posts to authenticated;

-- ===========================================================================
-- comments — threaded via self-referential parent_comment_id.
-- ===========================================================================
create table public.comments (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid not null references public.posts(id) on delete cascade,
  author_id         uuid not null references public.profiles(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  body              text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table public.comments enable row level security;

create policy comments_select_authenticated on public.comments
  for select to authenticated using (true);
create policy comments_insert_author on public.comments
  for insert to authenticated with check (author_id = auth.uid());
create policy comments_update_author on public.comments
  for update to authenticated using (author_id = auth.uid())
  with check (author_id = auth.uid());
create policy comments_delete_author on public.comments
  for delete to authenticated using (author_id = auth.uid());

grant select, insert, update, delete on public.comments to authenticated;

-- ===========================================================================
-- upbeats — presence/absence positive feedback. The row's existence IS the
-- signal. There is no signed/weighted/negative column ("no downvote"). Exactly
-- one subject (post or comment); one upbeat per member per subject; score =
-- count(*). No UPDATE (un-upbeat = delete the row).
-- ===========================================================================
create table public.upbeats (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint upbeats_exactly_one_subject
    check ((post_id is not null)::int + (comment_id is not null)::int = 1),
  constraint upbeats_one_per_member_post    unique (member_id, post_id),
  constraint upbeats_one_per_member_comment unique (member_id, comment_id)
);
alter table public.upbeats enable row level security;

create policy upbeats_select_authenticated on public.upbeats
  for select to authenticated using (true);
create policy upbeats_insert_self on public.upbeats
  for insert to authenticated with check (member_id = auth.uid());
create policy upbeats_delete_self on public.upbeats
  for delete to authenticated using (member_id = auth.uid());

grant select, insert, delete on public.upbeats to authenticated;

-- ===========================================================================
-- journey_entries — member "my journey" blog pages. Readable when published
-- or owned; fully member-owned and deletable.
-- ===========================================================================
create table public.journey_entries (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  body         text not null,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.journey_entries enable row level security;

create policy journey_select_published_or_own on public.journey_entries
  for select to authenticated using (is_published or author_id = auth.uid());
create policy journey_insert_author on public.journey_entries
  for insert to authenticated with check (author_id = auth.uid());
create policy journey_update_author on public.journey_entries
  for update to authenticated using (author_id = auth.uid())
  with check (author_id = auth.uid());
create policy journey_delete_author on public.journey_entries
  for delete to authenticated using (author_id = auth.uid());

grant select, insert, update, delete on public.journey_entries to authenticated;
