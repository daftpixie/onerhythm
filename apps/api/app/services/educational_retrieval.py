from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import os
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import Protocol
from uuid import uuid4

from app.api.contracts import (
    EducationalCorpusQueryModel,
    EducationalCorpusResultModel,
    EducationalSourceReferenceModel,
)
from app.db.models import CuratedContentEntry


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def ensure_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


MAX_CURATED_CONTENT_AGE_DAYS = int(os.getenv("MAX_CURATED_CONTENT_AGE_DAYS", "45"))


class EducationalRetrievalProvider(Protocol):
    def retrieve(self, query: EducationalCorpusQueryModel) -> EducationalCorpusResultModel:
        ...


def list_curated_content_entries(
    db: Session,
    *,
    query: EducationalCorpusQueryModel,
) -> list[CuratedContentEntry]:
    return (
        db.query(CuratedContentEntry)
        .filter(
            CuratedContentEntry.is_active.is_(True),
            CuratedContentEntry.locale == query.locale,
            CuratedContentEntry.content_section.in_(query.content_sections),
            or_(
                CuratedContentEntry.diagnosis_code == query.diagnosis_code,
                CuratedContentEntry.diagnosis_code.is_(None),
            ),
        )
        .order_by(
            CuratedContentEntry.content_section.asc(),
            CuratedContentEntry.diagnosis_code.desc(),
            CuratedContentEntry.reviewed_at.desc(),
            CuratedContentEntry.title.asc(),
        )
        .all()
    )


@dataclass(frozen=True)
class StubEducationalRetrievalProvider:
    retrieval_corpus_version: str = "stub-corpus-v1"

    def retrieve(self, query: EducationalCorpusQueryModel) -> EducationalCorpusResultModel:
        diagnosis_label = query.diagnosis_code.replace("_", " ").title()
        now = utcnow()
        references = [
            EducationalSourceReferenceModel(
                source_reference_id=str(uuid4()),
                registry_source_id=None,
                source_document_id="stub-condition-education",
                source_name="OneRhythm Public Education Library",
                source_url="https://github.com/daftpixie/onerhythm/blob/main/docs/prd/README.md",
                title=f"Living with {diagnosis_label}: a plain-language overview",
                published_at=now,
                reviewed_at=now,
                reviewer_ref="stub-provider",
                ingestion_run_id="stub-curated-content",
                source_checksum="stub-condition-education",
                monthly_update_cycle="stub",
                approval_status="approved",
                source_classification="institutional_reference",
                publisher_kind="onerhythm_editorial",
                citation={"citation_label": "OneRhythm public educational source"},
                topic_tags=[query.diagnosis_code],
                usage_scope=["educational_guidance", "condition_education"],
                content_section="condition_education",
                evidence_kind="clinical_education",
            ),
            EducationalSourceReferenceModel(
                source_reference_id=str(uuid4()),
                registry_source_id=None,
                source_document_id="stub-doctor-questions",
                source_name="OneRhythm Conversation Prompts",
                source_url="https://github.com/daftpixie/onerhythm/blob/main/docs/product/README.md",
                title=f"Preparing calm questions for a visit about {diagnosis_label}",
                published_at=now,
                reviewed_at=now,
                reviewer_ref="stub-provider",
                ingestion_run_id="stub-curated-content",
                source_checksum="stub-doctor-questions",
                monthly_update_cycle="stub",
                approval_status="approved",
                source_classification="institutional_reference",
                publisher_kind="onerhythm_editorial",
                citation={"citation_label": "OneRhythm public product source"},
                topic_tags=[query.diagnosis_code],
                usage_scope=["educational_guidance", "doctor_questions"],
                content_section="doctor_questions",
                evidence_kind="clinical_education",
            ),
            EducationalSourceReferenceModel(
                source_reference_id=str(uuid4()),
                registry_source_id=None,
                source_document_id="stub-recent-advancements",
                source_name="OneRhythm Research Digest",
                source_url="https://github.com/daftpixie/onerhythm/blob/main/docs/architecture/educational-guidance-engine-v1.md",
                title=f"Recent public research themes related to {diagnosis_label}",
                published_at=now,
                reviewed_at=now,
                reviewer_ref="stub-provider",
                ingestion_run_id="stub-curated-content",
                source_checksum="stub-recent-advancements",
                monthly_update_cycle="stub",
                approval_status="approved",
                source_classification="institutional_reference",
                publisher_kind="onerhythm_editorial",
                citation={"citation_label": "OneRhythm architecture source"},
                topic_tags=[query.diagnosis_code],
                usage_scope=["educational_guidance", "recent_advancements"],
                content_section="recent_advancements",
                evidence_kind="research_update",
            ),
            EducationalSourceReferenceModel(
                source_reference_id=str(uuid4()),
                registry_source_id=None,
                source_document_id="stub-mental-health-resources",
                source_name="OneRhythm Support Directory",
                source_url="https://github.com/daftpixie/onerhythm/blob/main/docs/product/README.md",
                title="Mental health and peer support starting points",
                published_at=now,
                reviewed_at=now,
                reviewer_ref="stub-provider",
                ingestion_run_id="stub-curated-content",
                source_checksum="stub-mental-health-resources",
                monthly_update_cycle="stub",
                approval_status="approved",
                source_classification="institutional_reference",
                publisher_kind="onerhythm_editorial",
                citation={"citation_label": "OneRhythm public product source"},
                topic_tags=[query.diagnosis_code, "mental_health_support"],
                usage_scope=["educational_guidance", "mental_health_resources"],
                content_section="mental_health_resources",
                evidence_kind="support_resource",
            ),
        ]

        return EducationalCorpusResultModel(
            retrieval_corpus_version=self.retrieval_corpus_version,
            references=references,
        )


