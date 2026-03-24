# Publishing System

## Purpose

This document defines the bounded publishing system for OneRhythm long-form writing.

The goal is to let OneRhythm publish serious, shareable, brand-aligned writing without introducing a CMS rewrite or a second visual system.

This system is designed for:

- homepage editorial visibility
- dedicated on-platform reading pages
- structured social atomization
- render-ready branded document output through print/export-safe article pages

## Canonical Content Sources

Canonical long-form entries live in the file-based content registry:

- `apps/web/content/articles/living-inside-the-numbers.ts`
- `apps/web/content/articles/open-letter-to-electrophysiology-leaders.ts`

Those entries are mounted into:

- `apps/web/content/entries.ts`

Shared provenance and author metadata live in:

- `apps/web/content/sources.ts`
- `apps/web/content/authors.ts`

Shared typing lives in:

- `packages/types/src/contracts/content.ts`

Rule:

- homepage teaser data
- long-form page copy
- social share atoms
- metadata / OG fields
- document print/export settings

must all come from the canonical article entry, not from UI components.

## Homepage Presentation Model

Homepage editorial stories are rendered from published `essay` entries that include `article.homepage_feature`.

Current homepage implementation:

- `apps/web/components/home/articles-section.tsx`

Homepage rules:

- do not render these stories as a generic blog list
- surface only the most useful scanning fields:
  - type label
  - reading time
  - title
  - purpose
  - short summary
  - one pull quote or stat accent
  - one clear CTA
- maintain distinction between the institutional piece and the evidence-grounded essay
- treat homepage as the invitation layer, not the full reading layer

## Dedicated Article Page Model

Dedicated article pages are served through:

- `apps/web/app/stories/[slug]/page.tsx`

Long-form entries that include `entry.article` render through:

- `apps/web/components/longform-article-page.tsx`

This page model includes:

- branded hero with wordmark
- headline + dek + author metadata
- persistent disclaimer when required
- crisis support card when high-sensitivity content requires it
- scannable sections
- inline pull quotes
- stat callouts where appropriate
- on-page section navigation
- reviewed source section
- share toolkit
- print/export-ready document mode

Fallback rule:

- generic essays without `entry.article` continue using the older `ContentPage` pattern

## Social Atomization Model

Every canonical article entry includes a structured `article.share` object.

Required fields:

- `meta_description`
- `og_title`
- `og_description`
- `og_alt`
- `og_image_path`
- `x_post_starter`
- `x_thread`
- `reddit_post`
- `reddit_tldr`
- `linkedin_post`
- `share_captions`
- `pull_quotes`
- `image_card_snippets`
- `short_version`
- `medium_version`
- `long_version`

Current reusable UI:

- `apps/web/components/longform/article-share-toolkit.tsx`

Platform guidance:

- X: use `x_post_starter` for single-post sharing and `x_thread` for multi-post expansion
- Reddit: use `reddit_post` or `reddit_tldr`, depending on depth and sensitivity
- LinkedIn: use `linkedin_post` with article URL and 1.91:1 preview image
- Threads / Instagram-compatible visuals: use `share_captions` and `image_card_snippets`

Rule:

- social atoms belong to the content entry, not to page components

## Metadata And OG Strategy

Metadata is generated through:

- `apps/web/lib/metadata.ts`

Long-form article entries can override:

- OG title
- OG description
- OG alt text
- OG image path
- Twitter image path

Current article images:

- `/brand/og/og-article-invisible-bears-1200x630.png`
- `/brand/og/og-article-broken-heart-1200x630.png`

Rules:

- use `summary_large_image` behavior for X/Twitter previews
- keep titles concise
- keep descriptions human and authoritative
- never let the OG copy imply diagnosis or ECG interpretation

## Structured Data / SEO Notes

Long-form article pages emit article structured data via:

- `apps/web/components/structured-data.tsx`
- `apps/web/components/longform-article-page.tsx`

Current structured data includes:

- headline
- description
- publication date
- modification date
- canonical URL
- image
- authors
- publisher
- related sources

SEO rules:

- use the canonical story URL, not the source PDF path
- keep `seo.title` page-readable
- let `article.share.meta_description` drive the social/metadata description when present
- preserve route-role distinction: homepage invites, article page holds, ResearchPulse translates

## Brand Alignment Rules

Long-form publishing must preserve Brand v3 principles:

- dark-first surface language
- Exo 2 for display only
- DM Sans for body/UI
- Space Mono for labels, metadata, and utility text
- restrained glow
- layered dark surfaces rather than white paper aesthetics
- wordmark usage through canonical brand assets in `apps/web/public/brand/logos/`

Document mode rules:

- branded wordmark present
- export/print layout still reads clearly when saved to PDF
- no decorative sci-fi overload
- readability outranks flourish

## Compliance And Disclaimer Rules

Educational and medical-adjacent writing must preserve:

- non-diagnostic posture
- explicit boundary language
- persistent disclaimer when `disclaimer_required` is true
- crisis support when suicidality or self-harm discussion appears

Current shared disclaimer source:

- `apps/web/content/partials/disclaimers.ts`

Current UI surfaces:

- `packages/ui/src/components/medical-disclaimer.tsx`
- `apps/web/components/longform/crisis-resources-card.tsx`

Forbidden moves:

- implying personal ECG interpretation
- implying diagnostic confidence
- implying treatment recommendation
- using social share copy that sensationalizes pain

## Known Follow-On Improvements

- Add first-class external source entries for every cohort statistic currently governed through editorial strategy rather than a dedicated source record.
- Add article-specific analytics dashboards once story-view events are flowing.
- Add dedicated OG image generation routes if per-article art variations become necessary beyond the current static branded assets.
- Add optional print-only cover/title pages if long-form publishing expands beyond the first two essays.
- Add richer source grouping by claim cluster if future essays become more citation-dense.
