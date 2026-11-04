# Phase 1C plan — passwordless auth · onboarding · consent lifecycle (grant + withdraw)

Status: AWAITING APPROVAL ("APPROVED — build Phase 1C")
Date: 2026-06-02
Builds on: Phase 1A (app shell, Brand v2, crisis primitives, ADR 0002),
Phase 1B (MVP schema + RLS default-deny + crown-jewel invariants, ADR 0003).
Becomes: ADR 0004 (auth + profile-creation mechanism + reconciliation).

Scope is exactly the Phase 1C prompt: wire the Supabase client; magic-link auth
(request → web callback → session → sign out); create the profile on first
sign-in; gentle onboarding (role step + optional opt-in health self-ID with a
separate, unchecked consent); the consent GRANT and WITHDRAW (prove the 1B purge
end-to-end); full WCAG 2.2 AA on every new screen. **No** feeds, communities
browse, threads, post composer, upbeat UI, journey screens, governance,
moderation, payments, analytics, passkey/social login, native deep-link return,
or download/delete-account. Those are later slices.

---

## 0. Local stack confirmed (Step 1)

`npx supabase status` (running via `-x studio,imgproxy,edge-runtime`):
- Project URL: `http://127.0.0.1:54321`
- DB: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- Mailpit (local mail inbox): `http://127.0.0.1:54324`
- **Publishable key** (client-safe): `sb_publishable_…`
- **Secret key** (backend/test-only, NEVER client): `sb_secret_…`

This image uses the **new Supabase key format** (`sb_publishable_…` /
`sb_secret_…`), not legacy JWT (`eyJ…`) anon/service keys. `@supabase/supabase-js`
v2 accepts the publishable key as the client key. Nothing here needs the
research spec.

---

## 1. Supabase client + env wiring

**New dependency:** `@supabase/supabase-js` (+ `@react-native-async-storage/async-storage`
for native session persistence; web uses the default localStorage adapter).

**`src/lib/supabase.ts`** — single typed client:
```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
const url  = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;   // publishable key only
export const supabase = createClient<Database>(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,   // web magic-link callback
    flowType: "pkce",
    // storage: AsyncStorage on native only (guarded by Platform.OS)
  },
});
```
- Env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Expo
  inlines `EXPO_PUBLIC_*` at build; only the publishable key + URL ever reach the
  client. **The secret key never appears in client code or client env.**
- Commit **`.env.example`** with placeholders. Real values go in gitignored
  `.env.local` (`.gitignore` already ignores `.env*` except `.env.example`; the
  `secrets-pii-scan` pre-commit guard also blocks any staged `.env`).
- `.env.test.example` documents the test-only `SUPABASE_TEST_SERVICE_KEY`
  (the `sb_secret_…` value) used solely by the Node DB tests via the admin API —
  read from a gitignored `.env.test`, never committed, never bundled.

**`supabase/config.toml`**: add the Expo web dev origin + callback to
`additional_redirect_urls` (e.g. `http://127.0.0.1:8081`,
`http://127.0.0.1:8081/auth/callback`) so the local magic-link redirect is
allowed. Local-only config; production redirect URLs are deferred.

---

## 2. Profile creation on first sign-in (the ADR 0004 decision)

**Mechanism: a `handle_new_user` AFTER INSERT trigger on `auth.users`**, SECURITY
DEFINER with `search_path = ''` and fully-qualified names — the same hardened
pattern the privacy-reviewer approved in 1B. New migration
`supabase/migrations/<ts>_handle_new_user.sql`:
```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, 'New member', 'patient')
  on conflict (id) do nothing;     -- exactly once; idempotent
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users for each row
  execute function public.handle_new_user();
```
- **Safe defaults:** `role = 'patient'`, `display_name = 'New member'` — a neutral,
  **non-identifying** placeholder. We deliberately do **not** seed the email
  local-part into `display_name` (it is authenticated-readable; that would leak
  PII). A real display name / role is set during onboarding.
- **Why a trigger, not client-side upsert:** atomic with auth-user creation, can't
  be raced, skipped, or forgotten by any client path, and needs no extra client
  privilege. Alternative (client upsert after sign-in) rejected as racy and
  bypassable. Consistent with the 1B SECURITY DEFINER convention.
- `on conflict do nothing` guarantees the "exactly once" invariant under retries.
- Regenerate `src/lib/database.types.ts` after the migration (adds the function;
  schema rows unchanged).

---

## 3. Magic-link flow (web-first)

Auth state lives in **`src/lib/auth.tsx`** (`AuthProvider` + `useAuth`): wraps
`supabase.auth.getSession()` + `onAuthStateChange`; exposes `{ session, user,
loading, signOut }`. Mounted in `app/_layout.tsx` inside `AppShell` so the crisis
affordance is present on auth/onboarding screens too.

- **`app/sign-in.tsx`** — email field + "Send me a magic link"
  (`supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })`), then a
  "Check your email" state with **Resend** (enabled after 30s). Wireframe B2/C2.