@dataclass
class DatabaseEducationalRetrievalProvider:
    db: Session
    fallback_provider: EducationalRetrievalProvider | None = None
    retrieval_corpus_version: str = "curated-content-v2"

    def retrieve(self, query: EducationalCorpusQueryModel) -> EducationalCorpusResultModel:
        entries = list_curated_content_entries(self.db, query=query)
        if not entries:
            if self.fallback_provider is not None:
                return self.fallback_provider.retrieve(query)
            return EducationalCorpusResultModel(
                retrieval_corpus_version=self.retrieval_corpus_version,
                references=[],
                is_curated_only=True,
                content_reviewed_at=None,
                content_stale=True,
            )

        latest_reviewed_at = max(ensure_utc(entry.reviewed_at) for entry in entries)
        content_stale = (utcnow() - latest_reviewed_at).days > MAX_CURATED_CONTENT_AGE_DAYS

        references = [
            EducationalSourceReferenceModel(
                source_reference_id=entry.entry_id,
                registry_source_id=entry.provenance.get("registry_source_id"),
                source_document_id=entry.provenance.get("source_document_id"),
                source_name=entry.source_name,
                source_url=entry.source_url,
                title=entry.title,
                published_at=ensure_utc(entry.source_published_at),
                reviewed_at=ensure_utc(entry.reviewed_at),
                reviewer_ref=entry.reviewer_ref,
                ingestion_run_id=entry.ingestion_run_id,
                source_checksum=entry.source_checksum,
                monthly_update_cycle=entry.provenance.get("monthly_update_cycle"),
                approval_status=entry.provenance.get("approval_status"),
                source_classification=entry.provenance.get(
                    "source_classification", "institutional_reference"
                ),
                publisher_kind=entry.provenance.get("publisher_kind", "onerhythm_editorial"),
                citation=entry.provenance.get("citation"),
                topic_tags=entry.provenance.get("topic_tags", []),
                usage_scope=entry.provenance.get("usage_scope", []),
                content_section=entry.content_section,
                evidence_kind=entry.evidence_kind,
            )
            for entry in entries
        ]

        return EducationalCorpusResultModel(
            retrieval_corpus_version=self.retrieval_corpus_version,
            references=references,
            is_curated_only=True,
            content_reviewed_at=latest_reviewed_at,
            content_stale=content_stale,
        )
