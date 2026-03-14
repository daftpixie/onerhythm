from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from sqlalchemy.orm import Session

from app.db.models import CuratedContentEntry

APPROVED_SOURCES_PATH = Path(__file__).resolve().parents[1] / "content" / "approved_sources.json"
LAUNCH_DIAGNOSIS_CODES = ("arvc", "afib", "vt", "svt", "long_qt", "brugada", "wpw")
REQUIRED_CONTENT_SECTIONS = (
    "condition_education",
    "doctor_questions",
    "recent_advancements",
    "mental_health_resources",
)
SECTION_EVIDENCE_KIND = {
    "condition_education": "clinical_education",
    "doctor_questions": "clinical_education",
    "recent_advancements": "research_update",
    "mental_health_resources": "support_resource",
}
EXTERNAL_PUBLISHER_KINDS = {"journal", "professional_society", "health_system", "institution"}
TAG_PATTERN = re.compile(r"^[a-z0-9_]+$")
USAGE_SCOPE_VALUES = {
    "educational_guidance",
    "condition_education",
    "doctor_questions",
    "recent_advancements",
    "mental_health_resources",
}
REQUIRED_TOPIC_TAGS_BY_DIAGNOSIS = {
    "arvc": {"arvc", "genetics", "icd", "mental_health_support"},
    "afib": {"afib", "ablation", "medication", "mental_health_support"},
    "vt": {"vt", "ablation", "icd", "mental_health_support"},
    "svt": {"svt", "ablation", "medication", "mental_health_support"},
    "long_qt": {"long_qt", "genetics", "medication", "mental_health_support"},
    "brugada": {"brugada", "genetics", "icd", "mental_health_support"},
    "wpw": {"wpw", "ablation", "mental_health_support"},
}
DEFAULT_INGESTED_FROM = "apps/api/app/content/approved_sources.json"


class CuratedContentValidationError(ValueError):
    pass


def _parse_datetime(value: str | None) -> datetime | None:
    if value is None:
        return None
    normalized = value.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized)


def _build_content_key(entry: dict[str, Any]) -> str:
    raw_key = "|".join(
        [
            entry["locale"],
            entry.get("diagnosis_code") or "generic",
            entry["content_section"],
            entry["source_url"],
            entry["title"],
        ]
    )
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def _entry_ref(entry: dict[str, Any]) -> str:
    diagnosis_code = entry.get("diagnosis_code") or "generic"
    return f"{diagnosis_code}:{entry.get('content_section')}:{entry.get('title')}"


def _expected_ingested_from(source_path: Path) -> str:
    if source_path == APPROVED_SOURCES_PATH:
        return DEFAULT_INGESTED_FROM
    return source_path.as_posix()


def _require(condition: bool, message: str) -> None:
    if not condition:
        raise CuratedContentValidationError(message)


def _require_non_empty_string(value: Any, *, field_name: str, entry_ref: str) -> str:
    _require(isinstance(value, str) and bool(value.strip()), f"{entry_ref} is missing {field_name}.")
    return value.strip()


def _validate_tag_collection(
    values: Any,
    *,
    field_name: str,
    entry_ref: str,
    allowed_values: set[str] | None = None,
) -> list[str]:
    _require(isinstance(values, list) and bool(values), f"{entry_ref} must include {field_name}.")
    normalized: list[str] = []
    for value in values:
        normalized_value = _require_non_empty_string(
            value, field_name=f"{field_name} item", entry_ref=entry_ref
        )
        _require(
            bool(TAG_PATTERN.fullmatch(normalized_value)),
            f"{entry_ref} has invalid {field_name} value {normalized_value!r}.",
        )
        if allowed_values is not None:
            _require(
                normalized_value in allowed_values,
                f"{entry_ref} has unsupported {field_name} value {normalized_value!r}.",
            )
        normalized.append(normalized_value)
    return normalized