- **`app/auth/callback.tsx`** — web return route. `detectSessionInUrl` exchanges
  the link for a session; the route waits for the session then redirects to
  `/onboarding`. Errors render a plain retry message (no silent failure).
- **Sign out** — `supabase.auth.signOut()` (exposed via `useAuth`; a minimal
  control, e.g. on the consent/settings screen).
- **Routing:** logged-out `/` keeps the existing welcome; "Join free" → `/sign-in`.
  After callback → `/onboarding`. Onboarding continue/skip → `/`. No persistent
  "onboarded" flag this slice (deferred; not needed to satisfy scope).

**Deterministic sessions in tests:** Node DB tests use the **admin API** with the
test-only secret key — `admin.createUser({ email, email_confirm: true,
password })` (this INSERT into `auth.users` fires `handle_new_user`), then a
separate anon-key client `signInWithPassword` to obtain a real authenticated
session whose JWT `sub` = the user id. That exercises the real RLS-gated path
without scraping emails. (Password is a test convenience only; the product path
is magic-link.)

---

## 4. Onboarding flow (B3 / C3)

**`app/onboarding/index.tsx`** — a two-step stepper (single column, stacked),
rendered inside AppShell (crisis reachable).

- **Step 1 — role.** Radio group (accessibilityRole radio/radiogroup):
  "I have an arrhythmia" → `patient`; "I care for someone" → `caregiver`;
  "Both" → `patient` (see reconciliation); "I'm a healthcare professional…" →
  recorded but **role stays `patient`** pending the later verification slice
  (wireframe says "extra verification later"; the `professional` role will carry
  future broadcast privileges, so we do not grant it on self-declaration).
  `[ Continue ]` writes the chosen role to `profiles`; `[ Skip for now ]` writes
  nothing (role stays the `patient` default).
- **Step 2 — optional health self-ID.** A **separate consent checkbox**
  ("Yes, I want to add this and join relevant communities"), **UNCHECKED by
  default**, with the plain-language explanation (optional, private, only suggests
  communities, never sold/shared). Tag groups load from `self_id_tags`
  (seeded vocabulary) by `tag_type` (diagnosis / physical / emotional). Tags are
  only meaningful once consent is checked. `[ Save & continue ]` performs the
  GRANT (§5) **only if** the consent box is checked and ≥1 tag selected;
  `[ Skip — I'll just browse ]` and an unchecked Save write **nothing**.

Skip paths leave the member fully able to participate (profile exists from the
trigger; no consent, no tags).

---

## 5. Consent GRANT and WITHDRAW

Logic factored into **`src/lib/consent.ts`** as pure functions taking a Supabase
client, so the Node tests call the exact product code against the live DB.

- `CONSENT_POLICY_VERSION` constant (start `'v1'`, matching the 1B pgTAP
  convention; reconcile with the wireframe's "policy v2" / the published policy
  doc later).
- **GRANT** (`grantHealthSelfIdConsent(client, tagIds)`), through the gated path,
  in order:
  1. insert exactly one `consent_records` row `{ member_id = auth.uid(),
     purpose: 'health_self_id', policy_version, source: 'onboarding' }`
     (`granted_at` default now, `withdrawn_at` null).
  2. insert the selected `health_self_ids` `{ member_id, tag_id }` — now permitted
     because `has_current_health_consent` is true.
  Consent first, tags second (the RLS gate requires current consent to exist).
- **WITHDRAW** (`withdrawHealthSelfIdConsent(client)`): `update consent_records
  set withdrawn_at = now() where member_id = auth.uid() and
  purpose='health_self_id' and withdrawn_at is null`. The 1B
  `purge_self_id_on_consent_withdrawal` trigger deletes the member's
  `health_self_ids`. Proven end-to-end in tests.

**`app/settings/consent.tsx`** — minimal B14 surface: status (On/Off),
plain-language "what it's for / never sold / never shared", and
**"Turn off & remove my tags"** (calls WITHDRAW). Full B14 (consent history,
email-notif toggle, download/delete account) is out of scope. "Turn off" is as
easy as "turn on" — no dark pattern.

---

## 6. WCAG 2.2 AA plan (sign-in + onboarding + consent)

- Body ≥16–18px, line-height ≥1.5, Atkinson Hyperlegible/Inter, white bg,
  text ≥4.5:1, focus/UI ≥3:1 (Brand v2 tokens, as 1A/1B).
- Targets: primary actions ≥44px; all interactive ≥24px.
- Consent checkbox: `accessibilityRole="checkbox"`, `accessibilityState`
  reflecting **unchecked default**; radios `accessibilityRole="radio"` in a
  `radiogroup`; every control has a visible **text** label (never icon-only).
- Visible focus ring everywhere; focus moved to the step heading on step change;
  Focus Not Obscured.
- Email field: `keyboardType="email-address"`, `autoComplete="email"`
  (never `autocomplete=off`), paste/autofill allowed → **Accessible
  Authentication** (SC 3.3.8) satisfied by magic links.
