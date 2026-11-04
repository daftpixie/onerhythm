-- OneRhythm — a panelist grant needs G2 as well as G4.
--
-- Founder decision, 2026-10-30. 20261029130200's grant trigger checked only
-- G4 ("who moderates before elections"), so a panelist could be seated while
-- G2 ("appeals panel") was unmet. G2 is where the panel's people, size,
-- quorum and tie rule are defined (ADR 0021), so no panelist exists before it.
-- A moderator grant still needs only G4.
--
-- Forward-only: the function is replaced; 20261029130200 is not edited.
-- CREATE OR REPLACE keeps the function's ACL, so the EXECUTE revokes made by
-- name in 20261029130200 still hold (06_function_execute_allowlist).
-- Pinned by supabase/tests/23_panelist_grants_need_g2_test.sql.

create or replace function public.moderator_grants_on_insert()
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
  -- A panel needs its own gate: G2 defines the appeals panel (who, size,
  -- quorum, tie rule; ADR 0021). G4 alone must not seat a panelist.
  if new.role = 'panelist' and not public.gate_is_met('G2') then
    raise exception 'no panelist grant while G2 is unmet' using errcode = '23514';
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
