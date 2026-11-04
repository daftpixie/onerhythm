# Plan — public landing page + pre-launch updates list

Status: AWAITING APPROVAL
Date: 2026-08-06
Baseline: c334fe8 (Brand v3). rn 131/131 (19 suites), db 15/15, pgTAP 35/35,
typecheck clean, lint 1 pre-existing warning, six guard scripts green.

Status note (2026-10-28): references here to VT Infinite, Inc. as a public benefit
corporation (PBC) reflect what was believed when this was written. The PBC
conversion is drafted and has not been filed; see ADR 0007 as corrected on
2026-09-26. Left unchanged below as the historical record.

Scope: signed-out landing at `/`, an email-capture list for project updates,
OG/favicon/manifest wiring, and the four cheap v3 follow-ups. Out of scope and
not touched: donations/Stripe, moderation, governance, media uploads, auth,
consent, health self-ID, the privacy-rights UI, and deployment.

---

## THE HARD RULE — marketing data is not member data

`updates_subscribers` is an ordinary marketing contact list. A member's email is
bound to health self-ID through the consent ledger. The two must never be
correlatable **by this codebase**.

Enforced four ways, not by intention:

1. **No FK.** The table references nothing. pgTAP asserts zero foreign keys out
   of it (and specifically none to `profiles` / `auth.users`).
