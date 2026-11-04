-- OneRhythm — the pre-launch updates list (ORDINARY MARKETING CONTACTS).
--
-- Decision: docs/adr/0011-landing-and-updates-list.md
--
-- ===========================================================================
-- THE BINDING RULE: this table is NOT member data, and the two may never be
-- correlated by this codebase.
-- ===========================================================================
-- A member's email is bound to opt-in health self-ID through the consent
-- ledger, which makes it consumer health data under MHMDA (Amendment 1 §8.x).
-- An address on the updates list is a person who asked to hear about a
-- project. Joining them would manufacture exactly the health-adjacent record
-- neither person consented to.
--
-- Therefore, and permanently:
--   * NO foreign key out of this table. It references nothing — not profiles,
--     not auth.users. pgTAP suite 04 asserts the FK count is zero.
--   * NO query, view, function, or report may touch this table and a member
--     table together. Enforced in product code by guard #8
--     (.claude/hooks/no-marketing-member-join.sh) and by
--     tests/unit/no-join-path.test.ts.
--   * NO dedupe across the boundary. The same address appearing in both
--     places is a coincidence this system must never resolve.
--   * NOTHING about the caller is recorded. The functions below deliberately
--     never read auth.uid(), a JWT claim, an IP, or a user agent — a
--     signed-in member confirming their own subscription must leave no trace
--     linking the two identities.
--
-- ===========================================================================
-- ACCESS: no table grant to any client role. Three definer functions only.
-- ===========================================================================
-- anon and authenticated hold ZERO privileges on the table — not even INSERT.
-- The reason is an enumeration oracle: with a direct INSERT grant and a unique
-- index on email, PostgREST answers 23505 for an address already on the list
-- and 201 for a new one. Anyone with curl could then test whether a given
-- person is a subscriber, no matter what the UI displays. `on conflict do
-- nothing` inside a SECURITY DEFINER function removes the oracle, keeps both
-- tokens server-generated (never client-supplied), and leaves one chokepoint
-- where rate limiting can later be added.
--
-- RLS is enabled with ZERO policies. That is not an omission: with no grant
-- and no policy the table is unreachable except through the three functions,
-- which is the whole intent. (Contrast ADR 0005's deliberate anon SELECT on
-- posts/profiles/consent_records, which exists to keep the table gate open so
-- the crown-jewel suites exercise RLS itself. Nothing here needs that.)
--
-- ===========================================================================
-- WHY THE `revoke ... from authenticated` BELOW IS LOAD-BEARING
-- ===========================================================================
-- Migration 20260708051747 pinned ALTER DEFAULT PRIVILEGES for role postgres
-- in schema public. Verified against this image (pg_default_acl):
--
--   postgres | public | r | {postgres=arwdDxtm/postgres,
--                            authenticated=arwd/postgres,
--                            service_role=arwd/postgres}
--   postgres | public | f | {postgres=X/postgres}
--
-- So EVERY new table in public is handed full DML to `authenticated`
-- automatically. Without the explicit revoke below, every signed-in member
-- could read and edit the entire marketing list on the day this migration
-- ran. ADR 0005 pinned those defaults to stop anon drift and got that right;
-- the consequence for `authenticated` is that a new table is open by default
-- and must be closed on purpose. Any future table holding data that members
-- must not read has to repeat this revoke. (Functions are the opposite: the
-- pinned `f` default grants EXECUTE to postgres only, so the grants below are
-- required for the functions to be callable at all.)

create table public.updates_subscribers (
  id uuid primary key default gen_random_uuid(),

  -- Normalized to lower(btrim(...)) by subscribe_to_updates before it ever
  -- reaches this column; the unique index is therefore case-insensitive in
  -- practice without depending on the citext extension.
  email text not null,

  created_at timestamptz not null default now(),

  -- Which surface the address came from ('landing'). Product provenance only:
  -- never a campaign identifier, never anything about the person.
  source text not null default 'landing',

  -- DOUBLE OPT-IN. `confirmed_at is null` means NOT SUBSCRIBED. Nothing may
  -- ever be mailed to a row where this is null. Pinned by test.
  confirmed_at timestamptz,

  -- Set by unsubscribe_from_updates. The row is KEPT (not deleted) so the
  -- address stays suppressed; erasure is a separate, explicit request.
  unsubscribed_at timestamptz,

  -- 32 random bytes, hex. Server-generated, never accepted from a client.
  confirm_token text not null,
  unsubscribe_token text not null,

  constraint updates_subscribers_email_length
    check (char_length(email) between 3 and 254),
  -- Deliberately loose. Email validity is decided by whether mail is
  -- deliverable, not by a regex; this only rejects obvious nonsense.
  constraint updates_subscribers_email_shape
    check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint updates_subscribers_source_length
    check (char_length(source) between 1 and 64)
);

comment on table public.updates_subscribers is
  'Pre-launch project-updates list. MARKETING CONTACTS ONLY. Never joined to '
  'profiles/auth.users; no FK by design (ADR 0011). Reachable only via '
  'subscribe_to_updates / confirm_updates_subscription / '
  'unsubscribe_from_updates.';

