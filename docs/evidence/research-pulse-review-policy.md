# Research Pulse Review Policy

This document describes the Research Pulse trust model that is implemented now.

It is narrower than a general editorial policy because Research Pulse is a reviewed educational feed, not a general health-news product.

## Non-diagnostic boundary

Research Pulse remains educational only.

Current repository rules require all of the following:

- no ECG-derived inputs
- no diagnosis or waveform interpretation
- no treatment recommendations
- no preprints in the public feed
- no internal or founder narrative as public Research Pulse evidence

Personalized Research Pulse is still an educational surface.
Its ranking uses self-reported profile fields and requires `educational_profile` consent.

## Evidence hierarchy implemented now

Current source posture:

- peer-reviewed journal publications are the default public Research Pulse evidence base
- guidelines or consensus statements may be included when they materially affect public understanding
- abstract-only workflows are acceptable
- OA full text may be used only when reuse rights clearly allow it
- canonical identifiers such as `DOI`, `PMID`, or `PMCID` are expected whenever available

Connectors implemented now:

- PubMed / NCBI E-utilities
- Europe PMC
- Crossref
- PMC Open Access lookup when reuse rights allow it

## Publication and review gates implemented now

Research Pulse public visibility is fail-closed.

For an item to surface publicly, the repository currently requires:

- a publication summary for the requested locale
- an external source classification that is not `founder_narrative` or `internal`
- visible source URLs
- adequate source grounding through identifiers and provenance
- a latest review state of `published`
- `guardrail_status = passed`
- `provenance_complete = true`
- `citation_complete = true`
- `reviewer_ref` and `reviewed_at`
- claim citations tied to the published summary
- no preprint, retraction, or expression-of-concern status

If those conditions drift or are missing:

- the public feed excludes the item
- the detail route returns no public record
- feed coverage degrades to `limited` rather than broadening eligibility

## Summary generation implemented now

The current summarization path is deterministic and review-first.

Implemented now:

- a structured summary generator writes review material into `publication_summary`
- claim-level provenance is written into `publication_provenance`
- generated summaries become `review_ready`
- public routes distinguish reviewed automation from reviewed editorial writing

Important current limitation:

- most launch Research Pulse content is reviewed automated summary material, not manually authored long-form editorial
- do not describe the current feed as if every item were custom-written editorial analysis

## What is not built yet

The following are real future-work items, not current launch features:

- an editorial review UI
- scheduled ingestion and summarization workers
- a maintainer-facing publication dashboard
- a separate long-form editorial workflow for every published Research Pulse item

## Maintainer expectations

Before publishing or promoting a Research Pulse item, confirm:

- the source is eligible and externally grounded
- the summary stays educational and non-diagnostic
- uncertainty is visible
- reviewer attribution is recorded
- claim citations remain present

Do not publish if:

- the item is a preprint
- the item is retracted or carries an expression of concern
- the item depends on internal or founder narrative
- the item lacks reviewer attribution, provenance, or claim citations

## Related docs

- [Research Pulse architecture](../architecture/research-pulse.md)
- [Research Pulse editorial workflow](../content/research-pulse-editorial-workflow.md)
- [Approved source policy](approved-source-policy.md)