def _validate_entry(entry: dict[str, Any], *, source_path: Path) -> None:
    entry_ref = _entry_ref(entry)
    for field_name in (
        "locale",
        "content_section",
        "evidence_kind",
        "title",
        "summary",
        "source_name",
        "source_url",
        "reviewed_at",
        "reviewer_ref",
        "content_payload",
        "provenance",
    ):
        _require(field_name in entry, f"{entry_ref} is missing {field_name}.")

    diagnosis_code = entry.get("diagnosis_code")
    _require(
        diagnosis_code in LAUNCH_DIAGNOSIS_CODES,
        f"{entry_ref} must declare a supported launch diagnosis code.",
    )
    content_section = _require_non_empty_string(
        entry["content_section"], field_name="content_section", entry_ref=entry_ref
    )
    _require(
        content_section in REQUIRED_CONTENT_SECTIONS,
        f"{entry_ref} has unsupported content_section {content_section!r}.",
    )
    evidence_kind = _require_non_empty_string(
        entry["evidence_kind"], field_name="evidence_kind", entry_ref=entry_ref
    )
    _require(
        evidence_kind == SECTION_EVIDENCE_KIND[content_section],
        f"{entry_ref} has mismatched evidence_kind for {content_section}.",
    )
    _require_non_empty_string(entry["locale"], field_name="locale", entry_ref=entry_ref)
    _require_non_empty_string(entry["title"], field_name="title", entry_ref=entry_ref)
    _require_non_empty_string(entry["summary"], field_name="summary", entry_ref=entry_ref)
    _require_non_empty_string(entry["source_name"], field_name="source_name", entry_ref=entry_ref)
    source_url = _require_non_empty_string(
        entry["source_url"], field_name="source_url", entry_ref=entry_ref
    )
    _require(source_url.startswith("https://"), f"{entry_ref} must use an https source_url.")
    _require(_parse_datetime(entry.get("reviewed_at")) is not None, f"{entry_ref} has invalid reviewed_at.")
    if entry.get("source_published_at") is not None:
        _require(
            _parse_datetime(entry.get("source_published_at")) is not None,
            f"{entry_ref} has invalid source_published_at.",
        )

    _require(isinstance(entry["content_payload"], dict), f"{entry_ref} content_payload must be an object.")
    provenance = entry["provenance"]
    _require(isinstance(provenance, dict), f"{entry_ref} provenance must be an object.")

    _require_non_empty_string(
        provenance.get("registry_source_id"), field_name="provenance.registry_source_id", entry_ref=entry_ref
    )
    _require_non_empty_string(
        provenance.get("source_document_id"), field_name="provenance.source_document_id", entry_ref=entry_ref
    )
    _require_non_empty_string(
        provenance.get("ingested_from"), field_name="provenance.ingested_from", entry_ref=entry_ref
    )
    _require(
        provenance.get("ingested_from") == _expected_ingested_from(source_path),
        f"{entry_ref} must record the current source file in provenance.ingested_from.",
    )
    source_classification = _require_non_empty_string(
        provenance.get("source_classification"),
        field_name="provenance.source_classification",
        entry_ref=entry_ref,
    )
    _require(
        source_classification in {"peer_reviewed_study", "clinical_guideline", "institutional_reference"},
        f"{entry_ref} has unsupported provenance.source_classification {source_classification!r}.",
    )
    publisher_kind = _require_non_empty_string(
        provenance.get("publisher_kind"),
        field_name="provenance.publisher_kind",
        entry_ref=entry_ref,
    )
    _require(
        publisher_kind in EXTERNAL_PUBLISHER_KINDS,
        f"{entry_ref} must use an external publisher_kind.",
    )
    _require_non_empty_string(
        provenance.get("monthly_update_cycle"),
        field_name="provenance.monthly_update_cycle",
        entry_ref=entry_ref,
    )
    _require(
        provenance.get("approval_status") == "approved",
        f"{entry_ref} must have approval_status='approved'.",
    )
    topic_tags = _validate_tag_collection(
        provenance.get("topic_tags"),
        field_name="provenance.topic_tags",
        entry_ref=entry_ref,
    )
    usage_scope = _validate_tag_collection(
        provenance.get("usage_scope"),
        field_name="provenance.usage_scope",
        entry_ref=entry_ref,
        allowed_values=USAGE_SCOPE_VALUES,
    )
    citation = provenance.get("citation")
    _require(isinstance(citation, dict), f"{entry_ref} provenance.citation must be an object.")
    _require_non_empty_string(
        citation.get("citation_label"), field_name="provenance.citation.citation_label", entry_ref=entry_ref
    )
    if source_classification == "clinical_guideline":
        _require(
            bool(citation.get("guideline_body")),
            f"{entry_ref} clinical guidelines must record citation.guideline_body.",
        )
        _require(
            bool(citation.get("doi")) or bool(citation.get("pmid")),
            f"{entry_ref} clinical guidelines must record a DOI or PMID.",
        )
    if source_classification == "peer_reviewed_study":
        _require(
            bool(citation.get("doi")) or bool(citation.get("pmid")),
            f"{entry_ref} peer-reviewed studies must record a DOI or PMID.",
        )

    _require(
        diagnosis_code in topic_tags,
        f"{entry_ref} provenance.topic_tags must include the diagnosis code {diagnosis_code!r}.",
    )
    _require(
        "educational_guidance" in usage_scope and content_section in usage_scope,
        f"{entry_ref} provenance.usage_scope must include educational_guidance and {content_section}.",
    )

    if content_section == "condition_education":
        notes = entry["content_payload"].get("everyday_language_notes")
        _require(
            isinstance(notes, list) and len(notes) >= 2 and all(isinstance(item, str) for item in notes),
            f"{entry_ref} condition_education entries must include at least two everyday_language_notes.",
        )
        _require(
            source_classification == "clinical_guideline",
            f"{entry_ref} condition_education must be grounded in a clinical guideline.",
        )
    elif content_section == "doctor_questions":
        questions = entry["content_payload"].get("questions")
        _require(
            isinstance(questions, list) and len(questions) >= 3 and all(isinstance(item, str) for item in questions),
            f"{entry_ref} doctor_questions entries must include at least three questions.",
        )
        _require(
            source_classification == "clinical_guideline",
            f"{entry_ref} doctor_questions must be grounded in a clinical guideline.",
        )
    elif content_section == "recent_advancements":
        _require(
            source_classification == "peer_reviewed_study",
            f"{entry_ref} recent_advancements must be grounded in peer-reviewed literature.",
        )
    elif content_section == "mental_health_resources":
        resource_kind = entry["content_payload"].get("resource_kind")
        _require(
            resource_kind in {"peer_support", "crisis_support", "education", "care_navigation"},
            f"{entry_ref} mental_health_resources entries must declare a supported resource_kind.",
        )


