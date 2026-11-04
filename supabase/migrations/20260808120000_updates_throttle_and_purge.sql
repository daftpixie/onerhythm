-- OneRhythm — per-address rate limiting on the signup RPC, and an ops purge for
-- unconfirmed rows.
--
-- Migration 20260806134500 left "one chokepoint where rate limiting can later be
-- added". This is that addition, and it inherits every rule from that header:
-- no FK out, no correlation with member data, nothing recorded about the caller.
--
-- ===========================================================================
-- SCOPE: this is PER-ADDRESS protection, not volumetric protection.
-- ===========================================================================
-- It stops one address being hammered — repeat-signup abuse, and a trickle of
-- confirmation mail aimed at someone who never asked for it once SMTP is live.
-- It does NOT stop a flood from one IP across thousands of distinct addresses;
-- that is a Cloudflare-layer concern and is recorded as a DEPLOYMENT task in
-- docs/PRODUCTION_READINESS.md, not as a gap in this file. Doing it here would
-- mean recording an IP per attempt, which contradicts the "nothing about the
-- caller" rule the marketing boundary depends on.
--
-- ===========================================================================
-- WHY A DIGEST, AND WHAT IT DOES *NOT* BUY
-- ===========================================================================
-- The bucket key is sha256(normalized email), so this table is not a second
-- copy of the list: it never holds an address, and it cannot be read as one.
--
-- Being straight about the limit, because "hashed" is often used to mean
-- "anonymous" and it does not mean that here. Email addresses are low-entropy
-- and enumerable, so an unsalted sha256 is reversible by dictionary attack for
-- anyone who can read these rows. This digest is therefore still PERSONAL DATA
-- and is treated as such: RLS on with zero policies, no grant to anon or
-- authenticated, written only inside the definer function, and purged on the
-- same schedule as the rows it protects. What the digest buys is that a leak of
-- THIS table alone yields no directly usable address list, and that the throttle
-- cannot become a shadow subscriber list by accident. It is not a claim of
-- anonymity. A keyed HMAC would be stronger; it would also mean a secret to
-- manage and rotate, and a rotation would silently reset every live bucket.
-- Recorded as a considered tradeoff rather than an oversight.
--
-- Note also what the throttle knows that the main table does not: attempts
-- against addresses that were never inserted (already-present, or throttled).
-- That is the smallest amount of extra state that can make throttling work, and
-- it is why the retention below is short.

create table public.updates_signup_throttle (
  -- sha256(lower(btrim(email))). 32 bytes. Never an address. See header.
  email_hash bytea not null,

  -- Fixed-hour bucket from date_trunc, so the window is deterministic and needs
  -- no sliding-window bookkeeping.
  window_start timestamptz not null,

  attempts integer not null default 1,

  primary key (email_hash, window_start),

  constraint updates_signup_throttle_hash_len
    check (octet_length(email_hash) = 32),
  constraint updates_signup_throttle_attempts_positive
    check (attempts > 0)
);

comment on table public.updates_signup_throttle is
  'Per-address signup rate limiting for subscribe_to_updates. Holds a sha256 '
  'digest and an hour bucket — never an email address, never anything about the '
  'caller. No FK by design (ADR 0011). Written only inside '
  'subscribe_to_updates; purged by purge_unconfirmed_updates_subscribers.';

-- Supports the purge's range delete.
create index updates_signup_throttle_window_idx
  on public.updates_signup_throttle (window_start);

-- Default-deny, with no policies at all — same posture as the table it protects.
alter table public.updates_signup_throttle enable row level security;

-- The revoke is load-bearing for exactly the reason spelled out in
-- 20260806134500: ALTER DEFAULT PRIVILEGES hands `authenticated` full DML on
-- every new table in public, so a new table is OPEN by default and must be
-- closed on purpose. Without this line every signed-in member could read the
-- digests.
revoke all on public.updates_signup_throttle from anon, authenticated, public;
grant select, insert, update, delete on public.updates_signup_throttle
  to service_role;

