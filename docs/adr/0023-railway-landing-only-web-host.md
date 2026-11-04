# ADR 0023 — Railway hosts the web landing page; the public build is landing-only

Status: Accepted — founder decisions, 2026-11-03
Date: 2026-11-03
Supersedes, **for the web host only**: the "Web host: Cloudflare Pages" line
in `CLAUDE.md` "Stack", and the "Web hosting" line in PRD §12. Nothing else in
either changes: one Expo codebase, Supabase, Stripe on web only, cookieless
analytics if any.
Relates: ADR 0011 (landing page and updates list), ADR 0016 (landing copy
and statistics), ADR 0021 (launch gates), `docs/PRODUCTION_READINESS.md`
Tier 1, `docs/DEPLOY_RAILWAY.md`.

## Context

`CLAUDE.md`, the PRD and the earlier ADRs name Cloudflare Pages as the web
host. `public/_redirects` is Cloudflare's SPA-fallback file. No Cloudflare
Pages project was ever set up (`PRODUCTION_READINESS` 1.12–1.14).

The founder deployed this site to Railway before, with the domain
`onerhythm.org`, and has chosen Railway now. This session could not see that
Railway project or its DNS, so its current state is **not verified** here.

The member platform is built in part but must not be reachable in public.
Every launch gate in ADR 0021 except G8 is unmet or deferred (G1–G7, and G9
deferred), legal review has not happened, and hosted Supabase is not set up for OneRhythm (one stray, empty
`consent_records` table; no migration history).

## Decisions

### 1. Railway hosts the web landing page

The reasons are practical, not technical: the founder already has a Railway
setup and the domain is already pointed at it. Railway is not better than
Cloudflare Pages for a static site; it is the one in use.

The build is a **Dockerfile**, not Nixpacks or Railpack:

- a static site still needs a server config (fallback, headers, cache), which
  is a Caddyfile either way;
- a Dockerfile builds and runs the same on a laptop, in CI and on Railway, so
  the image that was tested is the image that ships;
- versions are pinned by tag and digest, the server runs as a non-root user,
  and nothing about it is Railway-specific. Moving to any other host is the
  same image.

### 2. Today's public build is landing-only

`EXPO_PUBLIC_SITE_MODE=landing` builds a site that renders only:

- `/` (the landing page);
- `/privacy-notice`;
- `/contact`;
- `/help/other-countries`.

Crisis help is a sheet on every screen, not a route, so it is always there.

Every other path redirects to `/`. That includes sign-in, the feed,
communities, journeys, compose, onboarding, settings, members, updates,
moderation, the console, appeals, and any path that matches no route. The
rule is **default-deny**: the allow-list is in `src/lib/site.ts`, and a route
added later is blocked until someone adds it there on purpose.

The redirect is in the router layout (`app/_layout.tsx`), not in hidden links.
A route gate sits inside a custom `Navigator`, so the router is mounted before
it redirects, and a blocked screen never renders at all. That matters: a
screen that rendered for one frame would run its effects, and those call
Supabase.

**No Supabase in the landing build.** The client in `src/lib/supabase.ts` is
now built on first use instead of at import, and in landing mode it is never
built: reaching for it throws. `AuthProvider` reports "nobody signed in"
without touching it. The build needs no `EXPO_PUBLIC_SUPABASE_*` variables, and
the Dockerfile declares none, so Railway service variables cannot reach it.

Tests: `tests/components/LandingModeRouting.test.tsx` (the real root layout in
expo-router's test router, every route file in `app/`) and
`tests/web/landing-mode.test.tsx` (the real pages in a DOM, with
`createClient` as a spy). CI's `landing` job runs the rn and web suites in
landing mode, exports the site with no Supabase variables, and builds and
smoke-tests the image.

Found while building this: with no `app/+not-found.tsx`, expo-router drew its
own "Unmatched Route" page **outside** the root layout, so outside the shell
and without crisis help. That file now exists, in both builds.

### 3. The updates sign-up is off for today

In landing mode `UpdatesSignupForm` is not rendered. A plain contact line
takes its place: one sentence and a mailto link, with no form and nothing
collected. The address was a placeholder at first; on 4 November 2026 the
founder set it to `matthew@vt-infinite.com` (`CONTACT_EMAIL` in
`src/lib/site.ts`). The page no longer says "leave your email and we'll tell you",
because there is no list to leave it on. The privacy notice says the list is
closed.

The founder may turn sign-up back on later. That needs, in order:

1. a properly set-up hosted Supabase: drop the stray table, then `db push`;
2. an email provider, with SPF and DKIM on `onerhythm.org`;
3. open gap G1 in `PRODUCTION_READINESS` closed (the confirmation email
   actually sent; not launch gate G1);
4. edge rate limiting on the sign-up path (below).

### 4. The license stays MIT

> **Amended by [ADR 0024](0024-apache-2-and-fresh-history-release.md)
> (2026-11-04):** the license is Apache-2.0, and the public repository
> starts from one release commit. Nothing was published under MIT. The text
> below is kept as it was decided.

MIT for today's publish. A move to Apache-2.0 (which adds an explicit patent
grant) stays open. It is cheapest **before outside contributions arrive**:
after that, every contributor's code is under the terms they sent it under,
and relicensing means asking each of them.

