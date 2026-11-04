# send-confirmation-email

The one message that makes double opt-in possible. **Ships disabled and is not
deployed.** With no configuration it returns `503 not_configured` and sends
nothing.

## Why it is disabled

The landing page tells people plainly:

> Nothing is sent yet: we haven't set up our mail system, so no email has gone
> out and none is on its way.

That sentence is true today and must stay true until mail genuinely works.
Deploying this function is what makes it false, so deployment is a deliberate
step with copy changes attached — not something that happens by merging code.

## The env contract

Set as **Edge Function secrets**, never anywhere else:

| Secret | Example shape | What it is |
|---|---|---|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxxxxxxxxx` | Provider API key. Resend-class. |
| `MAIL_FROM` | `OneRhythm <sender@your-verified-domain>` | Must be on a domain with SPF+DKIM verified at the provider, or mail lands in spam. No sending address is chosen yet. It is not the public contact address (`CONTACT_EMAIL` in `src/lib/site.ts`, `matthew@vt-infinite.com`), which is a person's mailbox on another domain. |
| `SITE_URL` | `https://onerhythm.org` | Used to build the confirm link. No trailing slash needed. |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected by the platform; do
not set them yourself.

```bash
npx supabase secrets set RESEND_API_KEY=…
npx supabase secrets set MAIL_FROM='OneRhythm <sender@your-verified-domain>'
npx supabase secrets set SITE_URL=https://onerhythm.org
npx supabase functions deploy send-confirmation-email
```

### Never do this

- **Never** put the key in `.env`, `app.json`, or any `EXPO_PUBLIC_*` variable.
  Anything prefixed `EXPO_PUBLIC_` is compiled into the JavaScript every visitor
  downloads. A mail key there lets anyone on the internet send mail as
  onerhythm.org.
- **Never** commit it. `.claude/hooks/secrets-pii-scan.sh` blocks Resend,
  SendGrid and Mailgun key shapes and bare SMTP passwords — added in this change,
  because it previously caught none of them. Documentation placeholders
  containing `example`, `<…>`, `xxxx` or `${…}` are deliberately allowed through
  so this file can exist.

## What it will not do, by design

- Never accepts a destination address from the caller. That would be an open
  relay. The address is looked up server-side from the token.
- Never reports whether a token was valid — always `202`. Same anti-enumeration
  reasoning as `subscribe_to_updates`.
- Only mails rows where `confirmed_at is null` **and** `unsubscribed_at is null`.
  Re-sending to a confirmed address is unsolicited mail; sending to an
  unsubscribed one breaks the suppression promise.
- Records nothing about the caller — no IP, no user agent, no auth context. A log
  line linking a subscriber to a member would breach the marketing boundary
  (ADR 0011) just as surely as a SQL join.
- Logs provider failures by **status only**, never the response body, which can
  echo the destination address.
- Sends **no health content**. Nothing about arrhythmia, diagnosis or symptoms.
  Mailing that to an unconfirmed address would disclose health-adjacent data to
  someone who never asked for it.

## Who calls it

Nothing yet. The intended caller is the signup path, after
`subscribe_to_updates` succeeds. It is not wired up because wiring it to a
function that returns 503 would mean showing a failure to a member for a step
that is not their problem — and because the RPC deliberately returns `void`, so
the client does not hold the token and cannot pass it. Closing that loop is a
database-trigger or a scheduled-sweep decision that belongs with the deployment,
not before it. Recorded in `docs/PRODUCTION_READINESS.md`.

## Not covered by `npm run typecheck`

`index.ts` runs on Deno, not under the app's tsconfig, and is excluded from it.
Deno globals (`Deno.env`, `Deno.serve`) are not in the Expo program, so it is
excluded rather than pretended to typecheck. There are no automated tests for it
either: the code paths that matter are "no config → 503" and "no eligible row →
202", and exercising the rest means either a real provider call or a mock of the
provider that proves only that the mock was called. Stated plainly rather than
covered by a test that would assert nothing.
