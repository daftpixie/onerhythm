from __future__ import annotations

from datetime import datetime
import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


DiagnosisCode = Literal["arvc", "afib", "vt", "svt", "long_qt", "brugada", "wpw", "other"]
DiagnosisSource = Literal[
    "self_reported",
    "caregiver_reported",
    "clinician_confirmed_by_user",
]
ConsentType = Literal[
    "mosaic_contribution",
    "educational_profile",
    "research_aggregation",
    "public_story_sharing",
]
ConsentStatus = Literal["granted", "revoked"]
UploadFormat = Literal["jpeg", "png", "pdf"]
UploadStatus = Literal[
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
]
UserRole = Literal["user", "support", "admin"]
ExportRequestStatus = Literal["requested", "processing", "completed", "failed"]
DeleteRequestStatus = Literal["requested", "processing", "completed", "failed"]
StoryVisibilityStatus = Literal["private", "review", "published"]
StoryReviewStatus = Literal["draft", "pending_review", "changes_requested", "approved", "rejected"]
StoryAuthorDisplayMode = Literal["first_name", "pseudonym"]
AnalyticsEventName = Literal[
    "ecg_contribution_started",
    "ecg_contribution_completed",
    "profile_completed",
    "educational_content_viewed",
    "educational_content_returned",
    "research_hub_viewed",
    "research_article_viewed",
    "community_story_submitted",
    "resource_link_clicked",
    "homepage_cta_clicked",
    "heart_mosaic_viewed",
    "heart_mosaic_returned",
]
AnalyticsActorScope = Literal["anonymous", "authenticated", "system"]
ResearchPulseThemeKey = Literal[
    "ablation",
    "medication",
    "device",
    "genetics",
    "mapping",
    "monitoring",
    "quality_of_life",
    "mental_health",
    "innovation",
]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class DiagnosisSelectionModel(StrictModel):
    diagnosis_code: DiagnosisCode
    diagnosis_source: DiagnosisSource
    free_text_condition: str | None = None


class TreatmentHistoryModel(StrictModel):
    ablation_count: int = Field(ge=0)
    has_implantable_device: bool | None = None
    current_medications: list[str] = Field(default_factory=list)
    prior_procedures: list[str] = Field(default_factory=list)


class ProfileBodyModel(StrictModel):
    display_name: str | None = None
    preferred_language: str = Field(min_length=2)
    diagnosis_selection: DiagnosisSelectionModel
    physical_symptoms: list[str] = Field(default_factory=list)
    emotional_context: list[str] = Field(default_factory=list)
    treatment_history: TreatmentHistoryModel
    personal_narrative: str | None = None


class ProfileCreateRequest(ProfileBodyModel):
    pass


class ProfileUpdateRequest(StrictModel):
    display_name: str | None = None
    preferred_language: str | None = Field(default=None, min_length=2)
    diagnosis_selection: DiagnosisSelectionModel | None = None
    physical_symptoms: list[str] | None = None
    emotional_context: list[str] | None = None
    treatment_history: TreatmentHistoryModel | None = None
    personal_narrative: str | None = None


class ProfileResponse(ProfileBodyModel):
    profile_id: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class ConsentCreateRequest(StrictModel):
    profile_id: str
    consent_type: ConsentType
    status: ConsentStatus
    policy_version: str
    locale: str = Field(min_length=2)
    source: Literal["web"] = "web"
    effective_at: datetime
    revocation_reason: str | None = None


class ConsentUpdateRequest(StrictModel):
    consent_type: ConsentType
    status: ConsentStatus
    policy_version: str
    locale: str = Field(min_length=2)
    effective_at: datetime


class ConsentRevokeRequest(StrictModel):
    revocation_reason: str | None = None
    revoked_at: datetime


class ConsentRecordResponse(StrictModel):
    consent_record_id: str
    profile_id: str
    consent_type: ConsentType
    status: ConsentStatus
    policy_version: str
    locale: str
    source: Literal["web"]
    effective_at: datetime
    granted_at: datetime | None = None
    revoked_at: datetime | None = None
    revocation_reason: str | None = None


class ExportRequestCreate(StrictModel):
    requested_at: datetime


class ExportRequestResponse(StrictModel):
    export_request_id: str
    profile_id: str
    status: ExportRequestStatus
    requested_at: datetime
    completed_at: datetime | None = None
    download_expires_at: datetime | None = None
    failure_reason: str | None = None
    artifact_available: bool = False


