# Plan — Privacy-rights UI (Addendum A B13 / B14)

**Branch:** `launch-gates` (worktree `/home/matt/code/onerhythm-launch`)
**Closes launch gate:** "privacy-rights UI (Addendum A B13/B14: download-my-data,
delete-account, consent management beyond the minimal withdraw surface)"
**Status:** awaiting approval. Nothing below is built yet.

---

## 0. What is already true (verified, not assumed)

Read before planning, so the plan rests on the schema rather than on the
wireframe's aspirations.

| Fact | Where | Consequence |
|---|---|---|
| `auth.users → profiles → 7 member tables`, every FK `on delete cascade` | `20260601084807_mvp_data_model.sql:31,80,139,229,250,277,305,331` | One `delete from auth.users` removes everything. Already proven by `supabase/tests/03_deletion_cascade_test.sql` (9 assertions). |
| `profiles_delete_self` policy exists | `:47` | A member can already delete their own **profile** via RLS, which cascades all seven tables — but leaves the `auth.users` row (their email) behind. Not sufficient for "delete my account". |
| No client can delete `auth.users` | Supabase auth schema | A privileged path is required. This is the one place a migration is unavoidable. |
| `profiles_select_authenticated ... using (true)` | `:40` | **RLS does NOT scope profile reads.** Any authenticated member can select every profile row. Same shape applies to `posts`/`comments`/`communities` for feed reads. |
| `consent_purpose` enum has exactly one value: `'health_self_id'` | `:25` | The wireframe's "Email notifications" consent row has **no backing data model**. |
| No `ballots` / `treasury_ledger` / `proposals` tables exist | `grep` over all migrations: zero hits | The wireframe's aggregate-transparency note currently describes **records that do not exist**. |
| Consent withdrawal purges tags via trigger | `:185-207` | B14's "turn off & remove my tags" is one `update`; the purge is already automatic and already tested. |
| No `supabase/functions/`, no SMTP, no job runner | repo | Export must be client-triggered; no email confirmation is possible. |
| No `expo-file-system` / `expo-sharing` in deps | `package.json` | There is no way to write a file on native. Export is web-only. |

---

## 1. Download my data (export)

### Format
A single JSON document. Versioned envelope so a future shape change is
detectable:

```json
{
  "format_version": 1,
  "exported_at": "2026-08-07T…Z",
  "member_id": "…",
  "notes": "…plain-language description of what is and isn't here…",
  "data": {
    "profile": {…},
    "consent_records": [...],
    "health_self_id_tags": [...],
    "memberships": [...],
    "posts": [...],
    "comments": [...],
    "upbeats": [...],
    "journey_entries": [...]
  }
}
```

Filename `onerhythm-my-data-YYYY-MM-DD.json`. JSON over CSV: the data is
relational and nested, and one file is easier for a 65+ member to keep than
eight.

### How it is generated and delivered
`src/lib/rights/export.ts` — pure functions over a `SupabaseClient`, matching the
existing `src/lib/consent.ts` pattern **specifically so the Node DB tests
exercise the real product code against the live stack**, not a mock.

- `collectMyData(client): Promise<ExportDocument>` — one select per table.
- `toDownloadFilename(date)`, `serialize(doc)` — pure, unit-testable.
- Delivery (web): `Blob` → `URL.createObjectURL` → synthetic anchor click →
  `revokeObjectURL`. No server round-trip, no temporary file, nothing stored.

**Native has no delivery target** and I am not adding a dependency inside a
launch-gate commit. On native the control renders as plain text: "You can
download your data on the OneRhythm website." Launch is web, so this closes the
gate for launch; it is recorded as an open item rather than hidden.

### Scoping — and an honest correction to the brief
The brief asks that the export be "scoped so a member can ONLY export their own
data (RLS-backed, proven)". Half of that is true and half is not, so the plan
says which is which:

- **RLS genuinely scopes** `consent_records` (`member_id = auth.uid()`),
  `health_self_ids` (self **and** current consent), and `memberships`.
- **RLS does NOT scope** `profiles` — `using (true)` for any authenticated
  member — and the feed-readable tables. For these, scoping comes from an
  explicit owner filter in the export query.

So the export is scoped by **explicit owner predicates on every table, with RLS
as a backstop where it applies**. Claiming "RLS-backed" alone would be false.
The DB test proves the outcome regardless of mechanism: a second account's rows
must be absent from the first account's export. That test is the real guarantee,
and it is written to fail if someone later drops a filter.

