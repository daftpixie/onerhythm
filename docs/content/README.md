# Content Operations

This directory holds the lightweight editorial and content-operations workflow for OneRhythm.

It is meant to work with the existing file-based content layer in [apps/web/content](../../apps/web/content) and the current educational retrieval flow in [apps/api/app/content/approved_sources.json](../../apps/api/app/content/approved_sources.json).

Start here:

- [OneRhythm Content Strategy](OneRhythm%20Content%20Strategy.md)
- [OneRhythm Content Library](OneRhythm%20Content%20Library.md)

- [Launch content inventory](launch-content-inventory.md)
- [Publishing system](PUBLISHING-SYSTEM.md)
- [Article do / don'ts](ARTICLE-DO-DONTS.md)
- [Content model](content-model.md)
- [Editorial workflow](editorial-workflow.md)
- [Educational evidence corpus](educational-evidence-corpus.md)
- [Research Pulse editorial workflow](research-pulse-editorial-workflow.md)
- [Source review policy](source-review-policy.md)
- [Story submission policy](story-submission-policy.md)
- [Tone and style guide](tone-and-style-guide.md)

Related docs:

- [Launch review checklists](../launch/README.md)
- [Content architecture](../architecture/content-architecture.md)
- [Evidence and provenance](../architecture/evidence-provenance.md)
- [Community stories](../architecture/community-stories.md)
- [Campaign and content strategy](../brand/content-strategy/README.md)
- [Brand system](../brand/README.md)

## Content authority

For launch-facing product copy, treat these files as the primary authority layer:

- [OneRhythm Content Strategy](OneRhythm%20Content%20Strategy.md)
- [OneRhythm Content Library](OneRhythm%20Content%20Library.md)

They define the messaging hierarchy, stat rules, SEO targets, CTA systems, share language, and
non-diagnostic guardrails that public surfaces should follow.

Implementation note:

- shared product copy now lives in [apps/web/content/site-copy.ts](../../apps/web/content/site-copy.ts)
- route metadata and reusable UI strings should be aligned there before adding new hardcoded copy to components
