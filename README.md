# OneRhythm

A peer-support community for people living with a heart-rhythm problem
(cardiac arrhythmia), and for the people who care for them. It's a place to
find each other and feel less alone.

**If you are not safe right now:** in the US, call or text **988** (the
Suicide & Crisis Lifeline), or call **911**. Anywhere else, call your local
emergency number. [findahelpline.com](https://findahelpline.com) lists free
crisis lines by country.

Nobody should fight an invisible bear alone.

---

## What it is, and what it is not

**It is:**

- a peer community, with spaces organized by diagnosis, and caregivers as
  full members;
- positive-only: you can give a post an "upbeat", and there is no downvote of
  any kind;
- run by its members within two floors that are never put to a vote: a
  safety floor and a privacy floor;
- open source, under the Apache License 2.0.

**It is not:**

- medical advice, diagnosis, or ECG reading — for anyone, from anyone;
- a medical record: there are no fields for diagnoses, medicines or test
  results, and nothing is imported from a health record or a device;
- telehealth, or an emergency service;
- a crypto, token or DAO project.

Medical judgment stays with you and your clinician.

## Where it stands (3 November 2026)

Built carefully, and not open yet.

- **Built, in this repository:** sign-in by email link, onboarding, optional
  health self-ID with a consent record, communities, posts, comments,
  upbeats, journey pages, privacy rights (download, consent history, delete),
  crisis help on every screen, the landing page, and the moderation core
  (reporting, blocking, removal notices, appeals, and a moderator console).
- **Gated:** the member platform must not be reachable in public. Every
  launch gate in [ADR 0021](docs/adr/0021-appeals-and-launch-gates.md) is
  recorded as unmet or deferred. Among them are crisis response and review
  staffing, the published floors, legal review by a healthcare-privacy
  attorney, and a manual screen-reader pass. The database tests (gate G8)
  pass in CI, but that gate is not yet marked met. Hosted Supabase is not set up.
- **Not built:** the public pages for the floors, the gates and the
  moderation log; community governance; member support; mobile app releases.

[`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md) is the honest
list of what stands between here and a live member platform.

## The three layers

OneRhythm is planned in three layers, each with its own owner and rules:

1. **The core:** the peer community, which is this repository.
2. **Open standards** that partners can carry out, such as peer-coach
   training and live group sessions.
3. **Clinical care** that licensed partners deliver, outside OneRhythm. The
   core never crosses into it.

The [vision document](docs/vision/OneRhythm_Vision.md) explains the layers,
and labels every claim as Built, Planned, For partners, or Hypothesis.

## What is safe to deploy today

- **The landing page: yes.** Build it with `EXPO_PUBLIC_SITE_MODE=landing`.
  That build shows only the landing page, the privacy notice, the contact
  page and the "help in another country" page. Every other path goes back to
  the home page, and the build never talks to a database
  ([ADR 0023](docs/adr/0023-railway-landing-only-web-host.md)). The
  `Dockerfile` builds and serves it; [`docs/DEPLOY_RAILWAY.md`](docs/DEPLOY_RAILWAY.md)
  is the runbook.
- **The member platform: no.** Not until counsel's review is done and the
  launch gates are met.

## Running it

You'll need Node 22 or later and Docker. Docker runs the local Supabase stack.

```bash
npm ci --legacy-peer-deps

# The landing page alone: no database needed.
EXPO_PUBLIC_SITE_MODE=landing npx expo start --web

# The whole app, against a local Supabase stack.
npx supabase start -x studio,imgproxy,edge-runtime
cp .env.example .env.local        # fill in from `npx supabase status`
npx expo start
```

Only the Supabase **publishable** key belongs in client settings. The secret
key is for tests and servers only, and never goes in git.

## Testing it

```bash
npm run lint
npm run typecheck
npx jest --selectProjects rn web        # component and browser-renderer tests
cp .env.test.example .env.test          # needs the local stack's secret key
npx jest --selectProjects db            # database integration tests
scripts/run-pgtap.sh supabase_db_onerhythm   # database rules, in pgTAP
```

There are three jest projects. `rn` renders React Native components, `web`
renders them in a real DOM (the browser is the deploy target), and `db` runs
against a live local database. CI runs all of them, plus pgTAP and a
landing-build check.

The database rules that matter most are pinned in pgTAP: no downvote column
can exist, one equal vote per member, consent gating, and the full deletion
cascade. Seven commit guards block a downvote mechanic, a third-party tracker
on a health page, a secret, a raw colour value, and a few other things that
must never land. Every invariant test is meant to be shown failing against a
deliberate break before it counts ([ADR 0013](docs/adr/0013-vacuous-test-audit.md)
is honest about the ones that weren't).

## Contributing

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md). In short: sign off your
commits (`git commit -s`), write the test first, and keep the guards on. Some
things are not open to change by pull request, and that file says which.
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) applies to everyone. Report
security problems privately, as [`SECURITY.md`](SECURITY.md) explains, and
never with real patient data.

Decisions are recorded in [`docs/adr/`](docs/adr/), and the plan for each phase
is in `.claude/plans/`. They're public on purpose: the reasoning behind a
health platform should be as easy to check as its code.

## Who runs it

OneRhythm is an initiative of **VT Infinite, Inc.**, a Delaware corporation.
It is **not** a 501(c)(3) charity, so contributions are **not
tax-deductible**. We say "member support" and "contributions", never
"donations". Member support is not open, and nothing here asks for money.

## License

Apache License 2.0, © 2026 VT Infinite, Inc. See [`LICENSE`](LICENSE) and
[`NOTICE`](NOTICE). The license covers the code. Like any Apache-2.0 project,
it does not grant use of the OneRhythm name or the 1R mark (section 6).
`NOTICE` says that plainly, and gives the terms of the Atkinson Hyperlegible
typeface. [ADR 0024](docs/adr/0024-apache-2-and-fresh-history-release.md)
records why this license was chosen.
[`ACKNOWLEDGMENTS.md`](ACKNOWLEDGMENTS.md) names the open-source projects
OneRhythm is built on.

---

Pain is not a competition. Ad Astra Per Aspera.
