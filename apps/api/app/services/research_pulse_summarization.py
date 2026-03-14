from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Protocol
from uuid import uuid4

from sqlalchemy.orm import Session, joinedload

from app.api.errors import APIContractError
from app.db.models import Publication, PublicationProvenance, PublicationReviewState, PublicationSummary

PROHIBITED_PHRASES = [
    r"\byour ecg\b",
    r"\bwe detected\b",
    r"\bthis confirms\b",
    r"\byou should\b",
    r"\bstart taking\b",
    r"\bstop taking\b",
    r"\btreatment recommendation\b",
    r"\bproves that\b",
]


class SummaryGenerator(Protocol):
    def generate(self, *, publication: Publication) -> dict[str, Any]:
        ...


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _checksum(payload: dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode("utf-8")).hexdigest()


def _clean_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _first_sentence(value: str | None) -> str | None:
    if not value:
        return None
    parts = re.split(r"(?<=[.!?])\s+", _clean_spaces(value))
    return parts[0] if parts else None


def _infer_study_type(publication: Publication) -> str:
    text = " ".join(filter(None, [publication.study_design, publication.article_type])).lower()
    if "meta-analysis" in text:
        return "Meta-analysis"
    if "systematic review" in text:
        return "Systematic review"
    if "randomized" in text or "trial" in text:
        return "Randomized trial"
    if "cohort" in text:
        return "Observational cohort study"
    if "registry" in text:
        return "Registry study"
    if "preclinical" in text or "animal" in text:
        return "Preclinical study"
    if "review" in text:
        return "Review article"
    return publication.study_design or publication.article_type or "Study"


