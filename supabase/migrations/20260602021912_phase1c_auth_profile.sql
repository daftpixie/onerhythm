-- OneRhythm Phase 1C — auth wiring: profile creation on first sign-in, and a
-- faithful record of the member's self-declared onboarding choice.
--
-- See docs/adr/0004-auth-and-profile-creation.md for the mechanism + the
-- research-spec reconciliation (role mapping, display_name default, etc.).

-- ===========================================================================
-- onboarding_choice — the member's OWN statement of who they are, recorded
-- exactly as selected in onboarding step 1. This is distinct from
-- profiles.role (the permission/RLS role). "both" and a self-declared
-- "professional" are recorded here without granting the corresponding
-- privileged role: caregiver intent in "both" is not lost, and the
-- professional role (future broadcast privileges) is granted only through the
-- later verification slice. Role-class identity is in the allowed data-
-- minimization set (PRD §8); it is NOT the opt-in, consent-gated health
-- self-ID (diagnosis/symptom tags).
-- ===========================================================================
create type public.onboarding_choice as enum
  ('patient', 'caregiver', 'both', 'professional');

alter table public.profiles
  add column self_declared public.onboarding_choice;

-- ===========================================================================
-- handle_new_user — create the profile exactly once when an auth user is
-- created (first sign-in). SECURITY DEFINER with a pinned empty search_path and
-- fully-qualified names (the hardened 1B convention). Safe, non-identifying
-- defaults: role 'patient', a neutral display_name. The real role / self_declared
-- value is set during onboarding. `on conflict do nothing` keeps it idempotent.
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, 'New member', 'patient')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