A `health_self_id` note: once consent is withdrawn, RLS makes the tags
unreadable, so they cannot appear in an export. That is correct — the data is
deleted by the purge trigger, not hidden — and the export says so in words
rather than silently omitting a key.

---

## 2. Delete my account (B13)

### Route
`app/settings/delete-account.tsx`, reached from `app/settings/consent.tsx`.

### The one required migration
`supabase/migrations/<fresh-timestamp>_delete_my_account.sql` — single file, as
instructed. Expect to rebase.

```sql
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant  execute on function public.delete_my_account() to authenticated;
```

Design notes, each deliberate:
- **No parameter.** The function can only ever delete `auth.uid()`. There is no
  argument to forge. This is the whole security model and it is why a definer
  function is safer here than handing a service-role key to anything.
- `set search_path = ''` matches the two existing definer functions.
- Deleting `auth.users` reuses the exact cascade already proven in pgTAP 03 — no
  new deletion logic, so nothing new can be forgotten.
- **No audit row.** CLAUDE.md wants privileged actions audited, but an audit
  trail keyed to a deleted member re-creates the identifier deletion was meant to
  remove, and `.claude/rules/db.md` forbids ledger immutability that conflicts
  with deletion rights. Recorded in the ADR as a deliberate conflict resolution,
  not an oversight. If an audit signal is wanted later it must be non-identifying
  (a date-bucketed count).

### The flow
1. Plain-language "what gets deleted" list, taken from the wireframe: account and
   sign-in; posts, comments, upbeats; journey pages; diagnosis/symptom self-ID
   tags; consent records.
2. **Export offered first**, inline, as the wireframe specifies — the same
   control as §1, not a link away.
3. Type `DELETE` to confirm. Visible persistent label (never placeholder-as-
   label), paste allowed, no time limit, `autoCapitalize="characters"`, plain
   error text in words.
4. The destructive control is **inert until the text matches exactly** —
   `disabled` plus `accessibilityState.disabled`, so it is announced as
   unavailable rather than merely looking grey.
5. On success: `supabase.auth.signOut()` → `router.replace("/")` → signed-out
   confirmation.

### Copy — what changes from the wireframe, and why
The wireframe promises two things this system cannot do. Per the brief, the copy
states what is true today.

| Wireframe says | Reality | Shipping copy |
|---|---|---|
| "Copies in our backups are removed within 30 days." | No backup-purge automation exists; there is no production database yet. | Cut. Replaced with: "Your data is removed from OneRhythm right away." No backup claim is made, because we cannot yet prove a window. Recorded as an open gate. |
| "We'll email you when it's fully done." | No SMTP. | Cut. Replaced with: "We can't email you a confirmation yet. When you're signed out, it's done." |
| "Voting/treasury records … kept in anonymized, aggregate form" | **No governance tables exist.** | Cut for now. Nothing of the member's persists, so a note claiming otherwise would be false in the other direction. Reinstated verbatim when governance ships. |

That last one is worth stating plainly: the honest gap here runs *opposite* to
the one the brief anticipated. The risk was over-promising deletion; the actual
risk was implying we retain something we don't.

---

## 3. Consent management (B14)

Extends `app/settings/consent.tsx`, which today shows status and a bare
turn-off.

- **Per-purpose status.** The enum has exactly one purpose, so the screen shows
  exactly one: Health self-identification. The wireframe's "Email notifications"
  row is **not built** — a toggle with no data model behind it is a control that
  lies. Added when the purpose exists.
- **Turn-off with tag-purge confirmation.** A confirmation step before
  withdrawal, matching the wireframe: "We'll delete your diagnosis/symptom tags…
  Your posts and account stay." Cancel is the safe default.
- **Versioned consent history.** Every `consent_records` row — including
  withdrawn ones — with purpose, `policy_version`, granted date and, where set,
  withdrawn date. This is the versioned-consent requirement made visible, and it
  is why withdrawal writes `withdrawn_at` rather than deleting the row.
- **Links to export and delete**, per the wireframe footer.
- Current tags shown when consent is on.

---

## 4. TDD list (red checkpoint first, committed failing, then green unmodified)

**DB (`tests/db/`, live stack — the real guarantees)**
1. Export contains only the requesting member's rows: two real accounts, each
   with posts/comments/upbeats/journey entries/consent/tags; account A's export
   contains zero of account B's rows. Proven at the DB layer.
