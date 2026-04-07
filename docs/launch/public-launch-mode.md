# Public Launch Mode

This note documents the temporary launch surface for `launch.onerhythm.org` and the reversible gating used for the main public site.

## How it works

- The public launch page lives at the app route `/launch`.
- Requests for `launch.onerhythm.org/` are rewritten internally to `/launch`, so the launch host serves the landing page at its root.
- Non-root browser routes on the launch host redirect back to `https://launch.onerhythm.org/`.
- When launch mode is enabled, non-asset browser routes on the main site redirect to the launch URL.
- API routes, framework internals, health checks, and static asset downloads continue to work.

## Env vars

Set these in the web runtime:

- `NEXT_PUBLIC_LAUNCH_MODE=true|false`
  - `true`: redirect the main public site to the launch URL
  - `false`: keep the launch page available, but stop gating the main site
- `NEXT_PUBLIC_LAUNCH_URL=https://launch.onerhythm.org`
  - canonical launch destination used by middleware and page metadata
- `NEXT_PUBLIC_LAUNCH_HOST=launch.onerhythm.org`
  - host that should serve the launch page at `/`

## Public launch assets

Approved public launch files are copied into a controlled web-facing directory:

- `apps/web/public/launch/pdfs/`
- `apps/web/public/launch/logos/`
- `apps/web/public/launch/images/`

The launch page only links to assets from that tree. Internal docs in `docs/` are not exposed directly.

## Disable later

To remove the temporary gate and restore the normal public site:

1. Set `NEXT_PUBLIC_LAUNCH_MODE=false`.
2. Redeploy the web app.
3. Leave `NEXT_PUBLIC_LAUNCH_URL` and `NEXT_PUBLIC_LAUNCH_HOST` in place if you still want `launch.onerhythm.org` to serve the launch page.

If the dedicated launch host is no longer needed, remove the host mapping at the platform/DNS layer after the web deploy.
