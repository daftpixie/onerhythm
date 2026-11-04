# ADR 0012 — Privacy-rights UI: data export, account deletion, consent management

Status: Accepted
Date: 2026-08-07
Implements: Wireframes Addendum A, B13 (account & data deletion) and B14
(consent management & withdrawal)
Closes: the "privacy-rights UI" launch gate

## Context

The MVP could already delete a member's data — the cascade
`auth.users → profiles →` seven member-owned tables has been proven at the DB
layer since Phase 1 by `supabase/tests/03_deletion_cascade_test.sql`. What it
could not do was let a **member** invoke any of it. There was no export at all,
and Phase 1C shipped only a minimal consent surface: status plus a bare
turn-off, with no history and no links to the other rights.

That is a portability/erasure gap under MHMDA, GDPR and CCPA/CPRA, and it was
the largest remaining launch gate that is code rather than paperwork.

Addendum A specifies both screens in detail. Building them surfaced three
mismatches between the wireframe and the system as it actually exists, and this
ADR records how each was resolved — because in every case the resolution was to
tell the truth rather than to build the picture.

## Decision

### 1. Export — format and how it is scoped

A single JSON document, `format_version: 1`, filename
`onerhythm-my-data-YYYY-MM-DD.json`, built client-side from the member's own
session and handed straight to them. Nothing is uploaded, queued, or stored:
there is no job runner and this design does not need one.

`src/lib/rights/export.ts` is a set of pure functions over a `SupabaseClient`,
matching `src/lib/consent.ts`, specifically so the Node DB tests exercise the
real product code against the live stack rather than a mock.

**The scoping mechanism, stated accurately.** It is tempting — and it was the
brief's own assumption — to say "RLS scopes the export". That is only half true,
and the false half is the dangerous half:

- RLS **does** scope `consent_records` (`member_id = auth.uid()`),
  `health_self_ids` (self *and* current consent), and `memberships`.
- RLS **does not** scope `profiles`. `profiles_select_authenticated` is
  `using (true)` — any authenticated member can read every profile row. Posts
  and comments are likewise broadly readable, by design, so the feed works.

So the export carries an **explicit owner predicate on every query**, with RLS as
a backstop only where it happens to apply. `tests/db/rights-export.test.ts`
proves the outcome with two real accounts rather than trusting either mechanism:
Alice's serialized export must contain none of Bob's identifiers or text
anywhere, and every row present must be owned by Alice.

**`profiles_select_authenticated` being `using (true)` is flagged for the Phase 2
authorization-matrix work.** It is a latent broad-read policy that this work
happened to surface. It is deliberately **not** changed here — narrowing it
touches the feed and every profile read, which is not a change to make inside a
launch-gate commit.

**Completeness is pinned against deletion.** `MEMBER_OWNED_TABLES` is
cross-checked by test against `03_deletion_cascade_test.sql`. If a later
migration adds a member-owned table and the export forgets it, that test fails —
export and deletion cannot silently drift apart.

**Native export is deferred to Phase 5** (founder ruling). There is no
`expo-file-system`/`expo-sharing` dependency, so there is nowhere to put a file
on iOS/Android, and adding a dependency inside a launch-gate commit is not a
trade worth making. Launch is the web surface. The screens ask `canDownload()`
and say so plainly rather than offering a button that fails.

### 2. Deletion — a no-argument SECURITY DEFINER function

One migration, `20260807101500_delete_my_account.sql`:

```sql
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$ ... $$;
```

**Why not service_role.** `.claude/rules/db.md` makes privileged keys
backend-only. There is no Edge Function or server in this stack, so a
service-role path would mean shipping a privileged key somewhere it can be
extracted. A definer function keeps the privilege inside Postgres.

**Why no argument.** This is the entire security model: the function can only
ever act on `auth.uid()`, so there is no target to forge, guess, or inject.
`supabase/tests/05_delete_my_account_test.sql` asserts the zero-argument
signature explicitly — and that exactly one overload exists — so adding a
parameter later has to break a test rather than slip through review. The DB
suite attacks it from the other side too, calling the RPC with five plausible
uid argument names and proving each fails and the other account survives.

**No new deletion logic.** The function deletes the `auth.users` row and lets the
existing, tested cascade do the rest. Nothing is restated, so nothing can drift.

**Deliberately no audit row.** CLAUDE.md asks that privileged actions be logged
to an append-only trail. Here that conflicts directly with the right being
exercised: an audit row keyed to a deleted member re-creates the identifier the
deletion existed to remove, and `.claude/rules/db.md` forbids ledger immutability
that conflicts with deletion rights. There is no safety interest on the other
side of the scale — this is a member ending their own account, not a moderation
action. **Resolution: no audit row.** If an audit signal is ever wanted it must
be non-identifying (a date-bucketed count), never a member id.

### 3. Consent management

`app/settings/consent.tsx` now renders the full B14 surface: per-purpose status,
the member's current tags, a **confirmation before the tag purge**, the full
versioned history including withdrawn records with the policy version originally
agreed to, and links to export and deletion. Status is derived from the history
rather than queried separately — a current consent is simply a record with no
`withdrawn_at`.

The history is the reason withdrawal writes `withdrawn_at` instead of deleting
the row: it is the versioned-consent requirement made visible.

