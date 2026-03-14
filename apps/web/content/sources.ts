import type { EvidenceSource } from "@onerhythm/types";

export const evidenceSources: EvidenceSource[] = [
  {
    source_id: "founder-origin-public-v1",
    title: "Why OneRhythm exists",
    source_name: "OneRhythm",
    source_url: "/stories/why-onerhythm-exists",
    classification: "founder_narrative",
    publisher_kind: "founder",
    language: "en-US",
    publish_date: "2026-03-12",
    updated_date: "2026-03-12",
    reviewed_at: "2026-03-12",
    reviewer_ref: "editorial-review",
    review_state: "published",
    authors: ["Matthew Adams"],
    summary:
      "Public founder-origin narrative describing the lived context and product purpose behind OneRhythm.",
    citation: {
      citation_label: "Adams M. Why OneRhythm exists. OneRhythm. 2026.",
    },
  },
  {
    source_id: "campaign-strategy-public-v1",
    title: "Campaign and content strategy",
    source_name: "OneRhythm",
    source_url: "/campaigns/the-weight-you-cant-see",
    classification: "institutional_reference",
    publisher_kind: "onerhythm_editorial",
    language: "en-US",
    publish_date: "2026-03-12",
    updated_date: "2026-03-12",
    reviewed_at: "2026-03-12",
    reviewer_ref: "editorial-review",
    review_state: "published",
    summary:
      "Public strategy summary covering project origin, campaign framing, voice, and launch communication priorities.",
    citation: {
      citation_label: "OneRhythm. Campaign and content strategy. 2026.",
    },
  },
  {
    source_id: "prd-public-v1",
    title: "OneRhythm public PRD",
    source_name: "OneRhythm",
    source_url: "https://github.com/daftpixie/onerhythm/blob/main/docs/prd/README.md",
    classification: "institutional_reference",
    publisher_kind: "onerhythm_editorial",
    language: "en-US",
    publish_date: "2026-03-01",
    reviewed_at: "2026-03-10",
    reviewer_ref: "editorial-board",
    review_state: "published",
    summary:
      "Public product requirements covering the core platform boundary, privacy model, and feature expectations.",
    citation: {
      citation_label: "OneRhythm. Public PRD v1. 2026.",
    },
  },
  {
    source_id: "product-docs-public-v1",
    title: "OneRhythm product docs",
    source_name: "OneRhythm",
    source_url: "https://github.com/daftpixie/onerhythm/blob/main/docs/product/README.md",
    classification: "institutional_reference",
    publisher_kind: "onerhythm_editorial",
    language: "en-US",
    publish_date: "2026-03-01",
    reviewed_at: "2026-03-10",
    reviewer_ref: "editorial-board",
    review_state: "published",
    summary:
      "Public product framing and contributor-facing problem context for OneRhythm.",
    citation: {
      citation_label: "OneRhythm. Product documentation. 2026.",
    },
  },
  {
    source_id: "education-architecture-v1",
    title: "Educational guidance engine v1",
    source_name: "OneRhythm",
    source_url:
      "https://github.com/daftpixie/onerhythm/blob/main/docs/architecture/educational-guidance-engine-v1.md",
    classification: "institutional_reference",
    publisher_kind: "onerhythm_editorial",
    language: "en-US",
    publish_date: "2026-03-01",
    reviewed_at: "2026-03-10",
    reviewer_ref: "research-review",
    review_state: "published",
    summary:
      "Architecture reference explaining the educational-only guidance boundary, source traceability, and prohibited phrasing rules.",
    citation: {
      citation_label: "OneRhythm. Educational guidance engine v1. 2026.",
    },
  },
  {
    source_id: "public-mosaic-architecture-v1",
    title: "Public Heart Mosaic",
    source_name: "OneRhythm",
    source_url:
      "https://github.com/daftpixie/onerhythm/blob/main/docs/architecture/public-mosaic.md",
    classification: "institutional_reference",
    publisher_kind: "onerhythm_editorial",
    language: "en-US",
    publish_date: "2026-03-12",
    reviewed_at: "2026-03-12",
    reviewer_ref: "editorial-board",
    review_state: "published",
    summary:
      "Architecture reference describing the public mosaic boundary, accessibility model, and anonymous metadata surface.",
    citation: {
      citation_label: "OneRhythm. Public Heart Mosaic. 2026.",
    },
  },
  {
    source_id: "community-stories-architecture-v1",
    title: "Community stories",
    source_name: "OneRhythm",
    source_url:
      "https://github.com/daftpixie/onerhythm/blob/main/docs/architecture/community-stories.md",
    classification: "institutional_reference",
    publisher_kind: "onerhythm_editorial",
    language: "en-US",
    publish_date: "2026-03-12",
    reviewed_at: "2026-03-12",
    reviewer_ref: "editorial-board",
    review_state: "published",
    summary:
      "Architecture reference for consent-based community story submission, moderation, and publication boundaries.",
    citation: {
      citation_label: "OneRhythm. Community stories. 2026.",
    },
  },
];