2. **No join path in product code.** A jest test scans `src/` + `app/` and fails
   if any single file mentions `updates_subscribers` alongside `profiles` or
   `auth.users`. Backed by a new pre-commit guard (#8) doing the same on staged
   files.
3. **No client read at all.** anon and authenticated get *zero* table privileges
   — not even INSERT. The only reachable surface is three `security definer`
   functions. Raw `select` as anon fails with 42501, proven in pgTAP.
4. **No dedupe across the boundary.** Nothing looks up whether a subscriber is
   also a member. The same address in both places stays two unrelated facts.

No view, function, or report correlates them. No health data and no diagnosis
language goes near the form or its copy.

---

## FIVE DECISIONS (recommendations)

### (a) Email storage — recommend the local Supabase table

Own table `public.updates_subscribers`, not an external list service.

Why: it stays under the same RLS/grant discipline as everything else; it adds
**no subprocessor** (Amendment 1 §8.x requires a review gate before any new
one, and adding Mailchimp/Buttondown to a pre-launch project means a new
processor holding health-adjacent-by-context addresses); and it matches the
open-books posture — the schema is in the repo and auditable.

Honest cost: we own deliverability, the confirmation send, the unsubscribe
flow, and bounce handling. An external service would give all of that for free.
That cost is acceptable *because the list is not being mailed yet* (see (b)).

Columns (divergences from the prompt noted):

| column | type | note |
|---|---|---|
| `id` | uuid pk default gen_random_uuid() | |
| `email` | `text` not null | **not citext** — normalized to `lower(btrim())` in the RPC, unique index on the column. Avoids depending on the citext extension and the `search_path=''` awkwardness it brings. Same guarantee, one less dependency. |
| `created_at` | timestamptz not null default now() | |
| `source` | text not null default 'landing' | which surface the address came from |
| `confirmed_at` | timestamptz null | null = **not subscribed** |
| `unsubscribed_at` | timestamptz null | |
| `confirm_token` | text null | 32 random bytes hex, server-generated, nulled on confirm |
| `unsubscribe_token` | text not null | 32 random bytes hex, server-generated, never rotated |

CHECK: email length ≤ 254 and a deliberately loose format check (`~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'`).

**Access design — tighter than the prompt asked for.** The prompt says "anon may
INSERT only." I recommend going one step further: anon gets **no table grant at
all**, and instead `execute` on three `security definer` functions with
`search_path = ''`:

- `public.subscribe_to_updates(p_email text, p_source text)` → void.
  Normalizes, `insert ... on conflict (email) do nothing`, generates both
  tokens. Returns void **always**.
- `public.confirm_updates_subscription(p_token text)` → void. Sets
  `confirmed_at = now()` where the token matches and it is still null; nulls the
  confirm token. Idempotent, returns void always.
- `public.unsubscribe_from_updates(p_token text)` → void. Sets
  `unsubscribed_at = now()` where the token matches and it is still null.
  Idempotent, returns void always.

Why tighter is better here: a direct anon INSERT against a table with a unique
index leaks membership. The API returns `23505` for an address already on the
list and `201` for a new one — that is an **email enumeration oracle** reachable
by anyone with curl, regardless of what the UI shows. `on conflict do nothing`
inside a definer function removes the oracle entirely, keeps the tokens
server-generated (never client-supplied), and gives us one place to add rate
limiting later. RLS stays enabled with **zero policies** — the table is
unreachable except through those three functions.

`authenticated` is explicitly REVOKEd. This matters: migration
20260708051747 pinned `ALTER DEFAULT PRIVILEGES` so new tables hand
`authenticated` + `service_role` DML automatically. Without an explicit revoke,
every signed-in member could read the whole marketing list. `service_role`
keeps DML (backend-only; needed to eventually send mail and to let db tests
assert row state).

### (b) Double opt-in — recommend YES, structurally, with the send deferred

Double opt-in is right: it proves consent, protects deliverability, and stops
someone signing another person up. Recommend it.

But there is a dependency worth naming rather than discovering later: **we
cannot send the confirmation email in this session.** There is no SMTP provider
configured (it is on the launch-gate list from Phase 1E), the local stack runs
with `-x edge-runtime` so Edge Functions are not even runnable here, and picking
a mail provider is exactly the subprocessor decision Amendment 1 §8.x gates.
Using Supabase Auth to send it is not an option — that would create
`auth.users` rows for marketing contacts, which is the coupling this whole
session exists to prevent.

So the recommendation is: **build double opt-in as the data contract now, wire
the send at the SMTP gate.**

- Rows land unconfirmed. `confirmed_at is null` means *not subscribed*, pinned
  by test. Nobody can ever be mailed without having confirmed.
- `/updates/confirm?token=…` works from day one.
- The success copy tells the exact truth and does not claim an email was sent:
  > Thanks — we've saved your address. Nothing is sent yet. When updates
  > start, we'll email you once to check it's really you, and you'll only be
  > on the list after you say yes.

The alternative (single opt-in now, upgrade later) is cheaper by one route and
worse: the addresses collected before the upgrade would have no consent proof
and would need a re-permission campaign.

### (c) Signed-in behaviour at `/` — recommend confirming what already ships

Signed-out sees the landing; signed-in redirects to `/feed`. This is already the
behaviour in `app/index.tsx:13`. Recommend keeping it and pinning it with a
test, since the landing rewrite touches that file.

### (d) Where the meta tags live — **NOT `app/+html.tsx`** (verified)

The prompt proposed `app/+html.tsx`. I checked the installed toolchain before
planning around it, and it would not work:

- This project uses the default web output (`single` — no `web.output` key in
  `app.json`). On that path `@expo/cli`'s `exportApp.js` builds `index.html`
  from `createTemplateHtmlFromExpoConfigAsync`, which reads
  **`public/index.html`** if present and otherwise the stock template
  (`start/server/webTemplate.js:68`).
- `app/+html.tsx` is consumed only by `exportStaticAsync`, i.e. `web.output:
  "static" | "server"`. `expo-router` merely *excludes* `+html` from the route
  tree (`getRoutesCore.js:102`). Shipping tags in `+html.tsx` today would export
  an `index.html` that does not contain a single one of them.

**Recommend: `public/index.html`.**

- Copy the head block from `assets/brand/README.md` **verbatim**, absolute URLs
  and all (`https://onerhythm.org/…`). Relative `og:image` is ignored by most
  scrapers, which is why the README says so.
- Assets must be served from web root. Expo copies `public/` to the export root
  (`export/publicFolder.js`, `env.EXPO_PUBLIC_FOLDER` default `public`), so:
  `public/favicon.ico`, `public/icons/*`, `public/social/*`,
  `public/site.webmanifest`.
- Rather than hand-duplicating binaries, add `scripts/sync-brand-public.js` +
  `npm run sync:brand`, copying the needed files from `assets/brand/` →
  `public/`. `assets/brand/svg/1r-mark.svg` stays the single source of truth, in
  keeping with that README's "regenerate rather than edit" rule. The copies are
  committed (so a clean checkout exports correctly); the script makes drift
  fixable in one command, and a unit test fails if a copy drifts from its source.
- Domain: `https://onerhythm.org/` unless told otherwise.
- Watch for a duplicate icon link: `export/favicon.js` injects one from
  `app.json`'s `web.favicon`. Verify the exported HTML; if it conflicts with our
  explicit links, drop `web.favicon` from `app.json`.
- Test: a jest unit test parses `public/index.html` and asserts each required
  tag is present, that every `og:image`/`twitter:image`/`og:url` value is
  absolute (`^https://`), and that no third-party script/pixel host appears.

Deferred, recorded in the ADR: per-route OG tags (a shared shell can only carry
one set) need `web.output: "static"` plus `expo-router/head`. That is a routing
change, not a landing-page change, and is not worth it for one public page.

### (e) Privacy notice — recommend a short standalone `/privacy-notice`

A marketing-list-only notice: what is collected (an email address, nothing
else), why, who it is shared with (nobody — never sold, never shared), how to
unsubscribe, retention, and how to ask for deletion. Plain language, ~8th grade,
§9 voice.

It carries a **prominent, unambiguous** line stating that it covers the updates
list only, that OneRhythm is not open to members yet, and that the member
privacy policies — the standalone Consumer Health Data Privacy Policy (MHMDA),
the ToS, and the consumer-health-data notice — are still pending and are
**build-blocking on attorney review** (CLAUDE.md #7). **This notice does not
substitute for that review and does not unblock it.** That sentence goes in the
page, in the ADR, and in the session log.

Also add `docs/privacy/marketing-list-inventory.md`: the field-level purpose
binding + retention for this one table, plus the subprocessor position (no new
subprocessor added; Supabase and Cloudflare already hold this data class). It is
explicitly scoped to this table — a full platform data inventory is a separate
job and is not silently started here.

Retention, stated honestly: we keep an address until the person unsubscribes or
asks us to delete it. **We do not promise an automatic purge of unconfirmed
addresses**, because no scheduled job exists to do it; adding one (pg_cron) is
recorded as an ADR follow-up rather than written as a promise we do not keep.

---

## Copy outline (§9 voice — plain, warm, no hype)

Footer, disclaimer band, and the 🆘 affordance are already global via
`AppShell`; the landing adds its own footer row per wireframe B1.

1. **Hero** — `<Wordmark size={44} />`, then:
   - H1: "You are not alone with your heart."
   - One plain sentence: "A community for people living with arrhythmia — and
     the people who care for them."
   - Honest status line: not open yet; here is what it is and how to hear when
     it opens.
   - The email form (label above the field, 44px submit, "Keep me posted").
   - "We'll only email you about the project. We never sell or share your
     address. [Privacy notice] · [Unsubscribe any time]"
2. **What this is / What this is NOT** — B1's two columns, both honest, kept
   from the current page (adds "Not a place for diagnosis or ECG reading").
3. **Why it exists** — the psychological burden, carefully framed and sourced
   to PRD §1: "studies put clinical anxiety in this group at around 88%, and
   report that as many as one in five people with symptoms has had thoughts of
   suicide." Framed as *why a community should exist*, never as a claim about
   the reader, never diagnostic, never alarmist. Followed immediately by the
   crisis line: if you're in crisis right now, 🆘 Need help right now? is at the
   top of every page, and in an emergency call your local emergency number.
4. **Built by a patient** — two sentences, first person, no heroics. "I have
   ARVC and an implanted defibrillator. I'm building the thing I couldn't find."
5. **Open books** — a real link to `/transparency`, with one line on what is
   there (every cost, every month, contributor counts and never names) and the
   plain fact that contributions are not tax-deductible (VT Infinite, Inc. is a
   Delaware PBC, not a 501(c)(3)).
6. **What we will never do** — no ads, no selling or sharing your data, no
   paywalls, no pay-for-power in governance, no medical advice, no storing
   clinical records.
7. **Footer** — About · Privacy notice · Open source · 🆘 Help · "A VT Infinite
   company." Plus: "Not medical advice. In an emergency, call your local
   emergency number."

Vocabulary check: "member support" / "contributions", never "donations"; no
grandiosity; anchor phrases used at most once and only where sincere.

---

## Routes and components

| path | what |
|---|---|
| `app/index.tsx` | rewritten landing (signed-in → `/feed` unchanged) |
| `app/updates/confirm.tsx` | `?token=` → confirm, plain success/neutral state |
| `app/updates/unsubscribe.tsx` | `?token=` → unsubscribe, idempotent |
| `app/privacy-notice.tsx` | marketing-list notice |
| `src/components/UpdatesSignupForm.tsx` | label, error text, live region, 44px |
| `src/components/LandingSection.tsx` | §5 section rhythm + reading-measure cap |
| `src/lib/updates/subscribe.ts` | the three RPC wrappers, anon client only |
| `supabase/migrations/<ts>_updates_subscribers.sql` | table + RLS + grants + fns |
| `public/index.html` + `public/{icons,social,site.webmanifest,favicon.ico}` | meta/assets |
| `scripts/sync-brand-public.js` | assets/brand → public |
| `.claude/hooks/no-marketing-member-join.sh` | guard #8 |

Deep links (`/updates/confirm?token=…`) need an SPA fallback at the host.
Cloudflare Pages needs `public/_redirects` with `/* /index.html 200`. Added as a
file; **not deployed** this session.

---

## TDD list (red checkpoint first, then green without modifying)

pgTAP — new suite `04_marketing_member_separation_test.sql` (35 → ~43):
1. RLS is enabled on `updates_subscribers`.
2. It has **zero** RLS policies.
3. anon has no table privilege; raw `select` as anon raises 42501.
4. authenticated likewise raises 42501.
5. Zero foreign-key constraints on the table (so none to `profiles`/`auth.users`).
6. Unique index on `email` exists.
7. The three functions are `security definer` with `search_path = ''`.
8. anon holds `execute` on exactly those three functions.

jest `db` (service_role reads state; touches no member table):
9. Happy path writes exactly one row; email stored lowercased/trimmed; every
   other column is a default or a token — no other field is captured.
10. Duplicate email: RPC succeeds (no error surfaced), row count stays 1,
    `created_at` unchanged.
11. New rows have `confirmed_at is null` — "unconfirmed is not subscribed",
    asserted as a query over the table, not a UI claim.
12. Confirm by token sets `confirmed_at`; calling twice is idempotent; a bogus
    token changes nothing and does not error.
13. Unsubscribe by token sets `unsubscribed_at`; idempotent; bogus token is a
    no-op.
14. anon cannot SELECT: a raw PostgREST request with the anon key returns an
    error, not rows (the enumeration guard, at the wire).

jest `rn`:
15. `no-join-path.test.ts`: no file under `src/`/`app/` mentions
    `updates_subscribers` together with `profiles` or `auth.users`.
16. `meta-tags.test.ts`: `public/index.html` carries every required tag; all
    image/url values absolute; no third-party host.
17. `brand-public-sync.test.ts`: each `public/` brand copy is byte-identical to
    its `assets/brand/` source.
18. Landing renders: heading, the `/transparency` link, the crisis affordance,
    "not tax-deductible", zero "donation" occurrences.
19. Signed-in → redirects to `/feed`; signed-out → renders the landing.
20. Form a11y: visible `<label>` above the input; error identified **in words**
    (not colour alone); submit ≥44px; focus ring present; success announced via
    a polite live region; keyboard path works.
21. Confirm + unsubscribe screens render plain-language states for
    success / already-done / bad-token, with no jargon and no error colour alone.

Red checkpoint: commit the failing suites first (same pattern as 1D/1T/1E —
temporarily excluded from the pre-commit jest run, exclusion removed by the
implementation commit so the diff proves the tests were untouched).

---

## a11y plan (WCAG 2.2 AA — build-blocking)

- Body ≥16px, hero copy 18px, line-height ≥1.5, Atkinson everywhere.
- **Reading measure cap (follow-up #5):** landing content capped at `maxWidth:
  720` and centred, so ≥1200px viewports stop producing the ~80–90ch lines
  measured in the v3 session. Reported at 1440/900/380.
- One primary action (the email submit). Secondary/quiet buttons per §7.
- Input: label above the field, never placeholder-as-label; `Ink 4%` fill, 1px
  Ink border, 8px radius; error = icon **+** words below the field.
- Submit 44×44 minimum; every link ≥24px target.
- Focus ring 2px Ink / 2px offset, never removed (web; the known native
  focus-ring gap is launch-gate class and out of scope here).
- Success is announced (`accessibilityLiveRegion="polite"` + `role="status"`),
  not conveyed by colour or position alone.
- Headings in order; the two-column block does not reorder under a screen
  reader; columns wrap to one at 380px.
- No autoplay, no carousel, no ambient motion; `prefers-reduced-motion` honored
  by the existing hook.
- 🆘 reachable (global `AppShell`) **and** in the footer per B1.
- Gate: `a11y-reviewer` charged to falsify, before commit.

---

## The four v3 follow-ups closed here

1. **#3** — hero uses `<Wordmark />` instead of hand-rolling the mark
   (`app/index.tsx:23-26` currently duplicates the lockup, and does it with
   both halves in Ink — the accent is missing).
2. **#5** — reading-measure cap at ≥1200px (above).
3. **#4** — remove the Inter font load. Verified unused: no `Inter_` reference
   in `src/`/`app/` outside `useFonts.ts`. Removes the `useInter` hook, the
   `@expo-google-fonts/inter` dependency, `tailwind.config.js:18-20`, and
   `global.css:20`. Note: `tailwind.config.js` / `global.css` are the NativeWind
   surface ADR 0010 marked superseded-in-part (zero classNames in the tree), so
   this is dead config either way.
4. **#6** — four stale `Brand v2 §` comment pointers → v3:
   `RunwayMeter.tsx:11`, `UpbeatButton.tsx:15`, `JourneyEntryView.tsx:20,178`
   (plus the matching test title in `JourneyEntryView.test.tsx:43`, a title-only
   edit).

Not here, as instructed: the UpbeatButton textual state carrier (needs a
sanctioned test amendment) and native focus rings (launch-gate class).

---

## Reviewer gates

- **privacy-reviewer**, charged to FALSIFY: *"marketing data and member data
  cannot be correlated by this codebase."* Hunt for FK, join, view, function,
  shared query path, dedupe logic, or anon read. Plus: no health data on the
  form, no health language in the copy, no third-party tags on the page, grants
  minimal per ADR 0005.
- **a11y-reviewer**, charged to FALSIFY that the form meets 2.2 AA.
- Any FAIL is resolved before committing.

## Verification and close

Full green (rn + db + pgTAP + the new suites), typecheck, lint, all guards
(seven checks, now eight with #8). Manual pass at 1440/900/380 with measured
line lengths; submit → confirm → unsubscribe end to end; anon SELECT denied at
the DB; 🆘 reachable; `/transparency` link works; `npx expo export -p web` and
grep the emitted `index.html` for the absolute-URL OG tags. Then
`docs/adr/0011-landing-and-updates-list.md`, the session log, and one commit.
**No deploy.**

## Known gaps recorded, not hidden

- No rate limiting on `subscribe_to_updates` — an attacker can stuff the table
  with junk addresses. No enumeration risk (the function is silent), but a spam
  risk. ADR follow-up: a per-IP limit needs an Edge Function or Cloudflare rule,
  neither of which exists yet.
- No automatic purge of unconfirmed rows (no scheduler). Stated honestly in the
  notice rather than promised.
- No confirmation email is actually sent until the SMTP launch gate.
- The marketing privacy notice does **not** satisfy the build-blocking member
  privacy/attorney review.
