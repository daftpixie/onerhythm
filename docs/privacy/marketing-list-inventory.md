# Data inventory — the pre-launch updates list

Scope: `public.updates_subscribers` **only**.

This is not the platform-wide data inventory that PRD Amendment 1 §8.x requires.
That is a larger job covering every member-facing field and it is not started
here. This document exists because §8.x says no field exists without a purpose
binding, and this session added fields.

Decision record: [ADR 0011](../adr/0011-landing-and-updates-list.md).
Migration: `supabase/migrations/20260806134500_updates_subscribers.sql`.

---

## What this data is, and what it is not

An address on this list belongs to someone who asked to hear about a project.
It is an **ordinary marketing contact**. It is not consumer health data, because
nothing about the person's health is collected, asked for, or inferrable from
it.

A **member's** email is different: it is bound to opt-in health self-ID through
the consent ledger, which makes it consumer health data under Washington MHMDA
and special-category data under GDPR. Joining the two lists would take an
ordinary marketing contact and turn it into a health-adjacent record that
neither person consented to.

So the two are separate systems of record, permanently. The same address
appearing in both is a coincidence this system must never resolve. Enforcement
is mechanical, not aspirational — see ADR 0011 for the four mechanisms.

---

## Field-level purpose binding

| Field | Purpose | Legal basis | Retention |
|---|---|---|---|
| `email` | The only way to send the updates the person asked for | Consent (double opt-in; `confirmed_at`) | Until unsubscribe or a deletion request |
| `created_at` | Distinguish an old signup from a new one; evidence of when consent was given | Legitimate interest (record-keeping) | With the row |
| `source` | Which surface the form was on (`landing`). Product provenance only — never a campaign or ad identifier, never anything about the person | Legitimate interest (product) | With the row |
| `confirmed_at` | Proof of double opt-in. **NULL means not subscribed**; a NULL row may never be mailed | Consent | With the row |
| `unsubscribed_at` | Suppression. The row is kept so a later signup cannot silently restart mail to an address that opted out | Legal obligation (CAN-SPAM) | With the row |
| `confirm_token` | Completes double opt-in from a link, with no login | Consent | With the row |
| `unsubscribe_token` | Leaves the list from a link, with no login | Legal obligation (CAN-SPAM) | With the row |

No other field exists. No name, no location, no device or browser data, no IP
address, no health information — and there is nowhere on the form to supply
any of it. The functions that write these rows deliberately never read
`auth.uid()`, a JWT claim, an IP, or a user agent, so a signed-in member who
confirms their own subscription leaves no trace linking the two identities.

---

## Rights

- **Withdraw / unsubscribe.** A token link, no login required, idempotent.
  Works from day one.
- **Deletion.** By request (reply to any email). Done by hand and confirmed.
  There is **no scheduled purge of unconfirmed rows** — no scheduler exists in
  this project yet. The privacy notice says so rather than promising a cleanup
  we have not built. Adding one is an ADR 0011 follow-up.
- **Access.** By request. The list holds one field about the person, so the
  answer is their own address plus the dates above.
- **No sale, no sharing.** There is no sharing surface to consent to, and that
  absence is itself the record.

---

## Subprocessors

No new subprocessor was added by this work. The list lives in the same Postgres
database as everything else.

| Subprocessor | What it touches | Purpose | Review status |
|---|---|---|---|
| Supabase | The row at rest | Database, hosting | Pre-existing |
| Cloudflare | The page in transit | Web hosting / CDN | Pre-existing at the time. **Superseded:** the web host is now Railway (ADR 0023); see `subprocessor-inventory.md` |
| Google Workspace (`matthew@vt-infinite.com`) | A copy of the marketing fields in a private Google Sheet | Founder visibility into the list | **Added by ADR 0011.** One-way (database → sheet), full-refresh overwrite, marketing fields only. The sheet must NOT be link-shared publicly. |
| *(none yet)* — email delivery | Would touch the address to send mail | Sending the confirmation and updates | **Not chosen.** No mail is sent until this is decided under the §8.x review gate. |

The same Google Workspace account also hosts the public contact mailbox
(`matthew@vt-infinite.com`). That use is recorded in
[`subprocessor-inventory.md`](subprocessor-inventory.md); it is separate from
the Sheet, and neither touches member data.

Running the mirror: `npm run sync:subscribers`, configured per
`.env.ops.example`. It is a local, on-demand script by design — not a cron, not
a webhook, not a server — so the copy only exists when the founder asks for it.

The mirror is a read-only view of a system of record that stays in Postgres.
Because it is a full-refresh overwrite and never an append, a row deleted or
unsubscribed in the database disappears from — or is corrected in — the sheet on
the next sync. An append-only mirror would have become an undeletable shadow
copy that defeats both unsubscribe and the right to deletion; that is why the
overwrite rule is binding rather than a preference.

---

## Known gaps

- **No rate limiting** on `subscribe_to_updates`. There is no enumeration risk
  (the function is silent about duplicates), but the table can be stuffed with
  junk addresses. A per-IP limit needs an Edge Function or a Cloudflare rule,
  neither of which exists yet.
- **No automatic purge** of unconfirmed rows, as above.
- **No email delivery**, so nothing has been sent to anyone on this list.