## The three honest gaps, and how the copy handles them

Addendum A's B13 copy promises things this system cannot do. Per founder ruling,
the shipping copy says what is true today, and every one of these is pinned by a
test in `tests/components/DeleteAccountPanel.test.tsx` — because this is exactly
the copy that drifts back in.

| Wireframe | Reality | Shipped |
|---|---|---|
| "Copies in our backups are removed within 30 days." | No backup-purge automation. No production database yet. | **Cut. Silent on backups.** No claim until there is a documented, automated purge window. |
| "We'll email you when it's fully done." | No SMTP. | **Cut.** "We can't send you a confirmation message yet. When you're signed out, it's done." |
| "Voting/treasury records … kept in anonymized, aggregate form." | **No governance or treasury tables exist at all.** | **Cut.** |

The third deserves emphasis, because the risk ran **opposite** to the one
anticipated. The expected failure mode was over-promising deletion. The actual
one was implying we *retain* something we do not — and on a deletion screen that
is worse: it tells someone their data survives when it does not.

**Named prerequisite for Phase 3:** when governance/treasury tables are created,
the aggregate-transparency note is restored to B13 verbatim, and the deletion
cascade and export are extended to cover the new member-owned rows. This is a
scope item for Phase 3, not a nice-to-have.

Fourth: the wireframe's **"Email notifications"** consent row is not built.
`consent_purpose` has exactly one value (`health_self_id`), so that toggle would
be a control wired to nothing. A control that lies is worse than an absent one.
`ConsentManager.test.tsx` asserts its absence.

## What the reviewer gates changed

Both reviewers were charged to **falsify**, not confirm. That is the only reason
the following exist.

**privacy-reviewer: SURVIVED, 7/7.** No cross-member leak, no way to aim the
deletion function, no member-owned table missed, no health-data leak past
withdrawal, no unkeepable copy, no third-party call. Two follow-ups accepted:
`05_delete_my_account_test.sql` now states in its header that it proves shape and
privilege ONLY, and that the behavioural "deletes the caller and nobody else"
proof lives in the Jest suite — so a green `supabase test db` is never mistaken
for proof of scoping.

**a11y-reviewer: FALSIFIED 5 of 8.** All five fixed:

1. **The typed word was case-sensitive.** This was the sharpest finding, and the
   defect was in the *test* as much as the code: the suite explicitly pinned
   `"delete"` as not arming the control. But SC 3.3.4 is already satisfied by the
   confirm region, so the typed word is belt-and-braces we chose — and
   `autoCapitalize` is only a soft-keyboard hint, so on the "older device"
   laptop persona it does nothing. A member typing the natural thing would have
   been stranded, unable to leave, with no explanation. Now compared
   case-insensitively and trimmed. The frozen assertion was amended.
2. **Focus was lost after deletion.** The success branch replaces the whole
   subtree, so the focused element unmounts and focus falls to `<body>`. Focus is
   now moved explicitly to the confirmation heading, plus an explicit announce.
3. **Live regions were mounted with their content already inside them** — an
   anti-pattern that means most screen readers never announce them. Both confirm
   regions now mount empty on first render and gain text as a mutation. This had
   made the most consequential message in the app silent.
4. **The disabled control left the Tab order.** `react-native-web` sets
   `tabIndex={-1}` for the `disabled` prop, so a keyboard-only member *without* a
   screen reader would tab straight past it and never learn why it was grey. Now
   `aria-disabled`, still focusable, and pressing it while inert sends focus to
   the field and explains what to type.
5. **Flat heading levels and a stray second destructive control.** All headings
   now carry levels; the trigger is hidden while the confirm region is open, so
   exactly one destructive control is ever on screen.

Deferred with the founder's knowledge: a jsdom + react-native-web jest project.
The suite runs only under the native renderer, so every RNW-specific mapping this
work depends on — `aria-live`, `tabIndex`, `.focus()` resolution,
`aria-labelledby` precedence — was verified by hand-tracing the installed
package rather than by test. That is a real coverage gap on the primary
deployment target, and it is infrastructure beyond this gate.

## Open gates this does NOT close

- **Backup purge.** No automated purge, no documented window. Live-service
  deletion is immediate and complete; backups are a hosting-provider concern
  with no story yet. Stays on the launch-gate list.
- **Email confirmation.** Blocked behind the same SMTP gate as magic links.
- **Native export.** Phase 5.
- **`profiles_select_authenticated` broad read.** Phase 2 authorization matrix.
- Attorney review remains build-blocking (CLAUDE.md #7) and is untouched by this.

## Consequences

Good: the deletion right is now exercisable by the person it belongs to, through
a path whose privilege is bounded by a function that cannot be aimed. Export is
complete by construction and stays complete by test. Consent is legible,
including its history. The copy is defensible under scrutiny because it claims
less than the wireframe did.

Cost: one SECURITY DEFINER function is a privileged surface, however narrow, and
it must be re-reviewed whenever `auth` schema behaviour changes. The export runs
N queries client-side and will need pagination if a member's post count ever
grows large — acceptable now, not forever. And the copy is now *less* reassuring
than the wireframe imagined, which is the correct trade and should not be
quietly reversed.
