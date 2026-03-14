# Editorial Workflow

This document defines the lightweight editorial workflow for launch.

## Principles

- Keep the process explicit and reviewable.
- Lead with data, land with humanity.
- Preserve the educational-only boundary.
- Prefer small updates over hidden bulk rewrites.

## Content lanes

There are two content lanes:

1. Static public content
   Files in [apps/web/content](../../apps/web/content)
2. Personalized educational retrieval content
   Files in [apps/api/app/content/approved_sources.json](../../apps/api/app/content/approved_sources.json)

Do not mix them casually. Public editorial content and personalized API guidance have different runtime paths and review sensitivities.

## Add a new article or educational module

1. Decide the content kind.
2. Draft the content in [apps/web/content/entries.ts](../../apps/web/content/entries.ts).
3. Add or update author metadata in [apps/web/content/authors.ts](../../apps/web/content/authors.ts).
4. Add or update source records in [apps/web/content/sources.ts](../../apps/web/content/sources.ts).
5. If the page is educational:
   - set `educational_surface=true`
   - set `disclaimer_required=true`
   - verify the copy is non-diagnostic
6. If the page is a research translation, include structured research fields.
7. Check route rendering locally.
8. Run typecheck.

## Attach sources and provenance

For every public content page:

1. Add a source record with the correct classification.
2. Verify citation metadata before adding it.
3. Link the source from the entry with `source_links`.
4. Add a short `relevance_note` only when it helps the reader understand why the source is attached.

Use [docs/content/source-review-policy.md](source-review-policy.md) for detailed rules.

## Update old content

When updating existing content:

1. Change `updated_date`.
2. Review whether `review_state` is still accurate.
3. Re-check every linked source for freshness and correctness.
4. Update any stale or unsafe wording.
5. If the update changes medical-adjacent meaning, treat it as high review sensitivity.

## Medical-adjacent safety review

Any change touching symptoms, conditions, research interpretation, support resources, or clinical language must be reviewed for:

- accidental diagnosis language
- implied treatment advice
- false certainty
- unsupported risk framing
- missing disclaimer behavior

Unsafe examples:

- “your ECG shows”
- “we detected”
- “this means you have”
- “you should start/stop”

Safe patterns:

- “this page explains”
- “some people describe”
- “public sources suggest”
- “questions to bring to your doctor”

## Monthly maintenance rhythm

For launch, a simple monthly cycle is enough:

1. Review public educational and research pages.
2. Review [apps/api/app/content/approved_sources.json](../../apps/api/app/content/approved_sources.json).
3. Update source metadata, review dates, and stale copy as needed.
4. Re-run the ingestion path if API retrieval content changed.
5. Confirm the disclaimer and provenance still render correctly.

## Review expectations for pull requests

Every content PR should make it easy for another maintainer to answer:

- what changed
- why it changed
- which sources support it
- whether the disclaimer behavior changed
- whether the change affects static pages, API retrieval content, or both

Related docs:

- [Content model](content-model.md)
- [Source review policy](source-review-policy.md)
- [Tone and style guide](tone-and-style-guide.md)
