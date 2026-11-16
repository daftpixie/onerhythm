# Security policy

## Reporting a vulnerability

Please report privately first, before any public disclosure.

**First choice: GitHub's private vulnerability reporting.** On this
repository, open the **Security** tab and choose **Report a vulnerability**
if that option is available. It keeps the whole exchange private and in one
place. If no reporting button appears, use the email channel below; enabling
private reporting is a repository setting, not something this file turns on.

**If you can't use GitHub:** email **matthew@vt-infinite.com**. Please put
"Security" in the subject line, and don't send the details of an unfixed
problem anywhere public.

Please include enough to reproduce it: what you did, what you expected, what
happened instead. A proof-of-concept helps. If you are unsure whether something
counts, send it anyway — a false alarm costs an email, and the other kind of
mistake costs a lot more.

You should get an acknowledgement within a few days. This is a small project run
by one person, so please allow a reasonable window to fix an issue before
disclosing it publicly. We will tell you honestly if a fix is going to take a
while, and why.

## Never include real patient data

**Do not send real patient data, health information, or identifiable member data
in a report — not even as evidence, not even redacted.**

Use synthetic data to demonstrate an issue. If a bug can only be shown with real
data, describe it in words and we will work out a safe way to reproduce it
together.

This matters more here than in most projects: disclosing health data to a third
party can itself be a reportable breach under the FTC Health Breach Notification
Rule. A well-intentioned bug report containing someone's information would create
the exact harm the report is trying to prevent.

## What this system holds, and does not

Knowing the blast radius helps you assess severity:

**Stored:** account and sign-in, role, self-identified diagnosis and symptom tags
(opt-in and separately consented), member-authored content, upbeats, journey
pages, consent records, and a marketing-only email list kept deliberately
separate from all of the above.

**Moderation records** (ADR 0019; built, and so far only in local and test
databases — the hosted database is not set up). These are member-linked, and
the free text in them is treated as health data:

- reports, with an optional note (purged when the item closes);
- moderation items, including open crisis items that point at a post
  (a closed crisis item is cleared down to a count);
- moderation actions and their reasons;
- removed content: the title and body of a removed post, kept for its author;
- appeals, second-look requests and floor re-examination requests, each with
  a statement in the member's own words;
- blocks between members, and bans;
- moderator grants, and the map from a moderator's pseudonym to the member;
- legal holds.

Retention periods for these are not set yet (launch gate G9): the
migrations ship with them NULL and fail closed, and they are set with counsel
before launch.

**Never stored:** any clinical data. No ECGs, no monitor output, no records, no
labs, no medical imagery. We do not believe this is a HIPAA-covered system,
and it is designed to hold nothing that would make it one; counsel has not yet
reviewed that (launch gate G6). Document, PDF and video uploads are blocked permanently,
because medical records live in documents.

So: there is no clinical dataset here to exfiltrate. The things genuinely worth
protecting are the **link between an account and its health self-ID tags**, the
**consent ledger**, and the **separation between the marketing list and member
data**. So are the **moderation records** above: the free text in reports,
appeals and removed content; the links between a member, their content and a
report, appeal or crisis item; and the **pseudonym-to-member map**, which is
held apart on purpose. Findings that break any of these should be considered
high severity even if they look minor in isolation.

## Especially interested in

- Row Level Security bypasses, or any path that reads another member's data.
- Anything that correlates the updates-list email addresses with member accounts.
  These are kept apart on purpose and there is no foreign key between them.
- Enumeration oracles on the signup endpoint — anything that reveals whether a
  given address is already on the list.
- Ways to reach a `SECURITY DEFINER` function with unintended privileges.
- RLS bypasses on the moderation tables, any path that exposes a crisis item,
  or anything that links a moderator's pseudonym to their account.
- Any third-party request originating from a health or authenticated page.
- Leaked secrets in the repository or in build output. The client bundle should
  only ever contain the publishable key.

## Out of scope

Reports from automated scanners with no demonstrated impact; missing headers with
no exploit path; and anything requiring a compromised device or a
person-in-the-middle on the victim's own network.

There is no paid bug bounty. OneRhythm is a pre-launch initiative of VT Infinite,
Inc. with no funding set aside for one, and pretending otherwise would be
dishonest. Credit in the release notes and our genuine thanks are what we can
offer, and we will happily say so publicly if you would like that.

## The public web build

Today only the landing page is deployed, built with
`EXPO_PUBLIC_SITE_MODE=landing` (ADR 0023). It has no database connection, no
form and no cookies. Reports about it are welcome too: a route that should
redirect and doesn't, or a request to another origin.
