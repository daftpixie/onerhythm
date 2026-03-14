/**
 * Shared MVP domain contracts for OneRhythm.
 *
 * Educational content contracts intentionally exclude ECG-derived clinical
 * inputs. Guidance is based on self-reported profile fields and curated sources.
 * They must not produce treatment recommendations, diagnosis language, or
 * outputs derived from uploaded ECG artifacts.
 */

export const diagnosisCodes = [
  "arvc",
  "afib",
  "vt",
  "svt",
  "long_qt",
  "brugada",
  "wpw",
  "other",
] as const;

export type DiagnosisCode = (typeof diagnosisCodes)[number];

export const diagnosisSources = [
  "self_reported",
  "caregiver_reported",
  "clinician_confirmed_by_user",
] as const;

export type DiagnosisSource = (typeof diagnosisSources)[number];

export interface DiagnosisSelection {
  diagnosis_code: DiagnosisCode;
  diagnosis_source: DiagnosisSource;
  free_text_condition?: string;
}

export interface UserProfile {
  profile_id: string;
  display_name?: string;
  preferred_language: string;
  diagnosis_selection: DiagnosisSelection;
  physical_symptoms: string[];
  emotional_context: string[];
  treatment_history: {
    ablation_count: number;
    has_implantable_device: boolean | null;
    current_medications: string[];
    prior_procedures: string[];
  };
  personal_narrative?: string;
  created_at: string;
  updated_at: string;
}

export const consentTypes = [
  "mosaic_contribution",
  "educational_profile",
  "research_aggregation",
  "public_story_sharing",
] as const;

export type ConsentType = (typeof consentTypes)[number];

export const consentStatuses = ["granted", "revoked"] as const;

export type ConsentStatus = (typeof consentStatuses)[number];

export const storyVisibilityStates = ["private", "review", "published"] as const;

export type StoryVisibilityState = (typeof storyVisibilityStates)[number];

export const storyReviewStates = [
  "draft",
  "pending_review",
  "changes_requested",
  "approved",
  "rejected",
] as const;

export type StoryReviewState = (typeof storyReviewStates)[number];

export const storyAuthorDisplayModes = ["first_name", "pseudonym"] as const;

export type StoryAuthorDisplayMode = (typeof storyAuthorDisplayModes)[number];

