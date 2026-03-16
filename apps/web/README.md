# `apps/web`

Next.js application workspace with TypeScript and Tailwind CSS.

Current public entrypoints include:

- `/` mission-led landing page with the waitlist, referral confirmation state, and
  live mission counter wiring
- `/join?ref=...` referral redirect that preserves founding-member referral codes
- `/api/waitlist` proxy route for public waitlist signup
- `/api/waitlist/referral/[code]` proxy route for referral-count refresh in the
  confirmation state
- `/api/landing/metrics` combined waitlist and rhythm counter payload for the landing page

## Commands

```bash
pnpm --filter @onerhythm/web run dev
pnpm --filter @onerhythm/web run build
pnpm --filter @onerhythm/web run test
```
