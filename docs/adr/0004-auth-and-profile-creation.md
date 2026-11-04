# ADR 0004 — Passwordless auth, profile creation, and the consent lifecycle (Phase 1C)

Status: Accepted
Date: 2026-06-03
Relates: PRD §7.1 (identity/roles/onboarding), §8 (privacy), §9 (a11y);
wireframes B2/B3/C2/C3/B12, Addendum A B14; ADR 0002, ADR 0003.

## Context

Phase 1C wires the app to Supabase Auth: passwordless magic-link sign-in, the
gentle onboarding flow (role + optional opt-in health self-ID), and the consent
lifecycle (grant + withdraw) on top of the 1B schema. Out of scope: feeds,
communities browse, threads, posts, upbeats, journey screens, governance,
moderation, payments, analytics, passkey/social login, native deep-link return,
and download/delete-account (later slices).

The research spec (§3, auth detail) is not in-repo; the wireframes and PRD §7.1
were sufficient. No auth-provider detail required the spec.

## Decisions

### 1. Supabase client + env
A single typed client (`src/lib/supabase.ts`) built from
`EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (the **publishable**
key). `detectSessionInUrl` + PKCE handle the web magic-link callback; native uses
an AsyncStorage session store. The **secret key never appears in client code or
client env** — it is used only by the Node/DB tests via `.env.test` (gitignored).
`.env.example` + `.env.test.example` are committed as placeholder templates.

This image issues the **new Supabase key format** (`sb_publishable_…` /
`sb_secret_…`), not legacy JWTs. The pre-commit secrets guard was extended to
block `sb_secret_…` (and still blocks the legacy `service_role` JWT pattern)
while deliberately allowing the public `sb_publishable_…`.

### 2. Profile creation: `handle_new_user` trigger
A `handle_new_user` AFTER INSERT trigger on `auth.users` (SECURITY DEFINER,
`search_path = ''`, fully-qualified names, `on conflict (id) do nothing`) creates
the `profiles` row with safe, non-identifying defaults: `role = 'patient'`,
`display_name = 'New member'`.

- **Why a trigger, not a client-side upsert:** it is atomic with auth-user
  creation, cannot be raced/skipped/forgotten by any client path, and needs no
  extra client privilege. Consistent with the 1B SECURITY DEFINER convention the
  privacy-reviewer approved. `on conflict do nothing` guarantees "exactly once."
- **Why a neutral `display_name`:** `profiles` is authenticated-readable, so
  seeding the email local-part would leak PII. The member sets identity later.

### 3. Self-declared role vs. permission role
A new `onboarding_choice` enum (`patient|caregiver|both|professional`) and a
nullable `profiles.self_declared` column record the member's OWN statement from
onboarding step 1, faithfully — including **"both"** and a self-declared
**"professional"**. The permission `role` is derived safely from it:

| Onboarding choice | `self_declared` | `role` |
|---|---|---|
| I have an arrhythmia | `patient` | `patient` |
| I care for someone | `caregiver` | `caregiver` |
| Both | `both` | `patient` |
| Healthcare professional | `professional` | `patient` |

- Recording `self_declared` means mapping "both" → `patient` does **not** lose
  caregiver intent, and the professional self-declaration is captured the same
  way (per Phase 1C approval note 2).
- The `professional` role (which will carry future broadcast privileges) is
  **not** granted on self-declaration; it is granted only through the later
  verification slice ("extra verification later", wireframe B3).
- Role-class identity is in the allowed data-minimization set (PRD §8) and is
  **not** the opt-in, consent-gated health self-ID (diagnosis/symptom tags).
- Skipping onboarding writes nothing: `role` stays the `patient` default and
  `self_declared` stays null.

### 4. Consent lifecycle (grant + withdraw)
`src/lib/consent.ts` exposes pure functions over a Supabase client (so the exact
product code is tested against the live stack):
- **GRANT** writes exactly one current `consent_records` row
  (`purpose=health_self_id`, `source='onboarding'`, `policy_version =
  CONSENT_POLICY_VERSION`) **first**, then the selected `health_self_ids` through
  the RLS gate. Opting in requires the separate, **unchecked-by-default** consent
  AND ≥1 tag; anything else writes nothing.
- **WITHDRAW** sets `withdrawn_at`; the 1B
  `purge_self_id_on_consent_withdrawal` trigger deletes the member's
  `health_self_ids` so the data cannot exist at rest without current consent.
- **`CONSENT_POLICY_VERSION`** is a single exported constant — the one source of
  truth for the recorded policy version (per approval note 3).

### 5. Controlled vocabulary seeded
The 1B `self_id_tags` vocabulary was never populated (the pgTAP tests inserted
tags inline). Onboarding needs it, so `supabase/seed.sql` now seeds the allowed
set with plain, member-facing labels, reconciled with wireframe B3 (diagnosis set
adds `post_ablation` + `icd_recipient`; "Low mood"/"Fear of episodes"/"Fainting"
labels follow B3).

## TDD / test infrastructure
Tests were authored first and **confirmed failing** (captured output) before
implementation. They could not be landed as a separate red commit: the
non-bypassable pre-commit hook runs the full `npm test` + `typecheck`, and
`--no-verify` is prohibited (`.claude/rules/git.md`). So they land with the
implementation in one verified-green commit (this differs from 1B, whose
failing-first checkpoint used pgTAP, which the hook does not run).

Jest now has two projects: **`rn`** (jest-expo + RNTL for UI) and **`db`** (plain
node env for Supabase integration tests — the jest-expo preset mocks `fetch`, so
DB tests need a real-`fetch` node env). DB tests obtain real sessions via the
admin API (test-only secret key) + `signInWithPassword`. `@babel/preset-env` was
added for the node project's transform; `@types/node` enabled for the helper.

## RESEARCH-SPEC RECONCILIATION (revisit when the spec lands)
1. **"Both"** → `role patient` (+ `self_declared='both'`); the enum has no
   dual-role; a true multi-role model is deferred.
2. **Self-declared "professional"** → `role patient` until verification.
3. **`display_name` default** = `'New member'` (neutral, non-PII).
4. **`policy_version`** = `'v1'`; reconcile with the published data-promise (the
   wireframe shows "policy v2").
5. **No persistent "onboarded" flag** — the callback routes to onboarding; skip
   routes home.
6. **Local redirect URLs** added to `config.toml`; production allow-list deferred.
7. **Password-based test sessions** are a test convenience; the product path is
   passwordless magic-link.
8. **Test session via password** users are email-confirmed via the admin API.

## Consequences
- First sign-in always yields a profile; onboarding can set role + opt-in self-ID
  or be fully skipped; consent can be withdrawn with an end-to-end purge.
- Controlled vocabulary now ships in seed (local/dev). Before any non-local
  deploy it should move to a migration (reference data) — known follow-up.
- CI must have the local Supabase stack for the `db` jest project (it already
  needs it for pgTAP); otherwise scope `db` out of CI until wired.
