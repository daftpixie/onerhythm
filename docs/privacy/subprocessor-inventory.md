# Subprocessor inventory

Every outside service that handles data for OneRhythm is listed here, with
what it touches and what is still unconfirmed.

`.claude/rules/privacy.md` sets the bar. An **infrastructure processor**
(hosting, database, email, captions, telephony) needs all of these before
member data flows through it:

- a written contract;
- no use of the data for its own purposes;
- no training on member content;
- a stated retention period;
- an entry here.

An **AI provider** needs all of that, plus everything ADR 0017 Decision 4
requires. No AI provider is used today.

The updates list has its own inventory, with field-level detail:
[`marketing-list-inventory.md`](marketing-list-inventory.md).

**Today (4 November 2026):** only the landing page is deployed (ADR 0023). It
has no form and no database connection, and it collects no health data. No
member data exists outside local and test databases.

---

## Google Workspace — the contact mailbox

| | |
|---|---|
| **What it touches** | Every message sent to the public contact address, `matthew@vt-infinite.com`: the sender's address, the subject and the text. Security reports sent by email arrive here too (`SECURITY.md`). |
| **Why** | The landing page's contact line and `SECURITY.md`'s email fallback point to this address (founder decision, 4 November 2026). |
| **Health data?** | Not asked for. The contact line and the privacy notice ask people to leave out health details. Someone may include them anyway, so a message is treated with the same care as health data: never forwarded to a third party, never used for anything but replying. |
| **Processor type** | Infrastructure processor (email). |
| **Contract** | **Not confirmed.** TODO(founder): confirm that Google Workspace's data processing terms are accepted in the Admin console, and record the date here. |
| **Use of its own, training** | To be read from the accepted terms once confirmed. Not stated here until then. |
| **Retention** | **Not set.** TODO(founder): decide how long messages in this mailbox are kept, and record it here. |
| **Also used for** | A private Google Sheet copy of the updates-list fields (ADR 0011; see `marketing-list-inventory.md`). Separate from the mailbox. |
| **Status** | Named and in use for the contact address. Two items open for the founder, above. |

## Railway — web hosting

| | |
|---|---|
| **What it touches** | The landing page in transit, and each visitor's IP address in its edge and HTTP logs. |
| **Why** | It hosts the landing build (ADR 0023). |
| **Health data?** | None today. The landing build has no form and no database connection. |
| **Processor type** | Infrastructure processor (hosting). |
| **Contract, use of its own, training, retention** | **Not verified.** `docs/DEPLOY_RAILWAY.md` §7 asks the founder to check what Railway's logs record, how long they are kept, and its terms, and to record the answers here before the URL is shared. |
| **Status** | In use for the landing page only. Must meet the full bar before any member data flows through it. |

## Supabase — database, sign-in, storage

| | |
|---|---|
| **What it would touch** | All member data, once the member platform opens. |
| **Status** | **Not set up for OneRhythm.** The hosted project holds at least one stray table and no migration history (`docs/PRODUCTION_READINESS.md` 1.4 and 1.5). Nothing is sent to it. Must meet the full bar before it holds member data. |

## Not chosen

- **Email delivery** (confirmation and update emails). Nothing is sent.
- **Live captions, telephony, AI providers.** None used.
