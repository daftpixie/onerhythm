import type { DiagnosisCode } from "./mvp-domain";
import type { ContentSourceLink } from "./sources";

export const contentKinds = [
  "essay",
  "research_translation",
  "condition_module",
  "support_resource",
  "campaign_page",
] as const;

export type ContentKind = (typeof contentKinds)[number];

export const contentReviewStates = ["draft", "reviewed", "published", "archived"] as const;

export type ContentReviewState = (typeof contentReviewStates)[number];

export const provenanceKinds = [
  "founder_origin",
  "campaign_strategy",
  "clinical_education",
  "primary_research",
  "support_resource",
  "editorial_context",
] as const;

export type ProvenanceKind = (typeof provenanceKinds)[number];

export interface ContentAuthor {
  author_id: string;
  name: string;
  role: string;
  bio: string;
}

export interface ContentSection {
  section_id: string;
  heading: string;
  body: string[];
  bullets?: string[];
}

export interface ResearchStatHighlight {
  stat_id: string;
  value: string;
  label: string;
  context: string;
}

export interface ResearchTranslationContent {
  key_finding: string;
  plain_language_meaning: string[];
  questions_for_doctor: string[];
  stat_highlights: ResearchStatHighlight[];
}

export interface ContentSeo {
  title: string;
  description: string;
}

export interface ContentEntry {
  content_id: string;
  slug: string;
  kind: ContentKind;
  locale: string;
  translation_key: string;
  title: string;
  kicker: string;
  summary: string;
  seo: ContentSeo;
  author_ids: string[];
  publish_date: string;
  updated_date?: string;
  review_state: ContentReviewState;
  educational_surface: boolean;
  disclaimer_required: boolean;
  condition_code?: DiagnosisCode;
  campaign_key?: string;
  sections: ContentSection[];
  source_links: ContentSourceLink[];
  research_translation?: ResearchTranslationContent;
}
