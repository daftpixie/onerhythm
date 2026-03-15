## Brand Assets

This directory is the canonical home for public-facing brand images used by the web app.

Use these paths:

- `apps/web/public/brand/logos/`
  - product logos
  - wordmarks
  - icon marks
- `apps/web/public/brand/og/`
  - Open Graph images
  - social share previews
  - fallback campaign preview images
- `apps/web/public/brand/readme/`
  - GitHub README and repository-profile images
  - architecture diagrams shown in public docs
  - non-runtime branding assets that still need a stable, versioned path

Conventions:

- Keep filenames stable once referenced in metadata.
- Prefer SVG for logos when possible.
- Use web-optimized PNG or JPG for large social preview images when SVG is not appropriate.
- Keep README images optimized for GitHub rendering and repository clones.
- Do not store private source files or editable design files here.

Preferred usage:

- `onerhythm-full-white.svg`
  - default wordmark for dark product surfaces
  - public header, footer, and hero brand moments
- `onerhythm-full-gradient-800.png`
  - gradient wordmark for branded dark surfaces when a stronger signature moment is desired
  - currently used in the public header and footer
- `onerhythm-full-dark.svg`
  - use only on light backgrounds
- `onerhythm-mark-white.svg`
  - mark-only usage on dark or layered backgrounds
  - app icon moments or compact navigation contexts
- `onerhythm-mark-transparent.svg`
  - use when the mark needs to sit directly on artwork or non-solid backgrounds
- `favicon.svg`, `favicon-32.png`, `favicon-180.png`
  - browser and app icon metadata
- `brand/og/og-default-1200x630.png`
  - default site-wide Open Graph image
- `brand/og/og-twitter-1200x628.png`
  - default large-card Twitter preview
- `brand/og/og-article-invisible-bears-1200x630.png`
  - share image for invisible-burden campaign or article moments
- `brand/og/og-article-broken-heart-1200x630.png`
  - share image for emotional-burden or founder-context article moments
- `brand/og/og-campaign-anxiety-1200x630.png`
  - share image for anxiety-burden framing
- `brand/og/og-campaign-depression-1200x630.png`
  - share image for depression-burden framing
- `brand/og/og-campaign-icd-ptsd-1200x630.png`
  - share image for ICD/PTSD burden framing
- `brand/og/og-campaign-suicidality-1200x630.png`
  - high-sensitivity share image for suicidality-burden framing

Current default share image:

- `/brand/og/og-default-1200x630.png`
