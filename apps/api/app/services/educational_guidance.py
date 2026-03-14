from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from app.api.contracts import (
    ConditionEducationSectionModel,
    DoctorQuestionSectionModel,
    EducationalContentResponseModel,
    EducationalCorpusQueryModel,
    EducationalDisclaimerPolicyModel,
    EducationalGuidanceInputModel,
    EducationalProfileSnapshotModel,
    EducationalResearchHighlightModel,
    EducationalSectionStatusModel,
    MentalHealthResourceModel,
    TreatmentHistoryModel,
)
from app.api.errors import APIContractError
from app.db.models import Profile
from app.services.educational_retrieval import (
    DatabaseEducationalRetrievalProvider,
    EducationalRetrievalProvider,
    list_curated_content_entries,
)

PROHIBITED_PHRASES = [
    r"\byou have\b",
    r"\byou likely have\b",
    r"\bthis confirms\b",
    r"\bdiagnos(?:e|is|ed)\b",
    r"\btreatment recommendation\b",
    r"\bwe recommend treatment\b",
    r"\bmedication change\b",
    r"\bstart taking\b",
    r"\bstop taking\b",
    r"\burgent care now\b",
]
MAX_CURATED_CONTENT_AGE_DAYS = int(os.getenv("MAX_CURATED_CONTENT_AGE_DAYS", "45"))
REQUIRED_SECTIONS = {
    "condition_education",
    "doctor_questions",
    "recent_advancements",
    "mental_health_resources",
}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def build_guidance_input(db: Session, profile_id: str) -> EducationalGuidanceInputModel:
    profile = db.query(Profile).filter(Profile.profile_id == profile_id).one_or_none()
    if profile is None:
        raise APIContractError(
            code="profile_not_found",
            message="Profile was not found.",
            status_code=404,
            details={"profile_id": profile_id},
        )

    return EducationalGuidanceInputModel(
        profile_id=profile.profile_id,
        locale=profile.user.preferred_language,
        self_reported_profile_snapshot=EducationalProfileSnapshotModel(
            diagnosis_selection={
                "diagnosis_code": profile.diagnosis_code,
                "diagnosis_source": profile.diagnosis_source,
                "free_text_condition": profile.free_text_condition,
            },
            physical_symptoms=profile.physical_symptoms,
            emotional_context=profile.emotional_context,
            treatment_history=TreatmentHistoryModel(
                ablation_count=profile.ablation_count,
                has_implantable_device=profile.has_implantable_device,
                current_medications=profile.current_medications,
                prior_procedures=profile.prior_procedures,
            ),
            personal_narrative=profile.personal_narrative,
        ),
    )


def _section_status(section_key: str, *, stale: bool, available: bool) -> EducationalSectionStatusModel:
    if not available:
        return EducationalSectionStatusModel(
            section_key=section_key,
            status="missing",
            message="Approved curated content for this section is not currently available.",
        )
    if stale:
        return EducationalSectionStatusModel(
            section_key=section_key,
            status="stale",
            message="Approved curated content for this section is older than the review window.",
        )
    return EducationalSectionStatusModel(
        section_key=section_key,
        status="ready",
        message="Approved curated content is available for this section.",
    )


def _enforce_guardrails(response: EducationalContentResponseModel) -> EducationalContentResponseModel:
    text_surfaces = [
        response.condition_education.title,
        response.condition_education.summary,
        *response.condition_education.everyday_language_notes,
        *response.doctor_questions.items,
        *(item.title for item in response.recent_advancements),
        *(item.summary for item in response.recent_advancements),
        *(item.title for item in response.mental_health_resources),
        *(item.description for item in response.mental_health_resources),
    ]

    for text in text_surfaces:
        lowered = text.lower()
        for pattern in PROHIBITED_PHRASES:
            if re.search(pattern, lowered):
                raise APIContractError(
                    code="educational_guardrail_violation",
                    message="Curated educational content contains prohibited phrasing.",
                    status_code=500,
                    details={"pattern": pattern},
                )

    return response


