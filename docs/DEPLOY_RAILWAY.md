# Deploying the landing page to Railway

For the founder. This puts the **landing-only** build on `onerhythm.org`
(ADR 0023). The member platform is not in this build and cannot be reached
from it.

**Before you start:** the PR that adds `Dockerfile`, `deploy/Caddyfile` and
`railway.json` must be merged into `main`.

**What this session could not check:** your existing Railway project, what it
serves now, its variables, and your DNS. Railway's dashboard wording also
changes from time to time, so a button may have a slightly different name
from the one below. Where that happens, the goal of the step is what matters.

---

## 1. Connect the repository

1. Open the Railway project that served `onerhythm.org` before.
   - If it still has a service from the old deploy, note what it is. You can
     point that service at this repository (step 2), or make a new service
     and remove the old one once the new one works.
   - If there is no project, create one.
2. Add a service from GitHub and choose `daftpixie/onerhythm`.
   - Railway's GitHub app needs access to this repository. A private
     repository works, as long as the app has been granted it.
3. In the service settings, set the source branch to **`main`**.
   - Leave the root directory as the repository root.

## 2. Choose the builder

`railway.json` in the repository sets this for you:

- builder: **Dockerfile** (`Dockerfile` at the root);
- health check path: **`/healthz`**;
- restart on failure, up to 3 times.

Check that the service's build settings show the Dockerfile. If it shows
Nixpacks or Railpack, switch it to Dockerfile.

## 3. Set one variable, and nothing else

In the service's variables, set exactly:

| Name | Value |
|---|---|
| `EXPO_PUBLIC_SITE_MODE` | `landing` |

Then **delete every other variable** left from an earlier deploy, especially
anything named `EXPO_PUBLIC_SUPABASE_*`, or anything with a key or secret in
it. The landing build needs none of them.

- Do not set `PORT`. Railway sets it, and the server listens on it.
- If `EXPO_PUBLIC_SITE_MODE` is set to anything other than `landing`, the build
  stops on purpose with "Refusing to build". That is the safety catch, not a
  bug.

## 4. Deploy

Start a deploy (or push to `main`). Watch the build log. A good build ends
with the export ("Exported: dist"), then the image is built. The deploy is
healthy when `/healthz` answers.

If the build fails at "Refusing to ship: a Supabase address or key is in the
landing bundle", something put a Supabase value into the build. Remove the
variable and deploy again.

## 5. Attach the domain

1. In the service's networking settings, add the custom domain
   **`onerhythm.org`**.
2. Add **`www.onerhythm.org`** too.
3. For each one, Railway shows the DNS record it needs (its type, name and
   target). **Copy those values exactly from Railway into your DNS
   provider.** This runbook does not list them, because they come from your
   Railway service and only Railway knows them.
   - A bare domain (`onerhythm.org`, with no `www`) cannot use a plain CNAME
     at most DNS providers. Railway's instructions say what to do for yours
     (often a CNAME-flattening or ALIAS record).
   - Remove any old record for `onerhythm.org` or `www` that points at the
     earlier deploy, or the two will fight.
   - If your DNS is at Cloudflare with the orange-cloud proxy on, follow
     Railway's instructions for proxied domains. That setup was not tested
     here.
4. Wait for Railway to show the domain as active and the certificate as
   issued. DNS can take minutes or, rarely, hours.

## 6. Check HTTPS

```bash
curl -sSI https://onerhythm.org/ | head -20
curl -sSI https://www.onerhythm.org/ | head -5
curl -sSI http://onerhythm.org/ | head -5    # should end up on https
```

Expect `HTTP/2 200` (or `HTTP/1.1 200`) on the first two, and no certificate
error.

## 7. Post-deploy checklist

Do these in a normal browser window **and** a private one.

- [ ] **Crisis help is visible.** "🆘 Need help right now?" is at the top of
      `https://onerhythm.org/`. Tap it: the sheet opens with Call 911 (US),
      Call 988, Text 988 and the crisis resources link.
- [ ] **Member routes redirect.** Each of these ends on the home page, with
      crisis help still at the top:
      `/sign-in`, `/feed`, `/communities`, `/compose`, `/onboarding`,
      `/journey`, `/settings/consent`, `/moderation`, `/updates/confirm`,
      `/posts/anything`, `/no-such-page`.
- [ ] **These pages open:** `/privacy-notice`, `/contact`,
      `/help/other-countries`.
- [ ] **No sign-up form** anywhere. The home page shows a contact line with
      the email address instead.
- [ ] **No network calls except the site's own.** Open the browser's
      developer tools, Network tab, and reload. Every request should go to
      `onerhythm.org`. The fonts are files from `onerhythm.org/assets/…`;
      there is no call to Google Fonts, to Supabase, or to any analytics.
- [ ] **Headers are present:**

      ```bash
      curl -sSI https://onerhythm.org/ | grep -iE \
        "content-security-policy|strict-transport-security|x-content-type-options|referrer-policy|permissions-policy|cache-control"
      ```

      Expect all six. `cache-control` on the page is `no-cache`.
- [ ] **A missing file is a 404,** not the home page:
      `curl -s -o /dev/null -w '%{http_code}\n' https://onerhythm.org/_expo/static/js/web/missing.js`
      prints `404`.
- [ ] **The contact address receives mail.** Send a test message to the
      address on the page (`matthew@vt-infinite.com`, `CONTACT_EMAIL` in
      `src/lib/site.ts`). If nothing arrives, fix the mailbox before sharing
      the site.
- [ ] **The "Open source" link works for a stranger.** In a private window,
      tap it. Until the repository is public, a visitor sees a GitHub 404.
      **Make the repository public (`docs/RELEASE_FRESH_HISTORY.md`) before
      you share the URL.**
- [ ] **Before you share the URL: Railway's own logs.** Check what Railway's
      edge and HTTP logs record (visitor IP addresses, most likely) and how
      long it keeps them, and its terms on use of its own and on training.
      The server in the image writes no access log, but Railway's edge sits
      in front of it. Record the answer in the subprocessor inventory.
- [ ] **Before you share the URL: the mailbox.** Whoever hosts the contact
      address receives every message. That is Google Workspace, recorded in
      `docs/privacy/subprocessor-inventory.md`. Confirm the two open items
      there: its data processing terms accepted in the Admin console, and the
      mailbox's retention.
- [ ] **Preview deploys: turn them off.** If Railway deploys pull requests,
      those previews are public. The Dockerfile forces landing mode, so they
      can only ever be the landing page, but there is no reason to have them.

## 8. If something goes wrong

- **Roll back:** in the service's deployments list, redeploy the last good
  deployment.
- **Build stops with "Refusing to build":** `EXPO_PUBLIC_SITE_MODE` is not
  `landing`. Fix the variable.
- **The page is blank:** open the browser console. A Content-Security-Policy
  error means something new is loading from another origin; that change
  needs review before the policy is loosened.
- **The domain will not verify:** re-check the DNS record against the one
  Railway shows, character for character, and remove old records.

## What is not covered here

- **Turning the updates sign-up back on.** It needs a set-up hosted Supabase
  (drop the stray table, then `db push`), an email provider with SPF and DKIM,
  gap G1 closed, and a rate-limit layer in front of the sign-up path. See
  ADR 0023 decision 3.
- **The member platform.** Not deployable until counsel's review and the
  launch gates are met (`docs/PRODUCTION_READINESS.md`).