2. Export enumerates every member-owned table. The test asserts the export's key
   set equals a checked-in constant list. **If a future migration adds a
   member-owned table and the export misses it, this is the test that notices** —
   it also cross-checks the list against the tables the cascade test covers, so
   the two cannot drift apart.
3. `delete_my_account()` removes the member's rows across all seven tables plus
   the `auth.users` row — extending the pgTAP 03 assertions rather than
   re-inventing them.
4. `delete_my_account()` cannot touch anyone else: called as A, B's data is
   untouched. Called unauthenticated, it raises.
5. Consent withdrawal purges health self-ID tags (the 1B trigger) **and** the
   history still shows the withdrawn record with its original `policy_version`.

**pgTAP** — extend `03_deletion_cascade_test.sql` (or add `05_`) for the
function's grants: `execute` revoked from `anon`, granted to `authenticated`.

**Component / screen (`tests/`)**
6. The destructive control is inert until the typed text matches exactly —
   including near-misses (`delete`, `DELETE `, `DELET`).
7. Typed confirmation → calls the RPC → signs out → routes to `/`.
8. Export control produces a document whose keys match the enumerated tables.
9. Consent history renders each record with its policy version, withdrawn rows
   included and marked.
10. Copy guard: the delete screen contains **no** "backup", "30 days", or
    "we'll email" claim, and no "donat*". A test, not a habit — this is exactly
    the copy that drifts back in.

**a11y (this is a destructive flow — the pattern the reviewer required on
journey delete)**
11. Confirmation announces politely (live region), not assertively.
12. Focus lands on the **safe** control (Cancel), never the destructive one.
13. Focus returns to the trigger on dismiss.
14. 44px targets throughout; visible focus ring.
15. Error text in words, associated with the field.
16. 🆘 reachable on every new screen.

---

## 5. a11y plan

Beyond the assertions above: heading order on both screens; the type-to-confirm
field keeps a visible persistent label; the destructive button carries
`accessibilityState.disabled` while inert so its unavailability is *announced*,
not just visual; the confirmation dialog traps focus and is dismissible by
keyboard; no colour-only signalling of the destructive state (Brand v3 retired
semantic colours anyway — the state is icon + text + weight); no time limits
anywhere in the flow.

Both screens go to the a11y-reviewer charged to falsify.

---

## 6. Reviewer gates (before commit)

- **privacy-reviewer**, charged to FALSIFY: "a member can export or delete only
  their own data, and deletion actually removes it." Plus: no health data beyond
  the member's own enters the export; copy makes no promise the system cannot
  keep. Given the finding in §1, the reviewer is told explicitly that RLS does
  *not* scope `profiles`, and asked to find any table where I relied on it anyway.
- **a11y-reviewer**, charged to FALSIFY that the destructive flow meets 2.2 AA.

Any FAIL resolved before committing.

---

## 7. Deliverables

- `docs/adr/0012-privacy-rights-ui.md` — export format and the real scoping
  mechanism; the definer-function deletion flow and why not service_role; the
  no-audit-row conflict resolution; the aggregate-transparency resolution
  (including that governance tables don't exist yet); and explicitly the
  **backup-purge** and **email-confirmation** gaps that remain open.
- `docs/SESSION_LOG.md` append.
- Updated launch-gate list: what this closed, what it did not.
- Commit: `feat: privacy-rights UI — data export, account deletion, consent management`
- **Do not merge to main.**

## 8. Concurrency

One migration, fresh timestamp, single file. Touches nothing on the landing-page
session's list: no `app/index.tsx`, no marketing routes, no `public/index.html`,
no `src/theme/tokens.ts` edits, nothing named `updates_subscribers`. New files
live under `app/settings/`, `src/lib/rights/`. `jest.config.js` is **not**
touched — that file currently holds the other session's temporary red-checkpoint
block, so the red checkpoint here will be committed via a scoped
`--testPathIgnorePatterns` on the command line instead of a config edit.

## 9. Open questions for the founder

1. **Backups.** Recommend saying nothing about backups until there is a
   production database and a documented purge window, rather than making an
   unverifiable claim. Alternative: state plainly that backups are held by our
   hosting provider and the purge window is not yet documented. Slightly more
   honest, slightly more alarming. My recommendation is the first; it is your
   call.
2. **Native export.** Web-only for launch (recommended), or add
   `expo-file-system` now?