def generate_educational_content(
    db: Session,
    *,
    profile_id: str,
    retrieval_provider: EducationalRetrievalProvider | None = None,
) -> EducationalContentResponseModel:
    guidance_input = build_guidance_input(db, profile_id)
    retrieval_query = EducationalCorpusQueryModel(
        locale=guidance_input.locale,
        diagnosis_code=guidance_input.self_reported_profile_snapshot.diagnosis_selection.diagnosis_code,
        content_sections=[
            "condition_education",
            "doctor_questions",
            "recent_advancements",
            "mental_health_resources",
        ],
        profile_keywords=[
            *guidance_input.self_reported_profile_snapshot.physical_symptoms,
            *guidance_input.self_reported_profile_snapshot.emotional_context,
        ],
    )
    provider = retrieval_provider or DatabaseEducationalRetrievalProvider(db=db, fallback_provider=None)
    retrieval = provider.retrieve(retrieval_query)
    curated_entries = list_curated_content_entries(db, query=retrieval_query)

    if any(
        reference.publisher_kind in {"onerhythm_editorial", "founder"}
        for reference in retrieval.references
    ):
        raise APIContractError(
            code="educational_content_unavailable",
            message="Approved educational content requires external reviewed sources.",
            status_code=503,
            details={"reason": "non_external_curated_source"},
        )

    if not curated_entries:
        raise APIContractError(
            code="educational_content_unavailable",
            message="Approved educational content is not currently available for this profile.",
            status_code=503,
            details={"reason": "missing_curated_content"},
        )

    if retrieval.content_stale:
        raise APIContractError(
            code="educational_content_stale",
            message="Approved educational content needs review before it can be shown.",
            status_code=503,
            details={"max_curated_content_age_days": MAX_CURATED_CONTENT_AGE_DAYS},
        )

    condition_entry = next(
        (entry for entry in curated_entries if entry.content_section == "condition_education"),
        None,
    )
    question_entry = next(
        (entry for entry in curated_entries if entry.content_section == "doctor_questions"),
        None,
    )
    research_entries = [
        entry for entry in curated_entries if entry.content_section == "recent_advancements"
    ]
    resource_entries = [
        entry for entry in curated_entries if entry.content_section == "mental_health_resources"
    ]

    section_presence = {
        "condition_education": condition_entry is not None,
        "doctor_questions": question_entry is not None
        and bool(question_entry.content_payload.get("questions", [])),
        "recent_advancements": bool(research_entries),
        "mental_health_resources": bool(resource_entries),
    }
    missing_sections = [key for key, value in section_presence.items() if not value]
    if missing_sections:
        raise APIContractError(
            code="educational_content_unavailable",
            message="Approved educational content is incomplete for this profile.",
            status_code=503,
            details={"missing_sections": ",".join(missing_sections)},
        )

    reference_lookup = {reference.source_reference_id: reference for reference in retrieval.references}
    section_statuses = [
        _section_status(section_key, stale=retrieval.content_stale, available=section_presence[section_key])
        for section_key in REQUIRED_SECTIONS
    ]

    response = EducationalContentResponseModel(
        response_id=str(uuid4()),
        profile_id=guidance_input.profile_id,
        locale=guidance_input.locale,
        generated_at=utcnow(),
        response_version="v1",
        content_basis=["self_reported_profile", "curated_retrieval"],
        retrieval_corpus_version=retrieval.retrieval_corpus_version,
        content_reviewed_at=retrieval.content_reviewed_at,
        content_stale=retrieval.content_stale,
        self_reported_profile_snapshot=guidance_input.self_reported_profile_snapshot,
        condition_education=ConditionEducationSectionModel(
            title=condition_entry.title,
            summary=condition_entry.summary,
            everyday_language_notes=condition_entry.content_payload.get("everyday_language_notes", []),
        ),
        doctor_questions=DoctorQuestionSectionModel(
            items=question_entry.content_payload.get("questions", []),
        ),
        recent_advancements=[
            EducationalResearchHighlightModel(
                source_reference_id=entry.entry_id,
                title=entry.title,
                summary=entry.summary,
                source_name=entry.source_name,
                source_url=entry.source_url,
                published_at=entry.source_published_at,
            )
            for entry in research_entries
        ],
        mental_health_resources=[
            MentalHealthResourceModel(
                source_reference_id=entry.entry_id,
                title=entry.title,
                description=entry.summary,
                url=entry.source_url,
                resource_kind=entry.content_payload.get("resource_kind", "education"),
            )
            for entry in resource_entries
        ],
        source_references=retrieval.references,
        section_statuses=section_statuses,
        disclaimer=EducationalDisclaimerPolicyModel(
            disclaimer_version="v1",
            disclaimer_text=(
                "OneRhythm is educational only. It does not diagnose, interpret ECGs, or recommend treatment."
            ),
            placement="persistent_banner",
            dismissible=False,
            required_on_surfaces=["api_response", "web_page", "educational_panel"],
        ),
        guardrails_applied=[
            "no_ecg_inputs",
            "no_treatment_recommendations",
            "no_diagnostic_language",
            "disclaimer_required",
            "curated_sources_only",
        ],
        ecg_clinical_inputs_used=False,
    )

    return _enforce_guardrails(response)
