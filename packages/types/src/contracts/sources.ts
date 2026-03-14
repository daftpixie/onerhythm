export const sourceClassifications = [
  "peer_reviewed_study",
  "clinical_guideline",
  "institutional_reference",
  "founder_narrative",
  "internal",
] as const;

export type SourceClassification = (typeof sourceClassifications)[number];

export const sourcePublisherKinds = [
  "journal",
  "professional_society",
  "health_system",
  "institution",
  "onerhythm_editorial",
  "founder",
  "internal",
] as const;

export type SourcePublisherKind = (typeof sourcePublisherKinds)[number];

export const sourceReviewStates = ["draft", "reviewed", "published", "archived"] as const;

export type SourceReviewState = (typeof sourceReviewStates)[number];

export interface SourceCitation {
  citation_label: string;
  doi?: string;
  pmid?: string;
  guideline_body?: string;
}

export interface EvidenceSource {
  source_id: string;
  title: string;
  source_name: string;
  source_url: string;
  classification: SourceClassification;
  publisher_kind: SourcePublisherKind;
  language: string;
  publish_date?: string;
  updated_date?: string;
  reviewed_at?: string;
  reviewer_ref?: string;
  review_state: SourceReviewState;
  authors?: string[];
  summary?: string;
  citation?: SourceCitation;
}

export interface ContentSourceLink {
  source_id: string;
  relevance_note?: string;
}