## What Cloudflare Pages gave, and how each is now provided

| Cloudflare Pages gave | Now | Where |
|---|---|---|
| SPA fallback (`_redirects`: `/* /index.html 200`) | Caddy `try_files`: an unknown path gets `index.html` with a 200; a missing hashed asset gets a real 404 | `deploy/Caddyfile` |
| Security headers (via a `_headers` file, never written) | CSP same-origin only, HSTS, `nosniff`, `Referrer-Policy: no-referrer`, a `Permissions-Policy` denying camera, microphone and geolocation, `frame-ancestors 'none'` | `deploy/Caddyfile` |
| HTTPS and certificates | Railway's edge, for custom domains | Railway dashboard |
| Edge rate limiting (`PRODUCTION_READINESS` 1.18) | **Not provided.** Nothing needs it today: the landing build has no sign-up route and calls no API. Before sign-up returns, a rate-limit layer must exist: for example a proxying CDN in front of Railway, or a limit in the Edge Function. Railway's own options were not checked in this session. | Open |
| No analytics unless chosen | No analytics, and none is added. Railway's edge and HTTP logs may record visitor IP addresses; what they keep, and for how long, is **not verified** and must be checked and recorded | `docs/DEPLOY_RAILWAY.md` |
| A global CDN | Not provided by this image. One Railway region serves the site. Hashed assets carry a year's `immutable` cache, so repeat visits are light | — |

The CSP allows `'unsafe-inline'` for **styles only**. react-native-web writes
its styles into a `<style>` element at runtime, and `index.html` carries
Expo's small reset `<style>`. Scripts are `'self'` only. Fonts are bundled with
the app (Atkinson Hyperlegible `.ttf` files), so no font host is allowed.

`public/_redirects` stays in the repository. It only matters on Cloudflare
Pages, and the Dockerfile removes it from the image.

## Consequences

- **Railway is now an infrastructure processor** (hosting). It already sees
  what any web host sees, including visitor IP addresses, though the landing
  build collects no health data and has no form. **Before the URL is
  shared**, record in the subprocessor inventory what Railway logs and keeps,
  and its terms on use of its own and on training. Before any member data
  flows through it, it needs everything `.claude/rules/privacy.md` requires of
  an infrastructure processor: a written contract, no use of its own, no
  training on member content, stated retention, and the inventory entry.
  `docs/privacy/marketing-list-inventory.md` still lists Cloudflare; it changes
  with that entry.
- **The contact mailbox is a processor too.** Whoever hosts the contact
  address receives every message sent to it. Since 4 November 2026 that is
  `matthew@vt-infinite.com`, hosted by Google Workspace, and recorded in
  `docs/privacy/subprocessor-inventory.md`. Two things there are still open
  for the founder: confirming that Google Workspace's data processing terms
  are accepted, and the mailbox's retention.
- The privacy notice now says plainly: no form, no cookies, an email to us
  gives us the sender's address, and the host sees IP addresses.
- The member build still runs locally and in tests exactly as before
  (`EXPO_PUBLIC_SITE_MODE` unset).
- Reverting to Cloudflare Pages is cheap: the export command is unchanged,
  and `_redirects` is still there. Headers would need a `_headers` file.

## Alternatives considered

- **Stay on Cloudflare Pages.** Still a good fit for a static site, with edge
  rate limiting built in. Not chosen because the founder's setup and domain
  are on Railway.
- **Railway with Nixpacks or Railpack.** Less to write, but the server config
  is needed anyway, and the image is harder to reproduce exactly in CI.
- **Hide member links instead of redirecting.** Rejected: a typed or pasted
  URL would still reach the member platform.
