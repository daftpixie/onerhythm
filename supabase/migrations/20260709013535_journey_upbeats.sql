-- Phase 1E — journey upbeats (approved decision a, plan phase-1e-journey-pages).
--
-- EXPAND-ONLY: adds a third nullable subject FK to the presence/absence
-- upbeat row. No backfill, no dual-write, no data movement. The no-downvote
-- invariant is UNCHANGED and emerges stronger:
--   - the row's existence is still the entire signal (no value/weight/sign),
--   - a CHECK still enforces EXACTLY ONE subject (now one of three),
--   - one upbeat per member per journey entry (new unique pair),
--   - score = count(*), same as posts and comments.
--
-- GRANTS (ADR 0005): NONE needed — upbeats already grants authenticated
-- select/insert/delete and anon nothing; this migration adds no table and
-- must not touch the grant matrix. RLS policies are untouched: insert/delete
-- remain member_id-scoped; the CHECK owns the subject shape.
--
-- Deletion cascade: journey_entries → upbeats via ON DELETE CASCADE, the
-- same native-cascade design ADR 0003 #8 chose the polymorphic FKs for.
--
-- pgTAP suite 00 is amended alongside this migration (sanctioned, founder-
-- reviewed diff): plan 11 → 12 — the exact-column-set gains journey_entry_id
-- and a NEW unique-pair assertion is added. More assertions, never fewer.

alter table public.upbeats
  add column journey_entry_id uuid
    references public.journey_entries(id) on delete cascade;

alter table public.upbeats
  drop constraint upbeats_exactly_one_subject;
alter table public.upbeats
  add constraint upbeats_exactly_one_subject
    check (
      (post_id is not null)::int
      + (comment_id is not null)::int
      + (journey_entry_id is not null)::int = 1
    );

alter table public.upbeats
  add constraint upbeats_one_per_member_journey
    unique (member_id, journey_entry_id);