-- ===========================================================================
-- subscribe_to_updates — replaced, same signature, same silence.
-- ===========================================================================
-- Still `returns void` on every path that is not a malformed address. A NEW
-- address, an address ALREADY on the list, and a THROTTLED address are
-- indistinguishable to the caller: same status, same empty body, no error.
-- Pinned by tests/db/updates-throttle.test.ts.
--
-- Do not "improve" this by reporting the throttle to the client. Telling a
-- caller "you are being rate limited on this address" reveals that the address
-- reached the limit, which is a slower version of the enumeration oracle the
-- whole design removes.
create or replace function public.subscribe_to_updates(
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
  v_attempts integer;

  -- Five attempts per address per hour. Generous for a human who mistypes and
  -- retries, useless for grinding a confirmation mail at somebody.
  c_limit constant integer := 5;
begin
  if v_email is null
     or char_length(v_email) < 3
     or char_length(v_email) > 254
     or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  if v_source not in ('landing') then
    v_source := 'landing';
  end if;

  -- Count the attempt BEFORE deciding, so the limit applies to attempts rather
  -- than to successes. Counting only successes would let an attacker retry an
  -- already-present address without ever incrementing anything.
  insert into public.updates_signup_throttle
    (email_hash, window_start, attempts)
  values (
    extensions.digest(v_email, 'sha256'),
    date_trunc('hour', now()),
    1
  )
  on conflict (email_hash, window_start) do update
    set attempts = public.updates_signup_throttle.attempts + 1
  returning attempts into v_attempts;

  if v_attempts > c_limit then
    -- Silent. Identical to the new and duplicate paths.
    return;
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

-- Re-assert grants. CREATE OR REPLACE keeps existing grants, but stating them is
-- ADR 0005 rule 4 — never inherit whatever the image's defaults happen to be.
revoke all on function public.subscribe_to_updates(text, text) from public;
grant execute on function public.subscribe_to_updates(text, text)
  to anon, authenticated;

-- ===========================================================================
-- purge_unconfirmed_updates_subscribers — an OPS function, not a public one.
-- ===========================================================================
-- Deletes rows that never completed double opt-in and are older than the
-- retention window, plus throttle buckets that are no longer live.
--
-- A row with confirmed_at set is KEPT however old — that person is on the list.
-- A row with unsubscribed_at set is also kept: 20260806134500 keeps unsubscribed
-- rows deliberately so the address stays suppressed, and deleting them here
-- would let a later signup silently re-add someone who opted out. Only the
-- never-confirmed, never-unsubscribed, stale rows go.
--
-- EXECUTE goes to service_role ONLY. anon and authenticated must not be able to
-- trigger a bulk delete, and there is no member-facing reason to.
--
-- IMPORTANT, and the reason app/privacy-notice.tsx is NOT edited in this
-- migration: shipping a callable function does not make an automatic cleanup
-- true. The notice currently says we will not promise a cleanup we have not
-- built, which is still the honest sentence until this is actually SCHEDULED
-- (pg_cron, or a documented ops run). Scheduling it is a founder action in
-- docs/PRODUCTION_READINESS.md; the copy changes when the schedule exists, not
-- when the function does.
create function public.purge_unconfirmed_updates_subscribers(
  p_older_than interval default '30 days'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  if p_older_than is null or p_older_than < interval '1 day' then
    raise exception 'retention_window_too_short' using errcode = '22023';
  end if;

  delete from public.updates_subscribers
   where confirmed_at is null
     and unsubscribed_at is null
     and created_at < now() - p_older_than;
  get diagnostics v_deleted = row_count;

  -- Throttle buckets outlive their usefulness after the window closes. Keeping
  -- a day is enough to make the counter meaningful across a clock edge.
  delete from public.updates_signup_throttle
   where window_start < now() - interval '1 day';

  return v_deleted;
end;
$$;

comment on function public.purge_unconfirmed_updates_subscribers(interval) is
  'Ops function. Deletes never-confirmed, never-unsubscribed subscriber rows '
  'older than the retention window, and stale throttle buckets. service_role '
  'only. Not scheduled by this migration — see docs/PRODUCTION_READINESS.md.';

revoke all on function public.purge_unconfirmed_updates_subscribers(interval)
  from public;
grant execute on function public.purge_unconfirmed_updates_subscribers(interval)
  to service_role;