class DeleteRequestCreate(StrictModel):
    requested_at: datetime


class DeleteRequestResponse(StrictModel):
    delete_request_id: str
    profile_id: str
    status: DeleteRequestStatus
    requested_at: datetime
    completed_at: datetime | None = None
    audit_retention_reason: str | None = None
    failure_reason: str | None = None


class CommunityStoryBodyModel(StrictModel):
    title: str = Field(min_length=5, max_length=160)
    summary: str = Field(min_length=20, max_length=320)
    body: str = Field(min_length=80, max_length=6000)
    author_display_mode: StoryAuthorDisplayMode
    pseudonym: str | None = Field(default=None, max_length=120)


class CommunityStoryCreateRequest(CommunityStoryBodyModel):
    pass


class CommunityStoryUpdateRequest(StrictModel):
    title: str | None = Field(default=None, min_length=5, max_length=160)
    summary: str | None = Field(default=None, min_length=20, max_length=320)
    body: str | None = Field(default=None, min_length=80, max_length=6000)
    author_display_mode: StoryAuthorDisplayMode | None = None
    pseudonym: str | None = Field(default=None, max_length=120)
    visibility_status: StoryVisibilityStatus | None = None


class CommunityStorySubmitRequest(StrictModel):
    consent_record_id: str


class CommunityStoryModerationRequest(StrictModel):
    moderator_note: str | None = Field(default=None, max_length=1000)


class CommunityStoryResponse(StrictModel):
    story_id: str
    profile_id: str
    slug: str
    title: str
    summary: str
    body: str
    visibility_status: StoryVisibilityStatus
    review_status: StoryReviewStatus
    author_display_mode: StoryAuthorDisplayMode
    pseudonym: str | None = None
    consent_record_id: str | None = None
    moderator_note: str | None = None
    submitted_at: datetime | None = None
    reviewed_at: datetime | None = None
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class PublicCommunityStoryResponse(StrictModel):
    story_id: str
    slug: str
    title: str
    summary: str
    body: str
    author_name: str
    published_at: datetime


class UploadSessionStartRequest(StrictModel):
    profile_id: str | None = None
    upload_format: UploadFormat
    consent_record_ids: list[str] = Field(default_factory=list)


class UploadSessionProcessRequest(StrictModel):
    processing_pipeline_version: str


class AnalyticsEventCreateRequest(StrictModel):
    event_name: AnalyticsEventName
    path: str = Field(min_length=1, max_length=255)
    actor_scope: AnalyticsActorScope
    visitor_id: str | None = Field(default=None, min_length=1, max_length=64)
    session_id: str | None = Field(default=None, min_length=1, max_length=64)
    properties: dict[str, str | int | float | bool | None] = Field(default_factory=dict)


class AnalyticsEventResponse(StrictModel):
    analytics_event_id: str
    event_name: AnalyticsEventName
    path: str
    actor_scope: AnalyticsActorScope
    visitor_id: str | None = None
    session_id: str | None = None
    request_id: str | None = None
    properties: dict[str, str | int | float | bool | None] = Field(default_factory=dict)
    created_at: datetime


class ErrorEnvelope(StrictModel):
    code: str
    message: str
    details: dict[str, str | int | bool] = Field(default_factory=dict)


class APIErrorResponse(StrictModel):
    error: ErrorEnvelope


class SignUpRequest(StrictModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=12)
    preferred_language: str = Field(min_length=2)


class SignInRequest(StrictModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=12)


class SessionUserResponse(StrictModel):
    user_id: str
    email: str
    role: UserRole
    preferred_language: str
    profile_id: str | None = None


class SessionResponse(StrictModel):
    authenticated: bool
    user: SessionUserResponse | None = None


class AuthSessionRecordResponse(StrictModel):
    session_id: str
    created_at: datetime
    last_seen_at: datetime
    expires_at: datetime
    current: bool = False
    user_agent: str | None = None
    ip_address_hint: str | None = None


class AuthSessionListResponse(StrictModel):
    sessions: list[AuthSessionRecordResponse] = Field(default_factory=list)


class EducationalProfileSnapshotModel(StrictModel):
    diagnosis_selection: DiagnosisSelectionModel
    physical_symptoms: list[str] = Field(default_factory=list)
    emotional_context: list[str] = Field(default_factory=list)
    treatment_history: TreatmentHistoryModel
    personal_narrative: str | None = None