def build_launch_coverage_report(entries: list[dict[str, Any]]) -> dict[str, dict[str, list[str]]]:
    report: dict[str, dict[str, list[str]]] = {}
    for diagnosis_code in LAUNCH_DIAGNOSIS_CODES:
        scoped_entries = [
            entry for entry in entries if entry.get("diagnosis_code") == diagnosis_code
        ]
        report[diagnosis_code] = {
            "content_sections": sorted(
                {entry["content_section"] for entry in scoped_entries}
            ),
            "topic_tags": sorted(
                {
                    tag
                    for entry in scoped_entries
                    for tag in entry["provenance"].get("topic_tags", [])
                }
            ),
            "source_document_ids": sorted(
                {
                    entry["provenance"].get("source_document_id")
                    for entry in scoped_entries
                    if entry["provenance"].get("source_document_id")
                }
            ),
        }
    return report


def _validate_launch_coverage(entries: list[dict[str, Any]]) -> None:
    coverage_report = build_launch_coverage_report(entries)
    for diagnosis_code in LAUNCH_DIAGNOSIS_CODES:
        scoped_entries = [
            entry for entry in entries if entry.get("diagnosis_code") == diagnosis_code
        ]
        missing_sections = [
            section
            for section in REQUIRED_CONTENT_SECTIONS
            if not any(entry["content_section"] == section for entry in scoped_entries)
        ]
        _require(
            not missing_sections,
            f"{diagnosis_code} is missing launch educational sections: {', '.join(missing_sections)}.",
        )
        missing_topic_tags = sorted(
            REQUIRED_TOPIC_TAGS_BY_DIAGNOSIS[diagnosis_code]
            - set(coverage_report[diagnosis_code]["topic_tags"])
        )
        _require(
            not missing_topic_tags,
            f"{diagnosis_code} is missing required topic coverage: {', '.join(missing_topic_tags)}.",
        )
        _require(
            any(
                entry["content_section"] == "condition_education"
                and entry["provenance"]["source_classification"] == "clinical_guideline"
                for entry in scoped_entries
            ),
            f"{diagnosis_code} condition_education must cite a clinical guideline.",
        )
        _require(
            any(
                entry["content_section"] == "doctor_questions"
                and entry["provenance"]["source_classification"] == "clinical_guideline"
                for entry in scoped_entries
            ),
            f"{diagnosis_code} doctor_questions must cite a clinical guideline.",
        )
        _require(
            any(
                entry["content_section"] == "recent_advancements"
                and entry["provenance"]["source_classification"] == "peer_reviewed_study"
                for entry in scoped_entries
            ),
            f"{diagnosis_code} recent_advancements must cite peer-reviewed literature.",
        )
        _require(
            any(
                entry["content_section"] == "mental_health_resources"
                and entry["provenance"]["source_classification"] == "peer_reviewed_study"
                for entry in scoped_entries
            ),
            f"{diagnosis_code} mental_health_resources must cite peer-reviewed literature.",
        )