-- Unique INDEX (not constraint) on email: `on conflict (email) do nothing`
-- infers against it, and it is what makes the duplicate case silent.
create unique index updates_subscribers_email_key
  on public.updates_subscribers (email);
create unique index updates_subscribers_confirm_token_key
  on public.updates_subscribers (confirm_token);
create unique index updates_subscribers_unsubscribe_token_key
  on public.updates_subscribers (unsubscribe_token);

-- Default-deny, with no policies at all. See the header.
alter table public.updates_subscribers enable row level security;

-- ---------------------------------------------------------------------------
-- Grants: nothing to anon/authenticated. service_role is backend-only and
-- needs DML to eventually send mail, to run the founder-visibility export, and
-- to let the db tests inspect row state.
-- ---------------------------------------------------------------------------
revoke all on public.updates_subscribers from anon, authenticated, public;
grant select, insert, update, delete on public.updates_subscribers to service_role;

-- ===========================================================================
-- subscribe_to_updates — the only write path open to the public.
-- ===========================================================================
-- Returns void, ALWAYS, whether the address was new or already present. That
-- silence is the anti-enumeration property; do not add a return value here.
-- A malformed address DOES raise, because "that isn't an email" reveals
-- nothing about who is on the list and the alternative is an address that
-- silently vanishes.
create function public.subscribe_to_updates(
  p_email text,
  p_source text default 'landing'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
  v_source text := coalesce(nullif(btrim(p_source), ''), 'landing');
begin
  if v_email is null
     or char_length(v_email) < 3
     or char_length(v_email) > 254
     or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  -- Provenance is a short allow-listed label, never free text from the URL.
  if v_source not in ('landing') then
    v_source := 'landing';
  end if;

  insert into public.updates_subscribers
    (email, source, confirm_token, unsubscribe_token)
  values (
    v_email,
    v_source,
    encode(extensions.gen_random_bytes(32), 'hex'),
    encode(extensions.gen_random_bytes(32), 'hex')
  )
  on conflict (email) do nothing;
end;
$$;

-- ===========================================================================
-- confirm_updates_subscription — the double opt-in gate.
-- ===========================================================================
-- Returns a status so the page can speak plainly ('confirmed' /
-- 'already_confirmed' / 'invalid'). This is NOT an enumeration risk: the
-- caller already holds a 256-bit token that was mailed to that address, so
-- the answer tells them nothing they did not already know. Contrast
-- subscribe_to_updates, where the caller supplies an address they may not own.
--
-- The token is deliberately NOT cleared on confirm, so a second click on the
-- same link can honestly say "you're already on the list" instead of "that
-- link isn't valid". It confers no capability beyond re-confirming a row that
-- is already confirmed.
create function public.confirm_updates_subscription(p_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated int;
begin
  if p_token is null or char_length(p_token) <> 64 then
    return 'invalid';
  end if;

  update public.updates_subscribers
     set confirmed_at = now()
   where confirm_token = p_token
     and confirmed_at is null;
  get diagnostics v_updated = row_count;
  if v_updated > 0 then
    return 'confirmed';
  end if;

  if exists (select 1 from public.updates_subscribers
              where confirm_token = p_token) then
    return 'already_confirmed';
  end if;

  return 'invalid';
end;
$$;

-- ===========================================================================
-- unsubscribe_from_updates — CAN-SPAM, works with no login, from day one.
-- ===========================================================================
-- Idempotent. Sets unsubscribed_at once and keeps the row so the address stays
-- suppressed rather than being re-added by a later signup.
create function public.unsubscribe_from_updates(p_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated int;
begin
  if p_token is null or char_length(p_token) <> 64 then
    return 'invalid';
  end if;

  update public.updates_subscribers
     set unsubscribed_at = now()
   where unsubscribe_token = p_token
     and unsubscribed_at is null;
  get diagnostics v_updated = row_count;
  if v_updated > 0 then
    return 'unsubscribed';
  end if;

  if exists (select 1 from public.updates_subscribers
              where unsubscribe_token = p_token) then
    return 'already_unsubscribed';
  end if;

  return 'invalid';
end;
$$;

-- ---------------------------------------------------------------------------
-- Function grants. Explicit per ADR 0005 rule 4 — never inherit whatever the
-- image's defaults happen to be. `authenticated` gets execute too: a member
-- may well click a confirm or unsubscribe link while signed in on the same
-- browser, and that must work rather than 42501. The functions record nothing
-- about the caller, so granting both roles creates no link between them.
-- ---------------------------------------------------------------------------
revoke all on function public.subscribe_to_updates(text, text) from public;
revoke all on function public.confirm_updates_subscription(text) from public;
revoke all on function public.unsubscribe_from_updates(text) from public;

grant execute on function public.subscribe_to_updates(text, text)
  to anon, authenticated;
grant execute on function public.confirm_updates_subscription(text)
  to anon, authenticated;
grant execute on function public.unsubscribe_from_updates(text)
  to anon, authenticated;
