# Research Pulse Editorial Workflow

This document defines the lightweight maintainer workflow for Research Pulse.

It is designed for launch reality:

- small maintainer team
- OSS-friendly operations
- automated ingestion and summarization
- human publication review before anything becomes public

Research Pulse is not a general newsroom. It is a reviewed educational feed for newly published peer-reviewed electrophysiology and arrhythmia research.

## Purpose

Research Pulse exists to:

- surface newly published peer-reviewed research
- translate it into calm, human language
- preserve source provenance for every public claim
- keep OneRhythm inside its educational-only boundary

It does not exist to:

- cover every cardiology paper
- publish breaking-news reactions
- mirror copyrighted articles
- offer treatment advice
- collapse automated summaries and reviewed editorial judgment into the same thing

## Roles

Launch can operate with one or two maintainers, but the responsibilities should still be named clearly.

- `source reviewer`
  Verifies that the paper is eligible, correctly identified, and supported by public metadata or reusable OA content.
- `content reviewer`
  Checks the generated summary for tone, accuracy, overclaiming, and patient readability.
- `publisher`
  Moves a reviewed item to `published`.

For launch, one maintainer may perform all three roles. The PR or reviewer note should still record which role was exercised.

## Review states

Research Pulse review states should be used literally:

- `draft`
  Ingested but not yet summarized or not yet ready for review.
- `review_ready`
  Automated summary exists, guardrails passed, provenance is present, and a human still needs to review it.
- `published`
  Publicly visible in feed and detail routes.
- `archived`
  No longer part of the active public feed but preserved for auditability.
- `rejected`
  Not suitable for publication.

Maintain `guardrail_status`, `provenance_complete`, `citation_complete`, `reviewer_ref`, `reviewer_note`, and `reviewed_at` together with the state.

Current implementation note:

- launch public items are reviewed automated summaries, not manually authored editorial articles
- the API exposes that distinction explicitly so reviewed automation is not mistaken for reviewed editorial writing

## Source policy

Research Pulse uses a narrower source policy than the broader content system.

Allowed discovery and enrichment sources:

- PubMed / NCBI E-utilities
- Europe PMC
- Crossref
- PMC Open Access subset when reuse rights allow it
- selected journal RSS only by explicit maintainer justification

Rules:

- PubMed or Europe PMC should anchor the canonical record whenever possible.
- DOI, PMID, and PMCID should be normalized and stored separately when present.
- Raw connector payloads should remain in `publication_provenance`.
- Copyrighted full text must not be mirrored unless reuse rights clearly allow storage and processing.
- Abstract-only workflows are valid and expected.
- Source URLs must remain visible in public responses.
- every public item must have explicit source typing:
  - `peer_reviewed_study`
  - `clinical_guideline`
  - `institutional_reference`
  - `founder_narrative`
  - `internal`
- `founder_narrative` and `internal` may exist for maintainer review context, but they are not eligible for the public Research Pulse feed

## Publication inclusion criteria

Include only if all of the following are true:

- the paper is about electrophysiology, arrhythmia care, arrhythmia-relevant innovation, or the mental-health / quality-of-life burden around arrhythmia care
- the record is journal-published and peer-reviewed
- the source metadata is complete enough for a maintainer to verify manually
- the paper can be translated into educational language without turning into diagnosis or treatment advice
- the summary can be supported by available metadata, abstract text, or reusable OA full text

Usually include:

- major observational studies
- randomized trials
- systematic reviews
- meta-analyses
- guidelines or consensus statements when they materially affect public understanding
- meaningful innovation or mapping papers relevant to people living with arrhythmias
- mental health, symptom burden, and quality-of-life studies tied to arrhythmia care

Usually reject:

- papers outside OneRhythm’s scope
- purely generic cardiology papers with no clear patient relevance for the supported arrhythmia audience
- items with too little metadata to support safe translation
- items whose claims cannot be traced back to available inputs
- papers that are technically interesting but not understandable enough to translate responsibly at launch

## Peer-review and preprint handling

Research Pulse launch policy is strict:

- preprints are excluded
- records marked as `is_preprint=true` are not published
- if a paper’s status is unclear, treat it as not eligible until a maintainer verifies journal publication
- retracted items are not published
- expression-of-concern items are not published at launch

If a preprint later becomes a journal publication:

1. ingest the journal-published version as a new eligible candidate
2. verify DOI / PMID / PMCID identity carefully
3. review it as a fresh publication
4. do not silently “upgrade” a previously rejected preprint summary into a published item

## Automated summary vs reviewed editorial content

This distinction must stay explicit.

Automated summary:

- generated from publication metadata, abstract text, and reusable OA full text when allowed
- stored in `publication_summary`
- linked to source claims and provenance records
- starts as internal review material, not public editorial authority
- is labeled in the API as `automated_summary`

Reviewed editorial content:

- the human decision that the generated summary is safe, accurate enough, calm in tone, and publishable
- recorded through `publication_review_state`
- may include small wording fixes or publication notes by a maintainer
- is what authorizes public visibility
- is a distinct category from reviewed automated summaries and should only be used when a maintainer has actually authored or substantially rewritten the public text