def validate_curated_content_entries(
    entries: list[dict[str, Any]],
    *,
    source_path: Path = APPROVED_SOURCES_PATH,
) -> None:
    _require(isinstance(entries, list) and bool(entries), "Approved sources must be a non-empty list.")
    for entry in entries:
        _require(isinstance(entry, dict), "Approved source entries must be objects.")
        _validate_entry(entry, source_path=source_path)
    _validate_launch_coverage(entries)


def load_curated_content_entries(
    *,
    source_path: Path = APPROVED_SOURCES_PATH,
) -> list[dict[str, Any]]:
    entries = json.loads(source_path.read_text())
    validate_curated_content_entries(entries, source_path=source_path)
    return entries


def ingest_curated_content(
    db: Session,
    *,
    source_path: Path = APPROVED_SOURCES_PATH,
) -> int:
    entries = load_curated_content_entries(source_path=source_path)
    ingestion_run_id = str(uuid4())
    ingested_count = 0

    for entry in entries:
        content_key = _build_content_key(entry)
        source_checksum = hashlib.sha256(
            json.dumps(entry, sort_keys=True).encode("utf-8")
        ).hexdigest()
        record = (
            db.query(CuratedContentEntry)
            .filter(CuratedContentEntry.content_key == content_key)
            .one_or_none()
        )

        if record is None:
            record = CuratedContentEntry(
                entry_id=str(uuid4()),
                content_key=content_key,
                locale=entry["locale"],
                diagnosis_code=entry.get("diagnosis_code"),
                content_section=entry["content_section"],
                evidence_kind=entry["evidence_kind"],
                title=entry["title"],
                summary=entry["summary"],
                source_name=entry["source_name"],
                source_url=entry["source_url"],
                source_published_at=_parse_datetime(entry.get("source_published_at")),
                reviewed_at=_parse_datetime(entry["reviewed_at"]),
                reviewer_ref=entry["reviewer_ref"],
                ingestion_run_id=ingestion_run_id,
                source_checksum=source_checksum,
                content_payload=entry["content_payload"],
                provenance=entry["provenance"],
                is_active=True,
            )
            db.add(record)
        else:
            record.locale = entry["locale"]
            record.diagnosis_code = entry.get("diagnosis_code")
            record.content_section = entry["content_section"]
            record.evidence_kind = entry["evidence_kind"]
            record.title = entry["title"]
            record.summary = entry["summary"]
            record.source_name = entry["source_name"]
            record.source_url = entry["source_url"]
            record.source_published_at = _parse_datetime(entry.get("source_published_at"))
            record.reviewed_at = _parse_datetime(entry["reviewed_at"])
            record.reviewer_ref = entry["reviewer_ref"]
            record.ingestion_run_id = ingestion_run_id
            record.source_checksum = source_checksum
            record.content_payload = entry["content_payload"]
            record.provenance = entry["provenance"]
            record.is_active = True

        ingested_count += 1

    db.commit()
    return ingested_count
