import type { DiagnosisCode, EducationalDisclaimerPolicy, EducationalSourceReference } from "./mvp-domain";
import type { SourceClassification, SourcePublisherKind } from "./sources";

export const researchPulseThemeKeys = [
  "ablation",
  "medication",
  "device",
  "genetics",
  "mapping",
  "monitoring",
  "quality_of_life",
  "mental_health",
  "innovation",
] as const;

export type ResearchPulseThemeKey = (typeof researchPulseThemeKeys)[number];

export interface SourceFeed {
  source_feed_id: string;
  slug: string;
  source_system: string;
  display_name: string;
  base_url?: string;
  feed_kind: "eutils" | "rss" | "api" | "oa_subset";
  supports_fulltext_lookup: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SourceQuery {
  source_query_id: string;
  source_feed_id: string;
  query_key: string;
  label: string;
  query_text: string;
  diagnosis_code?: DiagnosisCode;
  theme_key?: ResearchPulseThemeKey;
  locale: string;
  exclude_preprints: boolean;
  poll_interval_minutes: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicationJournal {
  publication_journal_id: string;
  title: string;
  iso_abbreviation?: string;
  issn_print?: string;
  issn_electronic?: string;
  publisher_name?: string;
  journal_home_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PublicationIdentifier {
  publication_identifier_id: string;
  publication_id: string;
  identifier_kind: "doi" | "pmid" | "pmcid";
  identifier_value: string;
  normalized_value: string;
  is_canonical: boolean;
  source_system?: string;
}

export interface PublicationLicense {
  publication_license_id: string;
  publication_id: string;
  license_code?: string;
  license_name?: string;
  license_url?: string;
  access_status: "metadata_only" | "free_full_text_link" | "oa_fulltext_reuse";
  permits_fulltext_storage: boolean;
  permits_fulltext_ai_processing: boolean;
  permits_quote_excerpt: boolean;
  source_system?: string;
  verified_at?: string;
}

export interface PublicationTopic {
  publication_topic_id: string;
  publication_id: string;
  diagnosis_code?: DiagnosisCode;
  theme_key: ResearchPulseThemeKey;
  label: string;
  confidence: number;
  assignment_source: "rule" | "model" | "reviewer";
  active: boolean;
}

export interface PublicationAuthor {
  publication_author_id: string;
  publication_id: string;
  author_position: number;
  display_name: string;
  given_name?: string;
  family_name?: string;
  affiliation?: string;
  orcid?: string;
}

export interface PublicationIngestRun {
  publication_ingest_run_id: string;
  publication_id?: string;
  source_feed_id: string;
  source_query_id?: string;
  started_at: string;
  completed_at?: string;
  status: "running" | "completed" | "failed";
  items_seen: number;
  items_accepted: number;
  items_rejected: number;
  cursor_ref?: string;
  error_summary?: string;
  created_at: string;
}

export interface PublicationSummary {
  publication_summary_id: string;
  publication_id: string;
  locale: string;
  pipeline_version: string;
  short_summary: string;
  plain_title: string;
  plain_language_explanation: string;
  why_it_matters: string;
  what_this_does_not_prove: string;
  what_researchers_studied: string;
  what_they_found: string;
  important_limits: string;
  study_type: string;
  population_sample_size?: string;
  questions_to_ask_your_doctor: string[];
  who_this_may_apply_to: string;
  source_claims_json: Array<Record<string, unknown>>;
  uncertainty_notes_json: string[];
  generated_at: string;
  content_checksum: string;
  created_at: string;
  updated_at: string;
}

export interface PublicationProvenance {
  publication_provenance_id: string;
  publication_id: string;
  publication_summary_id?: string;
  source_feed_id?: string;
  source_query_id?: string;
  publication_ingest_run_id?: string;
  source_system: string;
  external_id?: string;
  source_url: string;
  content_source_kind: "metadata" | "abstract" | "oa_fulltext";
  reuse_status: "metadata_only" | "free_full_text_link" | "oa_fulltext_reuse";
  citation_label?: string;
  source_quote_locator?: string;
  raw_payload_json?: Record<string, unknown>;
  checksum?: string;
  fetched_at: string;
}

export interface PublicationUserRelevance {
  publication_user_relevance_id: string;
  publication_id: string;
  profile_id: string;
  locale: string;
  diagnosis_code: DiagnosisCode;
  matched_keywords_json: string[];
  relevance_score: number;
  rationale_json?: Record<string, unknown>;
  computed_at: string;
  model_version: string;
}

export interface PublicationReviewState {
  publication_review_state_id: string;
  publication_id: string;
  publication_summary_id?: string;
  state: "draft" | "review_ready" | "published" | "archived" | "rejected";
  guardrail_status: "pending" | "passed" | "failed";
  provenance_complete: boolean;
  citation_complete: boolean;
  reviewer_ref?: string;
  reviewer_note?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface Publication {
  publication_id: string;
  publication_journal_id?: string;
  slug: string;
  title: string;
  abstract_text?: string;
  content_scope: "abstract_only" | "oa_fulltext";
  oa_fulltext_storage_ref?: string;
  oa_fulltext_mime_type?: string;
  source_url: string;
  article_type?: string;
  study_design?: string;
  language?: string;
  publication_date?: string;
  epub_date?: string;
  published_at?: string;
  featured_rank?: number;
  freshness_score: number;
  relevance_score: number;
  quality_score: number;
  overall_rank: number;
  stale_after?: string;
  is_peer_reviewed: boolean;
  is_preprint: boolean;
  is_retracted: boolean;
  is_expression_of_concern: boolean;
  metadata_checksum: string;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
  superseded_by_publication_id?: string;
}

export interface ResearchPulseTopicTag {
  slug: string;
  label: string;
  diagnosis_code?: DiagnosisCode;
  theme_key: ResearchPulseThemeKey;
}

export interface ResearchPulseClaimCitation {
  claim_key: string;
  citation_label: string;
  source_url: string;
  source_span_kind: "metadata" | "abstract" | "oa_fulltext";
  source_quote_locator?: string;
  pmid?: string;
  doi?: string;
}

export interface ResearchPulseIntegrity {
  summary_origin: "automated_summary" | "reviewed_editorial";
  human_reviewed: boolean;
  review_state: "draft" | "review_ready" | "published" | "archived" | "rejected";
  guardrail_status: "pending" | "passed" | "failed";
  source_classification: SourceClassification;
  publisher_kind: SourcePublisherKind;
  provenance_complete: boolean;
  citation_complete: boolean;
  adequate_source_grounding: boolean;
  trust_state: "verified" | "limited" | "excluded";
  reviewed_at?: string;
  reviewer_ref?: string;
}

export interface ResearchPulseFeedItem {
  publication_id: string;
  slug: string;
  title: string;
  summary: string;
  why_it_matters: string;
  journal_name?: string;
  study_type: string;
  published_at: string;
  source_url: string;
  doi?: string;
  pmid?: string;
  diagnosis_tags: ResearchPulseTopicTag[];
  theme_tags: ResearchPulseTopicTag[];
  integrity: ResearchPulseIntegrity;
  disclaimer_required: true;
}

export interface ResearchPulseDetail extends ResearchPulseFeedItem {
  short_summary: string;
  plain_language_explanation: string;
  why_it_matters: string;
  what_this_does_not_prove: string;
  what_researchers_studied: string;
  what_they_found: string;
  important_limits: string;
  study_type: string;
  population_sample_size?: string;
  questions_to_ask_your_doctor: string[];
  who_this_may_apply_to: string;
  uncertainty_notes: string[];
  source_references: EducationalSourceReference[];
  claim_citations: ResearchPulseClaimCitation[];
  disclaimer: EducationalDisclaimerPolicy;
}

export interface ResearchPulseQuery {
  locale?: string;
  diagnosis_code?: DiagnosisCode;
  theme_key?: ResearchPulseThemeKey;
  page?: number;
  page_size?: number;
}

export interface ResearchPulseFeedResponse {
  items: ResearchPulseFeedItem[];
  page: number;
  page_size: number;
  total_items: number;
  coverage_state: "reviewed_content_available" | "limited";
  excluded_items_count: number;
}