def _extract_sample_size(text: str | None) -> str | None:
    if not text:
        return None
    patterns = [
        r"\b(cohort of \d[\d,]*)\b",
        r"\b(n\s*=\s*\d[\d,]*)\b",
        r"\b(\d[\d,]*\s+(?:participants|patients|people|adults|children|subjects))\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return _clean_spaces(match.group(1))
    return None


def _field_claim(field_key: str, basis_kind: str, text: str, source_url: str) -> dict[str, Any]:
    return {
        "claim_key": field_key,
        "basis_kind": basis_kind,
        "text": text,
        "source_url": source_url,
    }


@dataclass
class TemplateSummaryGenerator:
    def generate(self, *, publication: Publication) -> dict[str, Any]:
        abstract = _clean_spaces(publication.abstract_text or "")
        first_sentence = _first_sentence(abstract) or publication.title
        study_type = _infer_study_type(publication)
        sample_size = _extract_sample_size(abstract)
        journal_name = publication.publication_journal.title if publication.publication_journal else "a peer-reviewed journal"
        title_lower = publication.title.lower()

        if "preclinical" in study_type.lower():
            limitation_line = "This is preclinical work, so it cannot show how people will respond in real-world care."
        elif "observational" in study_type.lower() or "cohort" in study_type.lower():
            limitation_line = "This is observational research, so it can show patterns but not prove that one factor caused another."
        elif sample_size and re.search(r"\b\d{1,2}\b", sample_size):
            limitation_line = "This appears to be a small study, so the findings may not hold up the same way in larger groups."
        else:
            limitation_line = "One study adds context, but it does not settle every question on its own."

        short_summary = first_sentence
        plain_language_explanation = (
            f"This paper looks at {publication.title.lower()} in language that is easier to carry into real life. "
            f"It should be read as one piece of the public evidence, not as personal medical advice."
        )
        why_it_matters = (
            f"It adds another data point for people trying to follow how arrhythmia care and electrophysiology research are changing."
        )
        if "quality of life" in title_lower or "anxiety" in abstract.lower() or "depression" in abstract.lower():
            why_it_matters = (
                "It speaks to the everyday burden of living with arrhythmia care, not just the technical side of treatment and monitoring."
            )

        what_researchers_studied = (
            f"Researchers studied {publication.title.lower()}."
            if not abstract
            else first_sentence
        )
        what_they_found = (
            "The available abstract describes the main findings, but the summary should still be read with its limits in mind."
            if not abstract
            else (
                "The abstract reports the authors' main result in broad terms, but it does not remove uncertainty or replace clinical context."
            )
        )
        important_limits = limitation_line
        what_this_does_not_prove = (
            "This does not prove that the same result will happen for every person, and it does not tell anyone what treatment choice to make."
        )
        questions_to_ask = [
            "How does this kind of study fit with the larger body of evidence?",
            "What parts of this research are most relevant to my own history and symptoms?",
            "What are the biggest limits or uncertainties in applying this study to real-world care?",
        ]
        uncertainty_notes = [
            limitation_line,
            "Research findings need to be read alongside clinical context, other studies, and personal goals.",
        ]

        return {
            "pipeline_version": "research-pulse-summary-v1",
            "short_summary": short_summary,
            "plain_title": first_sentence if first_sentence else publication.title,
            "plain_language_explanation": plain_language_explanation,
            "why_it_matters": why_it_matters,
            "what_this_does_not_prove": what_this_does_not_prove,
            "what_researchers_studied": what_researchers_studied,
            "what_they_found": what_they_found,
            "important_limits": important_limits,
            "study_type": study_type,
            "population_sample_size": sample_size,
            "questions_to_ask_your_doctor": questions_to_ask,
            "who_this_may_apply_to": "People reading about arrhythmia research in general, especially when the study topic overlaps with their self-reported history.",
            "uncertainty_notes": uncertainty_notes,
            "source_claims": [
                _field_claim("short_summary", "abstract" if abstract else "metadata", short_summary, publication.source_url),
                _field_claim("study_type", "metadata", study_type, publication.source_url),
                _field_claim("population_sample_size", "abstract" if sample_size else "metadata", sample_size or "Not stated in available input", publication.source_url),
                _field_claim("important_limits", "metadata", important_limits, publication.source_url),
            ],
        }


def _source_quote_locator_for_claim(claim: dict[str, Any]) -> str | None:
    text = _clean_spaces(str(claim.get("text") or ""))
    if not text:
        return None
    return text[:240]


def _refresh_summary_provenance(
    db: Session,
    *,
    publication: Publication,
    summary: PublicationSummary,
    source_claims: list[dict[str, Any]],
) -> None:
    primary_records = [record for record in publication.provenance_records if record.publication_summary_id is None]
    primary_record = primary_records[0] if primary_records else None

    db.query(PublicationProvenance).filter(
        PublicationProvenance.publication_id == publication.publication_id,
        PublicationProvenance.publication_summary_id == summary.publication_summary_id,
    ).delete()

    for claim in source_claims:
        source_span_kind = str(claim.get("basis_kind") or "metadata")
        if source_span_kind not in {"metadata", "abstract", "oa_fulltext"}:
            source_span_kind = "metadata"
        db.add(
            PublicationProvenance(
                publication_provenance_id=str(uuid4()),
                publication_id=publication.publication_id,
                publication_summary_id=summary.publication_summary_id,
                source_feed_id=primary_record.source_feed_id if primary_record else None,
                source_query_id=primary_record.source_query_id if primary_record else None,
                publication_ingest_run_id=primary_record.publication_ingest_run_id if primary_record else None,
                source_system=primary_record.source_system if primary_record else "summary_generation",
                external_id=primary_record.external_id if primary_record else None,
                source_url=str(claim.get("source_url") or publication.source_url),
                content_source_kind=source_span_kind,
                reuse_status=primary_record.reuse_status if primary_record else "metadata_only",
                citation_label=f"{claim['claim_key']} evidence",
                source_quote_locator=_source_quote_locator_for_claim(claim),
                raw_payload_json={"claim_key": claim["claim_key"], "basis_kind": source_span_kind, "text": claim.get("text")},
                checksum=_checksum({"claim_key": claim["claim_key"], "basis_kind": source_span_kind, "text": claim.get("text")}),
                fetched_at=utcnow(),
            )
        )


def _enforce_summary_guardrails(payload: dict[str, Any]) -> None:
    text_surfaces = [
        payload["short_summary"],
        payload["plain_language_explanation"],
        payload["why_it_matters"],
        payload["what_this_does_not_prove"],
        payload["what_researchers_studied"],
        payload["what_they_found"],
        payload["important_limits"],
        payload["study_type"],
        payload.get("population_sample_size") or "",
        payload["who_this_may_apply_to"],
        *payload.get("questions_to_ask_your_doctor", []),
        *payload.get("uncertainty_notes", []),
    ]
    for text in text_surfaces:
        lowered = text.lower()
        for pattern in PROHIBITED_PHRASES:
            if re.search(pattern, lowered):
                raise APIContractError(
                    code="research_pulse_summary_guardrail_violation",
                    message="Generated Research Pulse summary contains prohibited phrasing.",
                    status_code=500,
                    details={"pattern": pattern},
                )


def generate_publication_summary(
    db: Session,
    *,
    publication_id: str,
    locale: str = "en-US",
    generator: SummaryGenerator | None = None,
) -> PublicationSummary:
    publication = (
        db.query(Publication)
        .options(
            joinedload(Publication.publication_journal),
            joinedload(Publication.provenance_records),
            joinedload(Publication.identifiers),
        )
        .filter(Publication.publication_id == publication_id)
        .one_or_none()
    )
    if publication is None:
        raise APIContractError(
            code="publication_not_found",
            message="Publication was not found.",
            status_code=404,
            details={"publication_id": publication_id},
        )
    if publication.is_preprint:
        raise APIContractError(
            code="publication_not_eligible",
            message="Preprints cannot be summarized for Research Pulse.",
            status_code=400,
        )

    adapter = generator or TemplateSummaryGenerator()
    payload = adapter.generate(publication=publication)
    _enforce_summary_guardrails(payload)
    if not publication.provenance_records:
        raise APIContractError(
            code="publication_provenance_missing",
            message="Publication provenance is required before summarization.",
            status_code=400,
        )
    if not publication.source_url.startswith("https://") or not any(
        identifier.is_canonical for identifier in publication.identifiers
    ):
        raise APIContractError(
            code="publication_source_grounding_incomplete",
            message="Publication source grounding is incomplete for safe summarization.",
            status_code=400,
        )

    summary = (
        db.query(PublicationSummary)
        .filter(
            PublicationSummary.publication_id == publication_id,
            PublicationSummary.locale == locale,
        )
        .one_or_none()
    )
    source_claims = []
    for claim in payload["source_claims"]:
        claim["source_url"] = claim["source_url"] or publication.source_url
        source_claims.append(claim)

    if summary is None:
        summary = PublicationSummary(
            publication_summary_id=str(uuid4()),
            publication_id=publication_id,
            locale=locale,
            pipeline_version=payload["pipeline_version"],
            short_summary=payload["short_summary"],
            plain_title=payload["plain_title"],
            plain_language_explanation=payload["plain_language_explanation"],
            why_it_matters=payload["why_it_matters"],
            what_this_does_not_prove=payload["what_this_does_not_prove"],
            what_researchers_studied=payload["what_researchers_studied"],
            what_they_found=payload["what_they_found"],
            important_limits=payload["important_limits"],
            study_type=payload["study_type"],
            population_sample_size=payload["population_sample_size"],
            questions_to_ask_your_doctor_json=payload["questions_to_ask_your_doctor"],
            who_this_may_apply_to=payload["who_this_may_apply_to"],
            source_claims_json=source_claims,
            uncertainty_notes_json=payload["uncertainty_notes"],
            generated_at=utcnow(),
            content_checksum="",
        )
        db.add(summary)
        db.flush()
    else:
        summary.pipeline_version = payload["pipeline_version"]
        summary.short_summary = payload["short_summary"]
        summary.plain_title = payload["plain_title"]
        summary.plain_language_explanation = payload["plain_language_explanation"]
        summary.why_it_matters = payload["why_it_matters"]
        summary.what_this_does_not_prove = payload["what_this_does_not_prove"]
        summary.what_researchers_studied = payload["what_researchers_studied"]
        summary.what_they_found = payload["what_they_found"]
        summary.important_limits = payload["important_limits"]
        summary.study_type = payload["study_type"]
        summary.population_sample_size = payload["population_sample_size"]
        summary.questions_to_ask_your_doctor_json = payload["questions_to_ask_your_doctor"]
        summary.who_this_may_apply_to = payload["who_this_may_apply_to"]
        summary.source_claims_json = source_claims
        summary.uncertainty_notes_json = payload["uncertainty_notes"]
        summary.generated_at = utcnow()
        summary.updated_at = utcnow()

    summary.content_checksum = _checksum(payload)
    _refresh_summary_provenance(
        db,
        publication=publication,
        summary=summary,
        source_claims=source_claims,
    )
    summary_provenance_count = (
        db.query(PublicationProvenance)
        .filter(
            PublicationProvenance.publication_id == publication_id,
            PublicationProvenance.publication_summary_id == summary.publication_summary_id,
        )
        .count()
    )
    db.query(PublicationReviewState).filter(
        PublicationReviewState.publication_id == publication_id
    ).delete()
    db.add(
        PublicationReviewState(
            publication_review_state_id=str(uuid4()),
            publication_id=publication_id,
            publication_summary_id=summary.publication_summary_id,
            state="review_ready",
            guardrail_status="passed",
            provenance_complete=bool(publication.provenance_records),
            citation_complete=bool(source_claims) and summary_provenance_count > 0,
            reviewer_ref=None,
            reviewer_note=(
                "Automated summary generated and ready for human review. "
                "This is internal review material, not reviewed editorial content."
            ),
            reviewed_at=None,
            created_at=utcnow(),
        )
    )
    db.commit()
    db.refresh(summary)
    return summary


def summarize_publications(
    db: Session,
    *,
    locale: str = "en-US",
    publication_ids: list[str] | None = None,
    limit: int = 20,
    generator: SummaryGenerator | None = None,
) -> int:
    query = (
        db.query(Publication)
        .options(
            joinedload(Publication.provenance_records),
            joinedload(Publication.review_states),
        )
        .filter(
            Publication.is_preprint.is_(False),
            Publication.is_retracted.is_(False),
            Publication.is_expression_of_concern.is_(False),
        )
    )
    if publication_ids:
        query = query.filter(Publication.publication_id.in_(publication_ids))
    else:
        query = query.join(PublicationReviewState).filter(PublicationReviewState.state.in_(("draft", "review_ready")))

    publications = query.order_by(Publication.published_at.desc().nulls_last(), Publication.created_at.desc()).limit(limit).all()
    summarized = 0
    for publication in publications:
        generate_publication_summary(
            db,
            publication_id=publication.publication_id,
            locale=locale,
            generator=generator,
        )
        summarized += 1
    return summarized