class UploadSessionResponse(StrictModel):
    upload_session_id: str
    profile_id: str | None = None
    upload_format: UploadFormat
    processing_status: UploadStatus
    consent_record_ids: list[str] = Field(default_factory=list)
    phi_redaction_applied: bool
    raw_upload_retained: Literal[False]
    started_at: datetime
    completed_at: datetime | None = None
    resulting_tile_id: str | None = None
    failure_reason: str | None = None
    retryable: bool
    status_detail: str
    user_message: str
    recommended_action: str | None = None


class MosaicTileVisualStyleModel(StrictModel):
    color_family: Literal["pulse", "signal", "aurora"]
    opacity: float = Field(ge=0, le=1)
    texture_kind: Literal["smooth", "grain", "ripple"]
    glow_level: Literal["none", "subtle", "bright"]


class MosaicTileResponse(StrictModel):
    tile_id: str
    condition_category: DiagnosisCode
    contributed_at: datetime
    is_public: bool
    display_date: str
    tile_version: int = Field(ge=1)
    render_version: str = Field(min_length=1)
    visual_style: MosaicTileVisualStyleModel


class MosaicStatsResponse(StrictModel):
    total_tiles: int = Field(ge=0)
    public_tiles: int = Field(ge=0)
    render_tile_limit: int = Field(ge=1)
    has_more_public_tiles: bool = False
    visible_condition_categories: list[DiagnosisCode] = Field(default_factory=list)
    latest_contribution_at: datetime | None = None


class EducationalResearchHighlightModel(StrictModel):
    title: str
    summary: str
    source_name: str
    source_url: str
    published_at: datetime | None = None
    source_reference_id: str | None = None


class MentalHealthResourceModel(StrictModel):
    title: str
    description: str
    url: str
    resource_kind: Literal["peer_support", "crisis_support", "education", "care_navigation"]
    source_reference_id: str | None = None


class EducationalSourceReferenceModel(StrictModel):
    source_reference_id: str
    registry_source_id: str | None = None
    source_document_id: str | None = None
    source_name: str
    source_url: str
    title: str
    published_at: datetime | None = None
    reviewed_at: datetime
    reviewer_ref: str
    ingestion_run_id: str
    source_checksum: str
    monthly_update_cycle: str | None = None
    approval_status: str | None = None
    source_classification: Literal[
        "peer_reviewed_study",
        "clinical_guideline",
        "institutional_reference",
        "founder_narrative",
        "internal",
    ]
    publisher_kind: Literal[
        "journal",
        "professional_society",
        "health_system",
        "institution",
        "onerhythm_editorial",
        "founder",
        "internal",
    ]
    citation: dict[str, str] | None = None
    topic_tags: list[str] = Field(default_factory=list)
    usage_scope: list[str] = Field(default_factory=list)
    content_section: Literal[
        "condition_education",
        "doctor_questions",
        "recent_advancements",
        "mental_health_resources",
    ]
    evidence_kind: Literal["clinical_education", "research_update", "support_resource"]


class EducationalDisclaimerPolicyModel(StrictModel):
    disclaimer_version: str
    disclaimer_text: str
    placement: Literal["persistent_banner"]
    dismissible: Literal[False]
    required_on_surfaces: list[Literal["api_response", "web_page", "educational_panel"]]


class EducationalGuidanceInputModel(StrictModel):
    profile_id: str
    locale: str = Field(min_length=2)
    # This model defines the complete allowed input boundary for v1 educational generation.
    # No upload-session, OCR, or ECG-derived fields may be added.
    self_reported_profile_snapshot: EducationalProfileSnapshotModel


class EducationalCorpusQueryModel(StrictModel):
    locale: str = Field(min_length=2)
    diagnosis_code: DiagnosisCode
    content_sections: list[
        Literal[
            "condition_education",
            "doctor_questions",
            "recent_advancements",
            "mental_health_resources",
        ]
    ] = Field(default_factory=list)
    profile_keywords: list[str] = Field(default_factory=list)


class EducationalCorpusResultModel(StrictModel):
    retrieval_corpus_version: str
    references: list[EducationalSourceReferenceModel] = Field(default_factory=list)
    is_curated_only: bool = True
    content_reviewed_at: datetime | None = None
    content_stale: bool = False


class DoctorQuestionSectionModel(StrictModel):
    items: list[str] = Field(default_factory=list)


class EducationalSectionStatusModel(StrictModel):
    section_key: Literal[
        "condition_education",
        "doctor_questions",
        "recent_advancements",
        "mental_health_resources",
    ]
    status: Literal["ready", "missing", "stale"]
    message: str