export interface CommunityStory {
  story_id: string;
  profile_id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  visibility_status: StoryVisibilityState;
  review_status: StoryReviewState;
  author_display_mode: StoryAuthorDisplayMode;
  pseudonym?: string;
  consent_record_id?: string;
  moderator_note?: string;
  submitted_at?: string;
  reviewed_at?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PublicCommunityStory {
  story_id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  author_name: string;
  published_at: string;
}

export interface ConsentRecord {
  consent_record_id: string;
  profile_id: string;
  consent_type: ConsentType;
  status: ConsentStatus;
  policy_version: string;
  locale: string;
  source: "web";
  effective_at?: string;
  granted_at?: string;
  revoked_at?: string;
  revocation_reason?: string;
}

export const exportRequestStatuses = [
  "requested",
  "processing",
  "completed",
  "failed",
] as const;

export type ExportRequestStatus = (typeof exportRequestStatuses)[number];

export interface ExportRequest {
  export_request_id: string;
  profile_id: string;
  status: ExportRequestStatus;
  requested_at: string;
  completed_at?: string;
  download_expires_at?: string;
  failure_reason?: string;
  artifact_available: boolean;
}

export const deleteRequestStatuses = [
  "requested",
  "processing",
  "completed",
  "failed",
] as const;

export type DeleteRequestStatus = (typeof deleteRequestStatuses)[number];

export interface DeleteRequest {
  delete_request_id: string;
  profile_id: string;
  status: DeleteRequestStatus;
  requested_at: string;
  completed_at?: string;
  audit_retention_reason?: string;
  failure_reason?: string;
}

export const uploadStatuses = [
  "initiated",
  "validating",
  "received",
  "sanitizing",
  "redacting",
  "transforming",
  "tile_generating",
  "cleaning_up",
  "completed",
  "failed",
  "cleanup_failed",
] as const;

export type UploadStatus = (typeof uploadStatuses)[number];

export const uploadFormats = ["jpeg", "png", "pdf"] as const;

export type UploadFormat = (typeof uploadFormats)[number];

export interface UploadSession {
  upload_session_id: string;
  profile_id?: string;
  upload_format: UploadFormat;
  processing_status: UploadStatus;
  consent_record_ids: string[];
  phi_redaction_applied: boolean;
  raw_upload_retained: false;
  started_at: string;
  completed_at?: string;
  resulting_tile_id?: string;
  failure_reason?: string;
  retryable: boolean;
  status_detail: string;
  user_message: string;
  recommended_action?: string;
}

export const tileColorFamilies = ["pulse", "signal", "aurora"] as const;

export type TileColorFamily = (typeof tileColorFamilies)[number];

export const tileTextureKinds = ["smooth", "grain", "ripple"] as const;

export type TileTextureKind = (typeof tileTextureKinds)[number];

export const tileGlowLevels = ["none", "subtle", "bright"] as const;

export type TileGlowLevel = (typeof tileGlowLevels)[number];

export interface MosaicTileMetadata {
  tile_id: string;
  condition_category: DiagnosisCode;
  contributed_at: string;
  is_public: boolean;
  display_date: string;
  tile_version: number;
  render_version: string;
  visual_style: {
    color_family: TileColorFamily;
    opacity: number;
    texture_kind: TileTextureKind;
    glow_level: TileGlowLevel;
  };
}

export interface MosaicStats {
  total_tiles: number;
  public_tiles: number;
  render_tile_limit: number;
  has_more_public_tiles: boolean;
  visible_condition_categories: DiagnosisCode[];
  latest_contribution_at?: string;
}

export interface EducationalGuidanceInput {
  profile_id: string;
  locale: string;
  // This snapshot is the complete allowed personalization surface for v1.
  // No upload metadata, OCR output, or ECG-derived artifacts may be added here.
  self_reported_profile_snapshot: {
    diagnosis_selection: DiagnosisSelection;
    physical_symptoms: string[];
    emotional_context: string[];
    treatment_history: UserProfile["treatment_history"];
    personal_narrative?: string;
  };
}

export interface EducationalCorpusQuery {
  locale: string;
  diagnosis_code: DiagnosisCode;
  content_sections: Array<
    "condition_education" | "doctor_questions" | "recent_advancements" | "mental_health_resources"
  >;
  profile_keywords: string[];
}

export interface EducationalSourceReference {
  source_reference_id: string;
  registry_source_id?: string;
  source_document_id?: string;
  source_name: string;
  source_url: string;
  title: string;
  published_at?: string;
  reviewed_at: string;
  reviewer_ref: string;
  ingestion_run_id: string;
  source_checksum: string;
  monthly_update_cycle?: string;
  approval_status?: string;
  source_classification:
    | "peer_reviewed_study"
    | "clinical_guideline"
    | "institutional_reference"
    | "founder_narrative"
    | "internal";
  publisher_kind:
    | "journal"
    | "professional_society"
    | "health_system"
    | "institution"
    | "onerhythm_editorial"
    | "founder"
    | "internal";
  citation?: {
    citation_label: string;
    doi?: string;
    pmid?: string;
    guideline_body?: string;
  };
  topic_tags: string[];
  usage_scope: string[];
  content_section:
    | "condition_education"
    | "doctor_questions"
    | "recent_advancements"
    | "mental_health_resources";
  evidence_kind: "clinical_education" | "research_update" | "support_resource";
}

export interface EducationalCorpusResult {
  retrieval_corpus_version: string;
  references: EducationalSourceReference[];
  is_curated_only: true;
  content_reviewed_at?: string;
  content_stale: boolean;
}

export interface EducationalDisclaimerPolicy {
  disclaimer_version: string;
  disclaimer_text: string;
  placement: "persistent_banner";
  dismissible: false;
  required_on_surfaces: Array<"api_response" | "web_page" | "educational_panel">;
}

export interface EducationalContentResponse {
  response_id: string;
  profile_id: string;
  locale: string;
  generated_at: string;
  response_version: string;
  content_basis: Array<"self_reported_profile" | "curated_retrieval">;
  retrieval_corpus_version: string;
  content_reviewed_at?: string;
  content_stale: boolean;
  self_reported_profile_snapshot: {
    diagnosis_selection: DiagnosisSelection;
    physical_symptoms: string[];
    emotional_context: string[];
    treatment_history: UserProfile["treatment_history"];
    personal_narrative?: string;
  };
  condition_education: {
    title: string;
    summary: string;
    everyday_language_notes: string[];
  };
  doctor_questions: {
    items: string[];
  };
  recent_advancements: Array<{
    source_reference_id?: string;
    title: string;
    summary: string;
    source_name: string;
    source_url: string;
    published_at?: string;
  }>;
  mental_health_resources: Array<{
    source_reference_id?: string;
    title: string;
    description: string;
    url: string;
    resource_kind: "peer_support" | "crisis_support" | "education" | "care_navigation";
  }>;
  source_references: EducationalSourceReference[];
  section_statuses: Array<{
    section_key:
      | "condition_education"
      | "doctor_questions"
      | "recent_advancements"
      | "mental_health_resources";
    status: "ready" | "missing" | "stale";
    message: string;
  }>;
  disclaimer: EducationalDisclaimerPolicy;
  guardrails_applied: Array<
    | "no_ecg_inputs"
    | "no_treatment_recommendations"
    | "no_diagnostic_language"
    | "disclaimer_required"
    | "curated_sources_only"
  >;
  ecg_clinical_inputs_used: false;
}