- **Consistent Help:** 🆘 crisis affordance in the AppShell header on every new
  screen. **Redundant Entry:** email not re-requested after send.
- No autoplay/carousels/looping motion; `prefers-reduced-motion` honored.
- **No dark patterns:** Skip is presented as prominently as Continue; the consent
  explanation is persistent (no auto-dismiss); withdraw is one tap.

---

## 7. TDD test plan (Step 4 — write red, COMMIT failing, then green)

Node/DB tests (`testEnvironment: node`, real local Supabase, admin API for
sessions; no mocks). A second Jest project (or per-file env docblock) separates
these from the RNTL/jsdom tests; add `@supabase/supabase-js`; Node 18+ global
`fetch`.

1. **`tests/db/profile-creation.test.ts`** — `admin.createUser` ⇒ **exactly one**
   `profiles` row for that id, `role='patient'`, `display_name='New member'`
   (safe defaults). A second user gets its own single row.
2. **`tests/db/onboarding-skip.test.ts`** — authed session; skip path writes
   **no** `consent_records` and **no** `health_self_ids`; the member can still
   participate (e.g. read communities / insert a membership).
3. **`tests/db/consent-grant.test.ts`** — `grantHealthSelfIdConsent` writes
   **exactly one** current `consent_records` row (`purpose='health_self_id'`) +
   the selected `health_self_ids`.
4. **`tests/db/consent-withdraw.test.ts`** — grant, then
   `withdrawHealthSelfIdConsent` sets `withdrawn_at` and the 1B trigger purges
   **all** `health_self_ids` for that member (count 0, not readable at rest).
5. **`tests/screens/consent-screen.test.tsx`** (RNTL) — consent control is
   **unchecked by default** (`accessibilityState.checked === false`); plain
   language present; primary targets ≥44px; visible focus; no dismiss/dark-pattern
   on the consent explanation; Skip available and equally prominent.

Supporting (not required but cheap): sign-in render + a11y, onboarding role-step
render + a11y.

1A Jest + 1B pgTAP suites must stay green throughout.

---

## 8. Build order (Step 5)

1. Add deps; `src/lib/supabase.ts`; `.env.example` + `.env.test.example`;
   config.toml redirect URLs.
2. `handle_new_user` migration; `supabase db reset`; regenerate types.
3. Write the five red tests; confirm red; **commit the failing tests**.
4. `src/lib/auth.tsx`, `src/lib/consent.ts`; sign-in, callback, onboarding,
   consent screens; wire AuthProvider + routing in `_layout.tsx` (reuse AppShell).
5. Implement to green; re-run 1A Jest + 1B pgTAP.

## 9. Reviewer gates (Step 6)

- **privacy-reviewer** on auth/onboarding/consent: publishable key only (no secret
  in client); consent requested **before** any self-ID write; consent **unchecked**
  by default; self-ID never required to participate; ledger written/withdrawn
  correctly; nothing joins health self-ID to anything else.
- **a11y-reviewer** on sign-in, onboarding, consent screens.
- Resolve any FAIL before committing.

## 10. Verify / log / commit (Step 7)

- All five Step-4 tests green; 1A Jest + 1B pgTAP green; pre-commit guards pass.
- Manual web pass: request link → callback → onboarding → role → opt-in (writes
  consent+tags) OR skip (writes nothing) → withdraw (purges tags); 🆘 reachable
  throughout.
- Append to `docs/SESSION_LOG.md`; write `docs/adr/0004-auth-and-profile-creation.md`.
- Commit: `feat: Phase 1C — magic-link auth, profile creation, onboarding with
  opt-in health self-ID consent + withdrawal`. STOP (no Phase 1D).

---

## RESEARCH-SPEC RECONCILIATION (auth/onboarding inferences to revisit)

1. **"Both" role** — the 1B `user_role` enum has no `both`. Mapped to `patient`
   for this slice (caregiver communities are joinable via memberships regardless
   of role). A true dual-role model is a schema decision deferred to the spec.
2. **Self-declared "professional"** — recorded in UI but role stays `patient`;
   the `professional` role (future broadcast privileges) is granted only through
   the later verification slice ("extra verification later", wireframe B3).
3. **`display_name` default** = `'New member'` (neutral, non-PII). Spec may define
   a different default or collect a handle at onboarding.
4. **`policy_version`** = `'v1'` constant; reconcile with the published
   plain-language data-promise version (wireframe shows "policy v2").
5. **No persistent "onboarded" flag** this slice — callback always routes to
   onboarding; skip routes home. A completion flag can be added later if needed.
6. **Local redirect URLs** added to config.toml for Expo web dev; production
   redirect/allow-list config deferred (no research-spec dependency for local).
7. **Test sessions via password** (admin-created, email-confirmed users) are a
   test convenience only; the product auth path is magic-link / passwordless.

If an auth-provider config detail genuinely requires research spec §3 during
build, STOP and flag — do not invent.
