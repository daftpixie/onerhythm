# Analytics

OneRhythm uses a minimal, first-party analytics layer to understand whether the platform is helping people find community, education, and trust.

## Principles

- Privacy-preserving only
- No third-party tracking scripts
- No adtech identifiers
- No raw ECG data
- No free-text profile or story content
- No medical inference from analytics

Analytics exists to answer product questions like:

- Are people reaching the learning surfaces?
- Are people returning to the Heart Mosaic?
- Are people completing profile setup and contribution starts?
- Are support and source links actually being used?

## Stored fields

Each analytics event stores:

- `event_name`
- `path`
- `actor_scope`
  - `anonymous`
  - `authenticated`
  - `system`
- `visitor_id`
  - browser-local pseudonymous ID
- `session_id`
  - browser-session pseudonymous ID or authenticated session correlation where added server-side
- `request_id`
- `event_properties`
- `created_at`

## What is explicitly not stored

- raw uploads
- ECG-derived metrics
- profile free text
- story body text
- keystrokes
- cross-site tracking identifiers

## Event catalog

### `ecg_contribution_started`

Purpose:
- understand whether people are beginning the contribution flow

Captured from:
- API upload-session creation

Properties:
- `upload_format`
- `profile_present`
- `status`

### `ecg_contribution_completed`

Purpose:
- measure successful completion of the MVP contribution pipeline

Captured from:
- API upload processing success path

Properties:
- `upload_format`
- `profile_present`
- `status`

### `profile_completed`

Purpose:
- understand conversion from account creation into meaningful profile setup

Captured from:
- API profile creation

Properties:
- `profile_present`
- `status`

### `educational_content_viewed`

Purpose:
- measure initial use of profile-based educational guidance

Captured from:
- web educational page when profile-backed content is available

Properties:
- `surface`
- `visit_count`
- `profile_present`
- `content_kind`
- `status`

### `educational_content_returned`

Purpose:
- measure whether people come back to educational guidance

Captured from:
- web educational page on repeat visits

Properties:
- `surface`
- `visit_count`
- `profile_present`
- `content_kind`
- `status`

### `research_hub_viewed`

Purpose:
- measure top-level engagement with research translation

Captured from:
- web research hub page

Properties:
- `content_kind`

### `research_article_viewed`

Purpose:
- measure which research translations are actually being opened

Captured from:
- web research translation detail pages

Properties:
- `content_id`
- `content_kind`

### `community_story_submitted`

Purpose:
- understand whether people are comfortable sharing a story for review

Captured from:
- API story submission-for-review path

Properties:
- `status`

### `resource_link_clicked`

Purpose:
- understand whether educational pages are helping people reach outside resources and source material

Captured from:
- educational page resource links

Properties:
- `content_kind`
- `resource_kind`
- `source_reference_id`

### `homepage_cta_clicked`

Purpose:
- understand which entry paths resonate for first-time visitors

Captured from:
- homepage hero and homepage CTA cards

Properties:
- `cta_id`
- `surface`
- `destination_path`

### `heart_mosaic_viewed`

Purpose:
- measure first-time engagement with the public Heart Mosaic

Captured from:
- web Heart Mosaic component when rendered on public surfaces

Properties:
- `surface`
- `visit_count`
- `content_kind`
- `status`

### `heart_mosaic_returned`

Purpose:
- measure repeat engagement with the public Heart Mosaic

Captured from:
- web Heart Mosaic component on repeat visits

Properties:
- `surface`
- `visit_count`
- `content_kind`
- `status`

## Operational notes

- Analytics ingestion is rate-limited.
- The web client treats analytics as best-effort only.
- If analytics delivery fails, the user flow continues unchanged.
- Sensitive compliance actions still belong in audit events, not analytics.
