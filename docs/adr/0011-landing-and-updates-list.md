# ADR 0011 — The public landing page and the pre-launch updates list

Status: Accepted
Date: 2026-08-06
Relates: ADR 0005 (grants), ADR 0007 (entity/vocabulary), ADR 0008
(transparency), ADR 0010 (Brand v3); PRD Amendment 1 §8.x; wireframe B1;
`.claude/rules/privacy.md`; migration `20260806134500_updates_subscribers.sql`.

## Context

The platform is not publicly launched — attorney review is build-blocking
(CLAUDE.md #7). A landing page can ship before that: it tells the story,
captures interest, and gives the fundraising conversation a real URL. Capturing
interest means collecting email addresses, and that is where the care is
needed.

## The binding invariant: marketing data is not member data

A member's email is bound to opt-in health self-ID through the consent ledger,
which makes it consumer health data under Washington MHMDA and special-category
data under GDPR. An address on the updates list belongs to someone who asked to
hear about a project — an ordinary marketing contact.

**Joining them would manufacture a health-adjacent record that neither person
consented to.** So the two are separate systems of record, permanently, and the
separation is mechanical rather than aspirational:

1. **No foreign key.** `updates_subscribers` references nothing, and nothing
   references it. pgTAP suite 04 asserts both directions are zero.
2. **No join path in product code.** No file under `src/` or `app/` may name
   the list and a member table. Enforced by
   `tests/unit/no-join-path.test.ts` over the whole tree and by **guard #8**
   (`.claude/hooks/no-marketing-member-join.sh`) over staged files. The one
   exemption is `src/lib/database.types.ts`, which is generated and declares
   every table; a type declaration cannot execute a query.
3. **No client read at all.** `anon` and `authenticated` hold zero privileges
   on the table. Proven at the wire — a raw `select` as either role raises
   42501, in pgTAP and again over PostgREST in `tests/db/updates-list.test.ts`.
4. **No dedupe across the boundary.** Nothing looks up whether a subscriber is
   also a member. The same address in both places stays two unrelated facts.

The functions also never read `auth.uid()`, a JWT claim, an IP, or a user
agent, so a signed-in member who confirms their own subscription leaves no
trace linking the two identities. pgTAP asserts this against the shipped
`pg_proc.prosrc`, not against the source tree — a definer function is the one
place a join could hide from a source-level guard, because it runs as owner and
bypasses RLS.

## The five decisions

### (a) Storage: a local table, with tighter access than first specified

A Supabase table, not an external list service: same RLS/grant discipline, **no
new subprocessor** (Amendment 1 §8.x gates that), and a schema in the repo that
can be audited. The honest cost is that we own deliverability, sending, and
bounce handling — acceptable only because the list is not being mailed yet.

The approved brief said "anon may INSERT only." **That was wrong, and the
founder accepted the correction.** With a direct INSERT grant and a unique index
on `email`, PostgREST answers `23505` for an address already on the list and
`201` for a new one. That is an **email-enumeration oracle** reachable by anyone
with curl, no matter what the UI displays. So anon gets no table grant at all,
and the entire public surface is three `security definer` functions with
`search_path = ''`:

- `subscribe_to_updates` — `on conflict (email) do nothing`, returns **void
  always**, so a duplicate is indistinguishable from a new address. Tokens are
  generated server-side and never accepted from a client.
- `confirm_updates_subscription` / `unsubscribe_from_updates` — these *do*
  return a status, deliberately. Their caller already holds a 256-bit token
  that was mailed to the address in question, so the answer reveals nothing
  they did not already know; and the alternative is a page that cannot tell
  someone whether their unsubscribe worked.

RLS is enabled with **zero policies**. With no grant and no policy the table is
unreachable except through those functions.

Two smaller divergences: `text` plus normalize-in-RPC rather than `citext` (one
fewer extension dependency, same case-insensitive guarantee), and two separate
tokens rather than one.

### The `authenticated` revoke, and the standing rule it creates

ADR 0005 pinned `ALTER DEFAULT PRIVILEGES` for role `postgres` in schema
`public`. Verified against the current image:

```
postgres | public | r | {postgres=arwdDxtm/postgres,
                         authenticated=arwd/postgres,
                         service_role=arwd/postgres}
postgres | public | f | {postgres=X/postgres}
```

**Every new table in `public` is handed full DML to `authenticated`
automatically.** ADR 0005 was right to pin those defaults — it stopped anon
drift — but the consequence for `authenticated` is that a new table is *open by
default* and must be closed on purpose. Without the explicit
`revoke all ... from anon, authenticated, public` in this migration, every
signed-in member could have read and edited the entire marketing list from the
day it shipped.

> **Standing rule, added to ADR 0005's list.** Any new table holding data that
> members must not read has to write that revoke explicitly, in the migration
> that creates it, and prove it with a test. The pinned defaults protect
> against anon, not against members. Functions are the mirror image: the
> pinned `f` default grants EXECUTE to `postgres` only, so a new function is
> *closed* by default and its grants must be written to make it callable.

### (b) Double opt-in — structurally, with the send blocked

Double opt-in is right: it proves consent, protects deliverability, and stops
someone signing up an address they don't own. But **the confirmation email
cannot be sent yet**: there is no SMTP provider (a Phase 1E launch gate), the
local stack runs with `-x edge-runtime`, and choosing a mail provider *is* the
subprocessor decision Amendment 1 §8.x gates. Supabase Auth is not a
workaround — it would create `auth.users` rows for marketing contacts, the
exact coupling this ADR exists to prevent.

So the data contract ships now and the send is wired at the SMTP gate:
`confirmed_at is null` means **not subscribed**, pinned by test; nothing may
ever be mailed to such a row; `/updates/confirm` works from day one.

The success copy says so plainly, and is pinned by a test that forbids the
words "check your inbox": *"Nothing is sent yet: we haven't set up our mail
system, so no email has gone out and none is on its way."*

`confirm_token` is deliberately **not** cleared on confirm, so a second click on
the same link can honestly say "you're already on the list" rather than "that
link isn't valid". It confers no capability beyond re-confirming a confirmed
row.

### (c) Signed-in behaviour at `/`

Unchanged and now pinned by test: signed-out sees the landing, signed-in
redirects to `/feed`, and neither happens while the session is still loading.

### (d) Meta tags live in `public/index.html`, **not** `app/+html.tsx`

The brief proposed `app/+html.tsx`. Checked against the installed toolchain
before planning around it, and it would have shipped into nothing:

- This project uses the default web output (`single`). On that path
  `@expo/cli`'s `exportApp.js` builds `index.html` via
  `createTemplateHtmlFromExpoConfigAsync`, which reads **`public/index.html`**
  if present and otherwise the stock template
  (`start/server/webTemplate.js:68`).
- `app/+html.tsx` is consumed only by `exportStaticAsync` — `web.output`
  `"static"` or `"server"`. `expo-router` merely excludes `+html` from the
  route tree (`getRoutesCore.js:102`).

So the head block from `assets/brand/README.md` goes in `public/index.html`
verbatim, with absolute `https://onerhythm.org/` URLs (a relative `og:image` is
ignored by most scrapers). Brand assets are mirrored into `public/` by
`scripts/sync-brand-public.js` from a manifest, with
`assets/brand/svg/1r-mark.svg` remaining the source of truth; a test fails the
build if a copy drifts from its source. `public/_redirects` carries the
Cloudflare Pages SPA fallback, without which a pasted
`/updates/unsubscribe?token=…` would 404 at the edge before the app loaded.

**Deferred:** per-route OG tags need `web.output: "static"` plus
`expo-router/head`. That is a routing change, not a landing-page change.

### (e) A marketing-only privacy notice

`/privacy-notice` covers the updates list **only**, and says so in a callout at
the top. It states what is collected (an email address), why, who else sees it
(nobody), how to leave, and how to be deleted.

**It does not satisfy, substitute for, or unblock the build-blocking attorney
review.** The standalone Consumer Health Data Privacy Policy (MHMDA), the ToS,
and the member privacy policy remain pending, and the page says so.

Retention is stated honestly: an address is kept until the person unsubscribes
or asks for deletion. There is **no promise of an automatic purge of
unconfirmed rows**, because no scheduler exists to perform one. Field-level
purpose binding is in `docs/privacy/marketing-list-inventory.md`, scoped to
this one table — the platform-wide inventory §8.x requires is a separate job
and is not silently started here.

## Founder-visibility mirror: Google Sheet (added during this session)

The updates list is mirrored to a private Google Sheet on the founder's
Workspace, as a **local, on-demand script** (`npm run sync:subscribers`), not
infrastructure — there is no hosted Supabase project and no edge runtime yet.

Binding rules:

1. **Full-refresh overwrite of a single tab, never append.** This is the rule
   that keeps the mirror from breaking deletion rights. An append-only mirror
   becomes an undeletable shadow copy: a row deleted or unsubscribed in the
   database would live on in the sheet forever, and the unsubscribe that
   CAN-SPAM requires would be undone by the next sync. Overwriting means
   deletions and unsubscribes propagate on the next run, and the database stays
   the only system of record.
2. **One-way, database → sheet.** Nothing ever syncs back.
3. **Marketing fields only** — email, created_at, confirmed status,
   unsubscribed status. A test asserts the export cannot include a member or
   profile field: the no-correlation invariant extends to the mirror.
4. **Credentials are a service-account JSON at a gitignored path referenced by
   env**, server/local only, never in the client bundle and never in an
   `EXPO_PUBLIC_*` variable.
5. Google Workspace is recorded as a subprocessor in
   `docs/privacy/marketing-list-inventory.md`, purpose "founder visibility".
   **The sheet must not be link-shared publicly.**

## Reviewer gates

**privacy-reviewer: PASS.** Charged to falsify *"marketing data and member data
cannot be correlated by this codebase"* — and could not. It attempted FK in
both directions, join paths across the whole repo (not just `src/`), the
shipped function bodies via `pg_proc.prosrc`, table and function grants at the
wire, hidden export paths, and whether `source` could be abused as a covert
free-text channel (it cannot; the value is allow-listed). Two advisories, both
recorded: this ADR was missing at review time (now written), and the note below
on consent-ledger scope.

> **Scope note for future reviewers.** `.claude/rules/privacy.md` says consent
> is a versioned ledger, not a checkbox state. That rule is scoped to
> **health-adjacent consent** — the `consent_records` ledger for self-ID tags.
> The two timestamps here (`confirmed_at`, `unsubscribed_at`) are ordinary
> marketing double opt-in under CAN-SPAM. Keeping this table's shape
> deliberately *unlike* `consent_records` is part of the point: it must never
> be mistaken for, or merged with, the health-consent ledger.

**a11y-reviewer: FAIL on the first pass, and it was right.** Charged to falsify
that the form meets WCAG 2.2 AA, it succeeded, with five blocking findings.
All five were fixed and re-verified:

- **Live regions are Android-only.** `accessibilityLiveRegion` and `aria-live`
  are `@platform android` in this React Native version, and `role="alert"` /
  `role="status"` do not make VoiceOver speak. An iOS screen-reader user would
  have submitted the form and heard **nothing**. Fixed with explicit
  `AccessibilityInfo.announceForAccessibility` on every outcome, in the form
  and both token screens; the props stay for web and Android.
- **The success message re-mounted a new subtree** instead of updating a
  persistent region — a region that appears at the same moment as its content
  may never be announced. Now one region is mounted from first render and only
  its text changes.
- **The invalid field state was never exposed.** Now `aria-invalid` +
  `aria-describedby` on web, and the error folded into `accessibilityHint` for
  native, because there is no native `describedby` and RN's
  `AccessibilityState` has no `invalid` key.
- **`CrisisHelpSheet` set no `fontFamily` at all** — the highest-stakes text in
  the app was rendering in the platform default rather than Atkinson
  Hyperlegible, and was invisible to CI because `tests/unit/typeface.test.tsx`
  did not include it. Pre-existing, not introduced here. Fixed, and the
  component added to that suite so it cannot regress silently again.
- **Heading hierarchy was flat**, and the `Wordmark` lockup claimed
  `accessibilityRole="header"` — putting an unlevelled "OneRhythm" heading in
  every screen's heading list, twice on any page that also shows it in a hero.
  The lockup is now `"image"`, matching its own `markOnly` branch. Levels are
  carried by `aria-level`.

> **Recorded gap.** React Native's `TextProps` has no `accessibilityLevel`, so
> heading levels are **web-only**. `aria-level` reaches the DOM through
> react-native-web's `createDOMProps` and is correct there; it typechecks only
> because TypeScript skips excess-property checking on *hyphenated* JSX
> attributes — verified with a control (`totally-made-up-attr` passes,
> `totallyMadeUpAttr` errors), so it is unchecked rather than declared. Same
> class of web-only gap as the native focus rings in ADR 0010, and it belongs
> with them on the launch gates.

### The re-review, and what a second pass found

The a11y reviewer was asked to re-verify its own five findings as adversarially
as it found them. Three were confirmed resolved; two were not, and both
corrections were real:

- **The `Wordmark` fix was half a fix.** Setting `accessibilityRole="image"`
  without `accessible` and an explicit label would have traded a
  mislabelled-but-readable heading for a correctly-classified but **silent**
  image, on every screen — `image` is not a name-from-content role, so the
  visible "OneRhythm" text inside it does not name it. Strictly worse than the
  bug being fixed. The lockup now carries `accessible` +
  `accessibilityLabel="OneRhythm"`, mirroring its own `markOnly` branch.
- **Adding `CrisisHelpSheet` to the typeface suite did not actually pin it**,
  and chasing that down found the guard had been weaker than its own title for
  every component it covered:
  1. A `<Modal>` renders nothing while closed, so the case never saw five of
     the six styles. Fixed by opening the sheet.
  2. `tree.root.findAll` does not reach a Modal's children at all — they are
     rendered outside the component's own root subtree. Measured: `root`
     reaches 6 nodes and 2 Texts, `UNSAFE_root` reaches 38 and 9.
  3. **The real hole:** the helper collected only nodes that *declared* a
     `fontFamily` and silently skipped the rest, so it asserted "every family
     found is Atkinson" while a component declaring none anywhere passed
     trivially. That is exactly how the crisis copy went unnoticed.

  The suite now resolves inherited families up the `<Text>` chain and fails on
  any text node left in the platform default face. Proven by removing one
  `fontFamily` and by swapping one to Inter, each of which now fails.

  That strengthened check immediately found a second defect in a component
  already "covered": **`DisclaimerBand`'s body — the "General information, not
  medical advice" sentence itself — had no `fontFamily`**, so the disclaimer on
  every health page was rendering in the platform default while only the word
  "Disclaimer" above it was in Atkinson.

The lesson is the same one ADR 0010 recorded about `contrast.test.ts`: a guard
that can only see what components *declare* cannot see what they *omit*, and an
omission is the more likely defect.

## The reading measure, measured

Brand v3 follow-up #5 asked for a reading cap. The first attempt used
`maxWidth: 720`, and the a11y review passed it as "roughly 65–75 characters".
Measuring it properly — `fontTools` over `AtkinsonHyperlegible_400Regular.ttf`,
averaged across the page's actual prose — gives **8.05px per character at
18px**, so a 672px column is **83.5 characters**, outside the 45–75 band.

The cap is now **620** (a 572px column, ~71 characters), applied to the landing
page and the three other prose pages. Recorded because the estimate and the
measurement disagreed by a lot, and the estimate was the one that felt fine.

## Consequences

- A public front door exists that can ship before launch, and an updates list
  that cannot be correlated with member data by construction.
- Seven guard scripts now carry **eight checks** (`secrets-pii-scan.sh` still
  implements two; guard #8 is new).
- pgTAP goes 35 → 47 assertions across five suites; jest goes 146 → 252.
- Nothing is mailed to anyone until the SMTP gate, and no member privacy
  surface is unblocked by any of this.

## Known gaps, recorded rather than hidden

- **No rate limiting** on `subscribe_to_updates`. No enumeration risk, but the
  table can be stuffed with junk addresses. A per-IP limit needs an Edge
  Function or a Cloudflare rule; neither exists yet.
- **No automatic purge** of unconfirmed rows (no scheduler). Stated honestly on
  the notice rather than promised.
- **No confirmation email is sent** until the SMTP launch gate.
- **Heading levels and focus rings are web-only** on native.
- The marketing privacy notice **does not** satisfy the build-blocking member
  privacy/attorney review.
