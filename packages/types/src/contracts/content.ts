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
  eyebrow?: string;
  bullets?: string[];
  pull_quote?: string;
  stat_callout?: {
    value: string;
    label: string;
    source?: string;
  };
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

export interface EditorialHomepageFeature {
  order: number;
  type_label: string;
  reading_time: string;
  purpose: string;
  summary: string;
  cta_label: string;
  accent_tone: "pulse" | "signal" | "aurora";
  pull_quote?: string;
  stat_accent?: {
    value: string;
    label: string;
    source?: string;
  };
}

export interface EditorialShareAtoms {
  meta_description: string;
  og_title: string;
  og_description: string;
  og_alt: string;
  og_image_path: string;
  twitter_image_path?: string;
  x_post_starter: string;
  x_thread: string[];
  reddit_post: string;
  reddit_tldr: string;
  linkedin_post: string;
  share_captions: string[];
  pull_quotes: string[];
  image_card_snippets: string[];
  short_version: string;
  medium_version: string;
  long_version: string;
}

export interface EditorialDocumentSpec {
  label: string;
  print_label: string;
  footer_note: string;
  wordmark_tone: "white" | "gradient";
}

export interface EditorialNextAction {
  label: string;
  href: string;
  description: string;
}

export interface EditorialArticle {
  dek: string;
  reading_time: string;
  hero_label: string;
  audience: string;
  homepage_feature: EditorialHomepageFeature;
  share: EditorialShareAtoms;
  document: EditorialDocumentSpec;
  next_action: EditorialNextAction;
  secondary_action?: EditorialNextAction;
  cover_image_path: string;
  cover_image_alt: string;
  sensitive_topic: "none" | "mental_health" | "suicidality";
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
  article?: EditorialArticle;
}
