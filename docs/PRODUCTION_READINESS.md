# Production readiness — the go-live checklist

> **16 November 2026 review:** see
> [PUBLIC_SOURCE_READINESS.md](PUBLIC_SOURCE_READINESS.md) for the current
> repository, dependency, CI and live-landing observations. The detailed rows
> below preserve the 3 November working checklist and refer to PR numbers in
> the private development archive; they are not current deployment evidence.
> The new release repository and `v0.1.0` exist, and the public landing responds,
> but the repository is still private. Member launch remains blocked. No live
> hosted database or processor contract was inspected in this review.

Two tiers, because they carry very different risk.

**Tier 1 — the landing page.** A marketing site. No member accounts, no health
data, nothing clinical. **Since 3 November 2026 the public build is
landing-only, with the email sign-up off** (ADR 0023): it shows four pages,
redirects everything else to `/`, never connects to Supabase, and has no form.
The sign-up rows below (1.4–1.11, 1.19) are needed only when sign-up returns.
**Confirm the legal and privacy review needed before Tier 1 release.**

**Tier 2 — the member platform.** Accounts, posts, journey pages, health self-ID
tags. This is where the regulated surface begins, and **attorney review is
build-blocking** (CLAUDE.md non-negotiable #7).

**Refreshed 3 November 2026.** The repository is private, with PRs #1–#12
merged; the landing build and Railway config are in PR #13. The founder's
earlier Railway deployment and DNS were not visible to this review. Recheck
every hosting and launch item before release.
This is the list of what stands between code and a live site, with original
session observations preserved where marked. "Code" means it is finished in
the repo;
"human" means somebody has to create an account, obtain a key, or make a call.

---

## Tier 1 — landing page live

| # | Item | Kind | Blocks | Status |
|---|---|---|---|---|
| 1.1 | GitHub repo + public-source decision | human | source publication | **private**; going public is planned, as a new repository that starts from one release commit under Apache-2.0 (ADR 0024). Full-history secrets scan **clean** (2026-11-03). Steps: `docs/RELEASE_FRESH_HISTORY.md` |
| 1.2 | CI running on push/PR | code | merge confidence | **green on `main`** (2026-10-30), all jobs. PR #13 adds a third job, `landing` |
| 1.3 | Branch protection on `main` | human | protected-main rule in `.claude/rules/git.md` | **not set** as far as known; step 6 of `docs/RELEASE_FRESH_HISTORY.md`, on the new public repository |
| 1.4 | Hosted Supabase project | human | all data | **not done** — the project exists but holds a stray `consent_records` table (checked 2026-10-29; see below) |
| 1.5 | `supabase link` + `db push` all migrations | human | all data | **not done** — 11 migrations to apply once PR #11 merges; **first drop the stray table or reset the project** (below) |
| 1.6 | Verify grants after push, incl. the `authenticated` REVOKE | human | **privacy** | **not done** — see the standing rule below |
| 1.7 | SMTP provider account (Resend-class) | human | double opt-in | **not done** |
| 1.8 | Domain verification: SPF + DKIM on `onerhythm.org` | human | deliverability | **not done** |
| 1.9 | Deploy the confirmation-email Edge Function | human | double opt-in | **not done** — code ready, ships disabled |
| 1.10 | Set the Edge Function secrets | human | double opt-in | **not done** — `RESEND_API_KEY`, `MAIL_FROM`, `SITE_URL` |
| 1.11 | Wire the signup path to the send function | **code** | double opt-in | **NOT BUILT** — see gap G1 |
| 1.12 | Railway service from this repo (ADR 0023) | human | the site | **not done** — `docs/DEPLOY_RAILWAY.md`. Code ready: `Dockerfile`, `deploy/Caddyfile`, `railway.json` |
| 1.13 | Builder: Dockerfile (`railway.json`) | human | the site | **not done** — the image runs `EXPO_PUBLIC_SITE_MODE=landing npx expo export --platform web` and serves `dist/` with Caddy on `$PORT` |
| 1.14 | `onerhythm.org` and `www` as Railway custom domains, DNS as Railway asks | human | the site | **not done** — existing Railway project and DNS state not verified |
| 1.15 | Railway variables — `EXPO_PUBLIC_SITE_MODE=landing` ONLY | human | **security** | **not done** — no Supabase variables at all in the landing build; never `sb_secret_` anywhere |
| 1.16 | Google service-account JSON path for the Sheet mirror | human | founder visibility | **not done** — gitignored path, server-side only |
| 1.17 | Analytics decision | human | nothing — optional | **none** in today's landing build; any later choice is recorded first (note below) |
| 1.18 | Edge rate limiting (volumetric) on the sign-up path | human | abuse resistance | **not needed today** (sign-up is off in the landing build); **required before sign-up returns**. the Cloudflare rule this row assumed is not on the Railway path, and Railway's own options were not checked; choose a layer (ADR 0023) |
| 1.19 | Schedule the unconfirmed-row purge | human | retention honesty | **not done** — function exists, nothing calls it |

### 1.4–1.6 — before the first `supabase db push`

Checked on 2026-10-29: the hosted OneRhythm project holds only a stray
`consent_records` table, no OneRhythm functions and zero accounts. There is no
`supabase_migrations` schema, so no migration was ever pushed, and nothing was
exposed.

**Before the first `supabase db push`, drop that stray table or reset the
project**, so the hosted database matches `main` exactly. Otherwise the first
migration's `create table public.consent_records` fails, or a half-built table
with unknown grants survives beside the real one. Then do 1.6.

**Exposed schemas and GraphQL (moderation, 2026-10-29).** The block check that
the posts and comments read policies use lives in `moderation_private`, which
must never be an exposed API schema. `supabase/config.toml` sets this for the
local stack only; for the hosted project it is the dashboard's API setting
("Exposed schemas"), which must stay `public` and `graphql_public`. The app
uses supabase-js, not GraphQL, so **keep pg_graphql off on the hosted
project** (it is off by default on new stacks; confirm it in the dashboard)
unless a later decision needs it. `supabase/tests/22_…` checks that GraphQL
does not expose the block check wherever pg_graphql is installed.

### 1.2 — CI could not have been green

At the time of the original assessment the repo had not been pushed. It now
exists privately on GitHub. The CI concern below remains a historical finding:
`npm run test:ci` ran all three Jest projects, and the `db`
project talks to a live Supabase stack using credentials from `.env.test` — which
is gitignored and therefore never reaches a runner. There is no Supabase service
in the workflow either. That step could not have passed.

CI's first job runs `npx jest --selectProjects rn web --ci --coverage`: **591
tests in 53 suites** on `main` (2026-10-30), and **644 in 55** with PR #13. The
`landing` job runs the same suites in landing mode, exports the site with no
Supabase variables, and builds and smoke-tests the Railway image.

**Since 2026-10-29 a second CI job, `db`, runs pgTAP and the `db` jest project**
against a local Supabase stack started inside the job (no secrets; local keys
are generated there). That closes **G11** once the job is green on `main`.

The first run is the evidence for why it was needed. The `db` suite and pgTAP
had not run anywhere since 2026-08-09, because the pre-commit hook that was
meant to gate them is opt-in. When they ran, two assertions were red: the ops
purge function was executable by `anon` and `authenticated`. The same audit
found that `has_current_health_consent` disclosed any member's consent state to
any caller. Both are fixed in `20261029120000` (see §1.6).

### 1.6 — the `authenticated` REVOKE standing rule

This one is easy to skip and expensive to get wrong, so it is called out
separately.

Migration `20260708051747` pinned `ALTER DEFAULT PRIVILEGES` for role `postgres`
in schema `public`. The consequence, verified against the image's `pg_default_acl`:

```
postgres | public | r | {postgres=arwdDxtm/postgres,
                         authenticated=arwd/postgres,
                         service_role=arwd/postgres}
```

**Every new table in `public` is handed full DML to `authenticated`
automatically.** A new table is therefore *open by default* and must be closed on
purpose. Two tables rely on an explicit revoke to be private at all:

- `public.updates_subscribers`
- `public.updates_signup_throttle`

**Functions had the same trap.** The `postgres` default privileges granted
EXECUTE on every new function to `anon` and `authenticated` directly, so a
`revoke ... from public` removed nothing. `20261029120000` removed those direct
grants from the defaults.

**Correction (2026-10-29, moderation build step 3).** That is not enough on its
own. PostgreSQL also gives PUBLIC EXECUTE on every new function, and
`alter default privileges ... in schema public` cannot remove that built-in
grant; it can only add to or take away from the global defaults. So a new
function is still callable by `anon` and `authenticated` through PUBLIC. The
moderation migration (`20261029130200`) therefore revokes EXECUTE from
`public, anon, authenticated, service_role` on every function it creates, by
name, and grants back its matrix. **Every future migration that creates a
function must do the same.** `supabase/tests/06_function_execute_allowlist_test.sql`
catches a miss.

After `db push`, confirm both, and confirm no client role holds EXECUTE on the
purge function, and `anon` holds none on `has_current_health_consent`:

```sql
select table_name, grantee, privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public'
   and table_name in ('updates_subscribers', 'updates_signup_throttle')
   and grantee in ('anon', 'authenticated');
-- expect: zero rows

select routine_name, grantee
  from information_schema.role_routine_grants
 where routine_schema = 'public'
   and routine_name = 'purge_unconfirmed_updates_subscribers'
   and grantee in ('anon', 'authenticated');
-- expect: zero rows
```

`supabase/tests/04_marketing_member_separation_test.sql` asserts all of this, so
the fastest check is to run the pgTAP suite against the hosted database.

**Any future table holding data members must not read has to repeat the revoke.**

### 1.17 — analytics recommendation

> **Superseded in part by ADR 0023 (3 Nov 2026).** The site is on Railway,
> not Cloudflare, so the "no new subprocessor" reason below no longer holds.
> Today's landing build ships **no analytics at all**, and that is the
> recommendation until a choice is recorded.

**Recommend Cloudflare Web Analytics.** Free, cookieless, no JavaScript that
identifies anyone, and — the deciding factor — **no new subprocessor**, because
Cloudflare is already serving the site. Plausible and Umami are both acceptable
on privacy grounds (CLAUDE.md names them), but each adds a processor to disclose,
and self-hosted Umami adds a database to run and secure.

Whichever is chosen, the non-negotiable stands: **no ad or tracking pixel on any
health or authenticated page, ever**, and no event may ever be tagged with a
diagnosis or symptom. Disclosing health data to a third party is itself a
reportable breach under the FTC Health Breach Notification Rule. `tests/unit/meta-tags.test.ts`
and `tests/web/landing-screen.test.tsx` both assert the absence, and the
`no-thirdparty-on-health` guard blocks it at commit time.

It is also entirely reasonable to launch with **no analytics at all**. Nothing
depends on it.

### 1.18 — rate limiting, and what is already done

Per-address throttling **is built** (migration `20260808120000`): five attempts
per address per hour, inside the definer function, with new/existing/throttled
indistinguishable to the caller.

That is deliberately *not* volumetric protection. It stops one address being
hammered; it does nothing about a flood from one source across thousands of
distinct addresses. Doing that in the database would mean recording an IP per
attempt, which contradicts the "nothing about the caller" rule the marketing
boundary depends on. **It is a Cloudflare-layer deployment task** — a rate-limit
rule on the signup route — and is recorded here as such rather than as a code gap.

**Since ADR 0023** the site is on Railway and sign-up is off, so there is no
route to limit today. The task stands, but its layer is open: a proxying CDN
in front of Railway, or a limit in the Edge Function. Choose it before sign-up
returns.

---

## Tier 2 — member platform live

Everything in Tier 1, plus:

| # | Item | Kind | Blocks | Status |
|---|---|---|---|---|
| 2.1 | **Attorney review** — ToS, both privacy policies, disclaimers, clinician terms | human | **BUILD-BLOCKING** | **not done** |
| 2.2 | Standalone WA MHMDA Consumer Health Data Privacy Policy | human + code | **BUILD-BLOCKING** | **not done** — a separate document, not a section |
| 2.3 | Production auth email (magic links off Inbucket) | human | sign-in | **not done** |
| 2.4 | Phase 2 moderation core | **code** | open registration | **Member and moderator surfaces built** (steps 1–5, PR #12). Not launchable: the public floor, gates and log pages (step 6) and context notes (step 7) are not built, and launch gates G1–G7 and G9 are unmet. See 2.4a |
| 2.5 | Upload pipeline (PRD Amendment 2 §7.9) | code | any image upload | **NOT BUILT** — Phase 2M, after 2.4 |
| 2.6 | Geo-gating decision for non-primary markets | human | GDPR exposure | **decision needed** |

### 2.1 — what "build-blocking" means here

Do not launch member support or any health-data feature without it. This is
CLAUDE.md non-negotiable #7. The PBC conversion is drafted but **not filed**;
OneRhythm is **not** a separate 501(c)(3). Review contribution and tax copy
with counsel. Product vocabulary is "member support" and "contributions". Copy that
gets this wrong is a legal problem, not a style problem.

### 2.4 — moderation gates iOS specifically

**Apple App Store Guideline 1.2 makes filtering, reporting, and blocking a hard
requirement for any app with user-generated content.** Not a recommendation — a
rejection reason. iOS cannot ship without the Phase 2 moderation core, whatever
state the rest of the platform is in.

Meaningful open registration should not happen on web either. A positive-only
community with no moderation is not a safe community; it is an unmoderated one
with the downvote removed.

### 2.4a — moderation surfaces, and the manual screen-reader pass (launch gate G7)

As of 2026-10-30 (PR #12), every moderation surface for members and
moderators exists, as code with automated tests:

- **Members:** Report and Block panels; the removal notice; the "Ask us to
  look again" page; the "Show this post" gate; muted words; folded posts; the
  post-submit crisis panel (built, shown only once crisis triage runs, after
  G6); the contact page; the "help in another country" page.
- **Moderators:** the console at `/moderation`, with the queue and the item
  pane. While G4 is unmet nobody can hold a grant, so the page says "No
  moderators are appointed yet".

Not built: the public floor, gates and log pages (step 6) and context notes
(step 7, behind G3).

The automated part of plan §5.7 runs in CI: axe in the `web` jest project,
the behaviour tests (T5, T12, T14, T15, T20, T21), 44px targets under the rn
renderer, and native focus events. **What automation cannot show is how a
real screen reader behaves.** That is launch gate G7. It is **ready to
schedule**, and it blocks member launch.

**Screen readers (plan §5.7):** VoiceOver on iOS, VoiceOver on macOS
(Safari), NVDA on Windows (Firefox or Chrome), TalkBack on Android; JAWS if
available. Also keyboard only, with no screen reader, on the web.

**Surfaces, each with the 🆘 control and "Contact us" checked on it:**

| Surface | What to check by hand |
|---|---|
| Report panel (post and comment) | Heading takes focus on open (ADR 0022 asks: does VoiceOver on iOS read a heading focused by script?); the reason group and its error; the visible note label; Escape and Cancel; focus back to the opener after Send |
| Block panel | Three lines read in order; focus goes to the thread heading when the post is hidden |
| Removal notice (author, others; crisis and not) | Crisis resources in the same block; "Removed" read as a list item |
| "Ask us to look again" page | Visible field label; the character warnings at 900 and 1,000; the draft kept across navigation; focus on the saved message after Send |
| "Show this post" gate | Show and Hide keep focus; the post is never hidden from the reader once shown |
| Muted words | Visible field label; focus to the field after Remove; messages never read the word |
| Folded posts in the feed | The button names the word |
| Post-submit crisis panel | Heading takes focus; read once, not twice |
| Contact, help in another country | Links say where they go |
| Moderator console | Skip link, navigation, one main; new items counted, never inserted or focused by themselves; Pause; focus after Show, after Apply, and when another reviewer handles the focused item; "Show this content"; the session warning and "Stay signed in"; one column at 320px and at 400% zoom |
| The crisis sheet opened from any of the above | Opens, closes, and focus returns to where it was |

On iOS and Android, also check the native focus moves (the screen-reader
"focus" event after panel open, Send, Remove and the Block fallback) and
large text at 200%. Record the result per surface and per reader in the PR
that closes G7.

### 2.2 — why MHMDA needs its own document

Washington's My Health My Data Act requires a **standalone** Consumer Health Data
Privacy Policy — a separate, linked document, not a section inside the general
privacy policy. Health self-ID is opt-in, separately consented, unchecked by
default, and never required to participate; the policy has to say so, and has to
carry the access/deletion/withdrawal rights and the no-sale commitment.

---

## Open gaps, stated honestly

> **Two sets of "G" numbers.** The gaps below (G1–G12) are this file's own
> list. They are **not** the launch gates G1–G9 in ADR 0021 and the
> `launch_gates` table (for example, launch gate G1 is crisis response and
> review staffing; gap G1 here is the double opt-in). Tier 2 row 2.4 and §2.4a
> use the launch-gate numbers.

These are known, deliberate, and none is a surprise. Listing them is the point.

**G1 — the double opt-in loop is not closed.** The Edge Function exists and is
correct; nothing calls it. `subscribe_to_updates` deliberately returns `void`, so
the client never holds the confirm token and *cannot* pass it — that silence is
the anti-enumeration property and is worth more than the convenience. Closing the
loop is a database trigger or a scheduled sweep, and that choice belongs with the
deployment. Until it is closed, **signups are collected and never confirmed**, and
the landing copy correctly says nothing is sent. **Since ADR 0023 the public
build has no sign-up form at all**, so nothing is collected; G1 must be closed
before sign-up returns.

**G2 — backup purge window.** Deletion cascades through the live database
(proven: 8 assertions in `supabase/tests/03_deletion_cascade_test.sql`). It does
not reach into Supabase's own backups, and there is no automation that does. The
delete-account screen says nothing about backups precisely because of this — a
claim there would tell someone their data is gone when it is not. Needs a written
retention/purge position at Tier 2, and it is an attorney-review item.

**G3 — native export is Phase 5.** Data export downloads a real file in a
browser. On iOS/Android there is no download path yet.

**G4 — heading levels are web-only.** Levels are carried by `aria-level`, which
react-native-web maps to real `<h1>`–`<h6>`. React Native's `TextProps` has no
`accessibilityLevel`, so on iOS/Android these announce as headings **without a
level**. Recorded in ADR 0011 and unchanged.

**G5 — `profiles_select_authenticated` is a broad read.** Any authenticated
member can select any profile row. **G6 — `profiles_delete_self` is a side
door**: a member can delete their profile row directly, outside the
`delete_my_account` rights workflow. Both are deferred to the Phase 2
authorization matrix by founder ruling, and both are recorded rather than quietly
carried.

**G7 — the aggregate-transparency note is cut.** The deletion screen does not
claim we keep anonymized participation records, because there are no governance
or treasury tables — the claim would have told someone their data survives when
it does not. **Restoring that note is a named Phase 3 prerequisite**, gated on
those tables actually existing.

**G8 — no screen-reader pass has been done.** The `web` jest project proves
attributes are present in a real DOM; jsdom has no accessibility tree and cannot
prove anything is *spoken*. `.claude/rules/a11y.md` requires a manual
keyboard/screen-reader pass before merge and it is outstanding for the
delete-account description flow specifically (ADR 0014). One pass with NVDA or
VoiceOver over the landing page and the delete flow before Tier 1.

**G9 — `accessibilityHint` is inert on web.** It does not exist anywhere in
react-native-web 0.21.2 and is dropped in silence. `UpdatesSignupForm` is fine —
it pairs the hint with `aria-describedby` deliberately. `PostCard` and
`JourneyEntryCard` are not: their hints simply do not exist in a browser. Neither
is safety-critical, both are Tier 2 surfaces, and the fix is the same two-carrier
pattern. Recorded in ADR 0014.

**G10 — 170 negative matchers are not individually mutation-tested.** The
invariant-bearing ones are (ADR 0013). The rest are covered going forward by the
standing rule, not retroactively.

**G11 — CI did not run the `db` suite or pgTAP.** **Closed:** the `db` job in
`.github/workflows/ci.yml` has been green on `main` since 2026-10-30. It starts
Supabase CLI 2.122.0 (db, auth, rest, gateway only), runs
`scripts/run-pgtap.sh`, then `npx jest --selectProjects db`. The local gate
was weaker than this file said: the hook is opt-in (`core.hooksPath`), and a
defect merged on 2026-08-08 with its own failing assertions unnoticed.

**G12 — the open-books page does not exist (deliberate).** The `/transparency`
page, the runway meter and the coverage math were removed before launch (ADR
0016): under a dollar a month of cost against zero member support, on a platform
that has not opened, reads as overcooked rather than transparent. **The ledger
itself is untouched** — `transparency/*.yml` is still in the private repo, still
append-only, still guarded by `.claude/hooks/ledger-append-only.sh`, still
auditable through git history. Rebuilding the page is a **Phase 4 prerequisite
alongside Stripe**, and it must come back with a generator and a drift test, not
as a hand-maintained copy of the numbers.

---

## Actions requiring the founder

Short list. Everything else is either done or waits on these.

### Accounts to create

1. **GitHub** — make the repository public by `docs/RELEASE_FRESH_HISTORY.md`:
   private vulnerability reporting, branch protection on `main`, Dependabot
   alerts, then visibility.
2. **Supabase** — create the hosted project; keep the region in mind for GDPR.
3. **Resend** (or equivalent) — create the account and verify `onerhythm.org`,
   including SPF and DKIM DNS records.
4. **Railway** — the landing service, `onerhythm.org` and `www` as custom
   domains, and the DNS records Railway shows (`docs/DEPLOY_RAILWAY.md`). A
   rate-limit layer for the sign-up path is needed only when sign-up returns.
5. **The contact mailbox,** `matthew@vt-infinite.com` (Google Workspace),
   recorded in `docs/privacy/subprocessor-inventory.md`. Open: confirm its
   data processing terms are accepted, and set its retention.
6. **Google Cloud** — service account for the subscriber Sheet mirror, if that
   mirror is still wanted.

### Keys to obtain, and exactly where each goes

| Key | Where it goes | Never |
|---|---|---|
| Supabase **publishable** key | **nowhere today**: the landing build needs none. Later, the member build's host variables | never in the landing build |
| Supabase `sb_secret_` (service) | nowhere in the client; server/ops only | never in Railway variables, never in git |
| `RESEND_API_KEY` | Supabase Edge Function secret | never in the bundle, never `EXPO_PUBLIC_*`, never in git |
| Google service-account JSON | gitignored local/server path | never committed |

The secrets guard now blocks Resend, SendGrid and Mailgun key shapes and bare
SMTP passwords, as well as Supabase secret keys and service-account files — but a
guard is a backstop, not a plan.

### Decisions to make

1. **Analytics** — none today (ADR 0023). Any later choice affects the privacy
   notice and the subprocessor list.
2. **How the confirmation email gets triggered** (G1) — trigger or sweep.
3. **Retention window for unconfirmed rows** — the purge defaults to 30 days.
   Once it is actually *scheduled*, `app/privacy-notice.tsx` should be updated to
   state it. Not before: the notice currently promises no automatic cleanup,
   which is the honest sentence while none runs.
4. **Geo-gating** non-primary markets at launch, or accepting GDPR exposure.
5. **When to engage the attorney** — this is the long pole for Tier 2 and nothing
   in Tier 2 should start until it is booked.
6. ~~Whether to stand up Supabase in CI (G11).~~ Done 2026-10-29.

### The one-line version

**Tier 1 is close** — the landing-only build needs PR #13 merged, the Railway
service and DNS, a working contact mailbox, Railway's logs recorded in the
inventory, and the repository public before the address is shared. Sign-up
returning needs hosted Supabase, an email provider, G1 closed and rate
limiting. **Tier 2 needs
an attorney and the Phase 2 moderation core**, and neither is a code task that
can be finished by working faster.