Do not describe automated output as “editorial review” by itself. Review happens when a maintainer inspects and approves the automated output.

## Summary QA checklist

Before changing `review_ready` to `published`, confirm:

- the title matches the paper and does not exaggerate it
- the `short_summary` is readable and non-clinical
- `plain_language_explanation` explains the paper without sounding like advice
- `why_it_matters` tells the reader why the paper is relevant without hype
- `what_this_does_not_prove` clearly limits the claim
- `study_type` is correct
- `population_sample_size` is correct if present, or omitted if not clearly supported
- `questions_to_ask_your_doctor` are discussion prompts, not recommendations
- `uncertainty_notes` are present and plainspoken
- every public claim is backed by visible provenance
- no prohibited phrases slipped through

Reject or revise if the summary:

- implies diagnosis
- implies treatment direction
- speaks with certainty beyond the source
- turns one paper into a broad promise
- hides uncertainty
- uses emotionally sharp language that would make the product feel clinical or alarming

## Plain-language limitations policy

Research Pulse should explain limitations directly, not academically.

Required plain-language handling:

- observational studies
  Explain that they can show patterns but not prove that one factor caused another.
- preclinical studies
  Explain that they do not show how people will respond in real-world care.
- small studies
  Explain that findings may not hold up the same way in larger groups.
- review articles
  Explain that they summarize existing work and still depend on the quality of the underlying studies.

If a maintainer cannot explain the study’s limit plainly, the item should not be published yet.

## Promoted and deep-dive review

Most Research Pulse items are feed summaries only.

A smaller subset may be promoted into:

- featured feed placement
- a deeper public article or research translation page

Promoted or deep-dive pieces require an extra review pass.

Additional checks:

- the article adds enough context to justify longer reading time
- the body still stays educational and non-diagnostic
- the provenance is richer, not thinner, than the shorter summary
- quoted or paraphrased claims remain tied to accessible source metadata
- the page does not overstate novelty or certainty just because it has more space

Launch rule:

- a promoted/deep-dive piece should not ship from automated output alone
- a maintainer must rewrite or substantially review long-form copy before publication

## Weak coverage fallback

When evidence coverage is weak, Research Pulse should fail quieter, not looser.

Rules:

- do not surface published-but-under-sourced records
- do not fill public gaps with internal narrative, founder narrative, or thin metadata-only items
- allow the feed to return no public items when the integrity gate is not met
- expose limited coverage in API metadata rather than silently broadening inclusion

## Stale content and update policy

Research Pulse is time-sensitive enough that stale handling should be explicit.

At launch:

- active feed items should default to a `stale_after` window
- stale items do not need immediate deletion, but they should be reviewed before continued prominence
- retractions, corrections, or major contradictory updates should trigger immediate review

When a published item becomes stale or questionable:

1. verify whether the underlying paper record is still accurate
2. check for retraction, correction, or expression of concern
3. decide whether to:
   - keep published with refreshed context
   - archive it
   - supersede it with a newer publication
4. update reviewer notes and timestamps

Public feed rule:

- stale content may remain accessible through detail pages or archives
- prominently featured placement should be removed first

## Lightweight operating flow

The launch maintainer loop is:

1. Run source discovery.
2. Review newly ingested `draft` publications for obvious ineligible items.
3. Run summarization.
4. Review `review_ready` items against the QA checklist.
5. Publish safe items.
6. Periodically review stale or updated items.

Suggested launch commands:

```bash
pnpm --filter @onerhythm/api run discover:research-pulse
pnpm --filter @onerhythm/api run summarize:research-pulse
```

Current launch limitation:

- there is no dedicated editorial UI yet
- maintainers should operate through scripts, DB inspection, tests, and small reviewable code/data changes

## Launch blockers

These are blockers for safe launch of Research Pulse:

- no human review before `published`
- missing or incomplete provenance on public claims
- preprints entering the public feed
- summaries that drift into diagnostic or treatment language
- unclear distinction between automated summaries and reviewed publication decisions
- no maintainer process for stale, corrected, or retracted items

## Future enhancements

These are useful, but not launch blockers:

- dedicated reviewer queue UI
- richer study-type labeling and evidence grading
- dual-review for featured or deep-dive pieces
- retraction and correction alerting automation
- publisher dashboards for stale items
- structured maintainer notes surfaced in an internal panel
- multilingual review workflows
- automation for low-risk auto-archive or de-feature rules

## PR expectations for Research Pulse changes

If a PR changes Research Pulse source logic, summary generation, or publication behavior, it should state:

- what changed
- whether the source policy changed
- whether eligibility changed
- whether summary guardrails changed
- whether public output changed
- what validation was run
- whether the change affects launch blockers or only future enhancements

Related docs:

- [Research Pulse architecture](../architecture/research-pulse.md)
- [Source review policy](source-review-policy.md)
- [Editorial workflow](editorial-workflow.md)
- [Tone and style guide](tone-and-style-guide.md)
