# Source Review Policy

This document defines how OneRhythm adds and maintains sources for educational, advocacy, and campaign content.

## Purpose

Sources should make public content more trustworthy and more understandable.

They should not be used as decorative authority signals.

## Allowed source classes

Current source classes:

- `peer_reviewed_study`
- `clinical_guideline`
- `institutional_reference`
- `founder_narrative`
- `internal`

Rules:

- classify sources honestly
- distinguish external evidence from OneRhythm’s own narrative
- do not present founder narrative as clinical evidence
- do not surface internal source material as public evidence

For the launch educational corpus:

- external evidence must come first
- OneRhythm docs must not be the main evidence base
- founder narrative must stay out of API educational retrieval

## Minimum source metadata

Each source should include, where verified:

- title
- source name
- source URL
- source document id
- classification
- publisher kind
- language
- publish date
- updated date
- reviewed date
- reviewer reference
- review state
- citation label
- topic tags
- usage scope

Optional only if verified:

- DOI
- PMID
- guideline body

If a field is not verified, leave it blank.

## Provenance rules

Every content entry should attach sources through `source_links`.

Educational retrieval content in the API should also keep provenance fields current in:

- [apps/api/app/content/approved_sources.json](../../apps/api/app/content/approved_sources.json)

Launch educational corpus expectations are defined in:

- [Educational evidence corpus](educational-evidence-corpus.md)

Public content should never rely on undocumented or hidden source context.

## Review policy

Review sources when:

- a new source is added
- an educational or research article is updated
- monthly source review is performed
- a source becomes stale, unavailable, or questionable

Check for:

- factual citation metadata
- correct classification
- working source URL or canonical path
- clear relationship between the source and the page claim
- no exaggerated interpretation

## Medical-adjacent claim safety

When a source supports medical-adjacent content, maintainers must keep the page within OneRhythm’s boundary.

Rules:

- translate, do not prescribe
- explain, do not diagnose
- contextualize uncertainty
- do not use a source to justify treatment advice
- do not imply that an institutional source makes the platform clinical
- do not swap in internal product docs when an external reviewed source is required

## Stale or weak sources

If a source is stale, weak, or no longer supports the page:

1. remove or revise the affected claim
2. update the source metadata
3. update `updated_date`
4. if the page can no longer be supported safely, move it out of `published`

For API educational retrieval, stale content should fail closed rather than inventing fallback guidance.

## Founder narrative handling

Founder narrative is valid and important, but it must be labeled clearly as:

- lived origin
- campaign framing
- public narrative context

It must not be framed as peer-reviewed evidence.

## Maintainer checklist

Before merging a source-related change, confirm:

- citation metadata is verified
- source classification is accurate
- provenance is visible in the page or response metadata
- the page still reads clearly for non-technical users
- no unsupported medical claim slipped in

Related docs:

- [Evidence and provenance](../architecture/evidence-provenance.md)
- [Editorial workflow](editorial-workflow.md)
- [Tone and style guide](tone-and-style-guide.md)
