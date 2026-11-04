# Contributing

Thanks for looking. This is a health project for people who are often having a
hard week, so the bar is a little different from most repositories — but the
process is ordinary.

## This is the upstream

This repository is where OneRhythm is developed. Its public history starts
at the `v0.1.0` release commit; the working history before it is kept
privately by VT Infinite, Inc., and the decisions from that time are in
[`docs/adr/`](docs/adr/) and `.claude/plans/` (ADR 0024). Issues and pull
requests come here.

## License of contributions

The project is under the [Apache License 2.0](LICENSE). Under its section 5,
anything you intentionally submit for inclusion comes in under those same
terms, unless you clearly say otherwise in writing. Please don't send code
you can't license that way.

## Sign off your commits (DCO)

Every commit needs a `Signed-off-by:` line. It says you agree to the
[Developer Certificate of Origin](https://developercertificate.org/): that
you wrote the change, or have the right to send it, under this project's
license (Apache-2.0). Git adds the line for you:

```bash
git commit -s -m "fix: say what changed"
```

Use your real name and an email you can be reached at. If you forget, `git
commit --amend -s` fixes the last commit, and `git rebase --signoff main`
fixes a branch.

The sign-off rule starts at the release commit, which is itself signed off.
A DCO check runs on every pull request.

## Getting it running

```bash
npm ci --legacy-peer-deps
npx supabase start -x studio,imgproxy,edge-runtime
cp .env.example .env.local        # fill in from `npx supabase status`
cp .env.test.example .env.test

npm test          # all three jest projects
npm run typecheck
npm run lint
```

Enable the commit hooks once: `git config core.hooksPath .githooks`. They run the
seven guards plus lint, typecheck and the full suite. The guards, in
`.claude/hooks/`, block:

- a downvote, or any negative rating;
- a third-party tracker or AI-provider host outside the AI gateway module;
- a policy that lets anonymous users read a sensitive table;
- an edit or deletion in the transparency ledger;
- a secret, key or service-account file;
- a raw colour value outside `src/theme/tokens.ts`;
- a join between the marketing list and member data.

CI runs the same guards over every pull request. **Please don't use
`--no-verify`.** The database tests and pgTAP also run in CI (the `db` job), but run
them locally too when you touch the schema: `scripts/run-pgtap.sh`.

pgTAP, when you touch the schema:

```bash
for f in supabase/tests/*.sql; do
  docker exec -i supabase_db_onerhythm psql -U postgres -d postgres -X -f - < "$f"
done
```

Use `docker exec` rather than `supabase test db` — the latter has reset the local
stack out from under people here more than once.

## The floors are not open to change by pull request

Two floors sit under everything here, and no pull request, vote or majority
changes them:

- **the safety floor:** no medical misinformation, no ECG or diagnosis
  reading, crisis posts go to trained people and crisis resources, crisis
  help one tap away on every screen, and the rest of the list in
  `.claude/rules/governance.md`;
- **the privacy floor:** consent before any health data is used, no sale, no
  sharing except as the floor allows, no trackers on health or signed-in
  pages, no training on member content, the right to delete, and live
  sessions never recorded.

Only VT Infinite, Inc., or a future steward under the same rule, can change a
floor, and only by the rule in ADR 0017:
announced with its reason first, and a loosening needs a new ADR, legal
review and a notice period. A pull request that would loosen one will be
closed with a pointer to that rule. You are welcome to open an issue asking
for the reason behind any floor item to be re-examined in public.

## The things a change must not break

These are not style preferences. A pull request that crosses one of them will be
declined however good the code is.

1. **No clinical data. Ever.** Accounts, roles, self-ID tags, content, votes,
   journey pages — that is the whole list. Never ECGs, records, labs, or medical
   imagery. Uploads of documents, PDFs and video are blocked permanently.
2. **No diagnosis or individualised medical advice**, anywhere, from anyone —
   including verified professionals. General, broadcast-only education with
   persistent disclaimers. Interpreting a specific person's ECG is the hard line.
3. **WCAG 2.2 AA is build-blocking.** Test against the 65+, low-vision, low-tech
   baseline user. Icon *and* text, never icon alone. Visible focus ring, always.
   ≥24px targets, 44px for primary actions. No autoplay, no carousels, no ambient
   motion. If a feature excludes that user, it loses.
4. **There is no downvote.** Not hidden, not disabled, not "for moderators".
   Upbeats are a presence/absence row; there is no negative state in the data
   model or the UI, and a commit hook enforces it.
5. **No ad or tracking pixels on any health or authenticated page.** Analytics
   must be cookieless and PII-free, and no event may ever be tagged with a
   diagnosis or symptom. This one is not just policy — disclosing health data to
   a third party is itself a reportable FTC HBNR breach.
6. **RLS on every new table, default-deny**, before it is used anywhere. And the
   standing rule that catches people: `ALTER DEFAULT PRIVILEGES` in this project
   hands `authenticated` full DML on every new table in `public`, so **a new
   table is open by default and must be closed on purpose** with an explicit
   `revoke`. Two tables already depend on that revoke to be private at all.
7. **The transparency ledger is append-only.** Closed months never change, cost
   entries are never deleted. Corrections go in as new entries with a note. This
   still holds even though nothing renders the ledger today — the page was
   removed before launch (ADR 0016) and the record was not. The ledger files
   (`transparency/`) are not in the public release yet (ADR 0024); the rule
   and its guard apply when they are.
8. **Marketing data and member data are never joined.** The updates list has no
   foreign key out of it, by design, and no query may touch it and a member table
   together.

## How we write tests

Test-first, and the failing test gets committed before the implementation. That
is in the git history and it is not ceremonial.

The rule worth knowing before you write your first test here:

> **Every invariant test must be proven to fail against a deliberate violation
> before it counts as a guarantee.**

Break the thing. Watch the test go red. Restore it. Only then is the test
finished. `scripts/vacuity-audit.sh` automates the loop. This exists because
several of our own tests turned out to prove nothing —
`docs/adr/0013-vacuous-test-audit.md` names them, including two that stayed green
against a component that never announced anything at all.

Two specifics that follow from it:

- An **absence** assertion needs a companion positive assertion that the surface
  rendered at all. "No downvote in the DOM" is satisfied by a blank page.
- If your change is about what a **browser** receives, the test belongs in the
  `web` project. The `rn` project checks the prop a component intended to set,
  which is not the same claim.

## Reviewers

Changes in these areas get a reviewer's read before merge. Maintainers run
them as read-only review agents (`.claude/agents/`), and their verdicts go in
the pull request:

- **a11y-reviewer:** any screen, component or style change (WCAG 2.2 AA is
  build-blocking);
- **privacy-reviewer:** data model, consent, analytics, AI, moderation data,
  hosting or member support;
- **governance-reviewer:** ballots, budgets, proposals, moderation tiers, or
  anything touching the floors.

A reviewer's FAIL is fixed, test-first, before merge. Say in the pull request
what each reviewer found and what changed.

## Workflow

For anything non-trivial: explore first, write a short plan in `.claude/plans/`,
get agreement, then build. Those plans are committed and public — the reasoning
behind a health platform should be as auditable as its books.

Conventional commits. Reference an ADR or a spec section for anything
significant. Record real decisions as a new ADR in `docs/adr/`, including the
options you rejected and why — the rejected option is usually the useful part.

## Voice

Plain, around an 8th-grade reading level. Warm, humble, honest. No hype, no
urgency, no growth-hacking. Never rank suffering: pain is not a competition.

Write for someone reading on a phone, at 2am, in a hospital corridor, frightened.
That is a real person who will read this software, and the words are part of it.

## Reporting security issues

Privately first — see `SECURITY.md`. Never include real patient data in a report.