class ConditionEducationSectionModel(StrictModel):
    title: str
    summary: str
    everyday_language_notes: list[str] = Field(default_factory=list)


class EducationalContentResponseModel(StrictModel):
    response_id: str
    profile_id: str
    locale: str
    generated_at: datetime
    response_version: str
    content_basis: list[Literal["self_reported_profile", "curated_retrieval"]]
    retrieval_corpus_version: str
    content_reviewed_at: datetime | None = None
    content_stale: bool = False
    self_reported_profile_snapshot: EducationalProfileSnapshotModel
    condition_education: ConditionEducationSectionModel
    doctor_questions: DoctorQuestionSectionModel
    recent_advancements: list[EducationalResearchHighlightModel] = Field(
        default_factory=list
    )
    mental_health_resources: list[MentalHealthResourceModel] = Field(default_factory=list)
    source_references: list[EducationalSourceReferenceModel] = Field(default_factory=list)
    section_statuses: list[EducationalSectionStatusModel] = Field(default_factory=list)
    disclaimer: EducationalDisclaimerPolicyModel
    guardrails_applied: list[
        Literal[
            "no_ecg_inputs",
            "no_treatment_recommendations",
            "no_diagnostic_language",
            "disclaimer_required",
            "curated_sources_only",
        ]
    ] = Field(default_factory=list)
    ecg_clinical_inputs_used: Literal[False]


class ResearchPulseTopicTagModel(StrictModel):
    slug: str
    label: str
    diagnosis_code: DiagnosisCode | None = None
    theme_key: ResearchPulseThemeKey


class ResearchPulseClaimCitationModel(StrictModel):
    claim_key: str
    citation_label: str
    source_url: str
    source_span_kind: Literal["metadata", "abstract", "oa_fulltext"]
    source_quote_locator: str | None = None
    pmid: str | None = None
    doi: str | None = None


class ResearchPulseIntegrityModel(StrictModel):
    summary_origin: Literal["automated_summary", "reviewed_editorial"]
    human_reviewed: bool
    review_state: Literal["draft", "review_ready", "published", "archived", "rejected"]
    guardrail_status: Literal["pending", "passed", "failed"]
    source_classification: Literal[
        "peer_reviewed_study",
        "clinical_guideline",
        "institutional_reference",
        "founder_narrative",
        "internal",
    ]
    publisher_kind: Literal[
        "journal",
        "professional_society",
        "health_system",
        "institution",
        "onerhythm_editorial",
        "founder",
        "internal",
    ]
    provenance_complete: bool
    citation_complete: bool
    adequate_source_grounding: bool
    trust_state: Literal["verified", "limited", "excluded"]
    reviewed_at: datetime | None = None
    reviewer_ref: str | None = None


class ResearchPulseFeedItemResponseModel(StrictModel):
    publication_id: str
    slug: str
    title: str
    summary: str
    why_it_matters: str
    journal_name: str | None = None
    study_type: str
    published_at: datetime
    source_url: str
    doi: str | None = None
    pmid: str | None = None
    diagnosis_tags: list[ResearchPulseTopicTagModel] = Field(default_factory=list)
    theme_tags: list[ResearchPulseTopicTagModel] = Field(default_factory=list)
    integrity: ResearchPulseIntegrityModel
    disclaimer_required: Literal[True] = True


class ResearchPulseFeedResponseModel(StrictModel):
    items: list[ResearchPulseFeedItemResponseModel] = Field(default_factory=list)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=12, ge=1, le=50)
    total_items: int = Field(default=0, ge=0)
    coverage_state: Literal["reviewed_content_available", "limited"] = "limited"
    excluded_items_count: int = Field(default=0, ge=0)


class ResearchPulseDetailResponseModel(ResearchPulseFeedItemResponseModel):
    short_summary: str
    plain_language_explanation: str
    why_it_matters: str
    what_this_does_not_prove: str
    what_researchers_studied: str
    what_they_found: str
    important_limits: str
    study_type: str
    population_sample_size: str | None = None
    questions_to_ask_your_doctor: list[str] = Field(default_factory=list)
    who_this_may_apply_to: str
    uncertainty_notes: list[str] = Field(default_factory=list)
    source_references: list[EducationalSourceReferenceModel] = Field(default_factory=list)
    claim_citations: list[ResearchPulseClaimCitationModel] = Field(default_factory=list)
    disclaimer: EducationalDisclaimerPolicyModel
