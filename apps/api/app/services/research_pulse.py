from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Protocol
from uuid import uuid4

from sqlalchemy.orm import Session, joinedload

from app.api.contracts import (
    EducationalDisclaimerPolicyModel,
    EducationalResearchHighlightModel,
    EducationalSourceReferenceModel,
    ResearchPulseClaimCitationModel,
    ResearchPulseDetailResponseModel,
    ResearchPulseFeedItemResponseModel,
    ResearchPulseFeedResponseModel,
    ResearchPulseIntegrityModel,
    ResearchPulseTopicTagModel,
)
from app.api.errors import APIContractError
from app.db.models import (
    Profile,
    Publication,
    PublicationAuthor,
    PublicationIdentifier,
    PublicationIngestRun,
    PublicationJournal,
    PublicationLicense,
    PublicationProvenance,
    PublicationReviewState,
    PublicationSummary,
    PublicationTopic,
    PublicationUserRelevance,
    SourceFeed,
    SourceQuery,
)
from app.services.research_pulse_sources import (
    CrossrefConnector,
    EuropePMCConnector,
    PMCOAConnector,
    PublicationCandidate,
    PubMedConnector,
    UrllibTransport,
    normalize_doi,
    normalize_pmcid,
    normalize_pmid,
)
from app.services.research_pulse_summarization import summarize_publications
from app.services.research_pulse_taxonomy import (
    build_profile_relevance_input,
    classify_publication_candidate,
    score_publication_for_profile,
)

RESEARCH_PULSE_SEED_PATH = (
    Path(__file__).resolve().parents[1] / "content" / "research_pulse_seed.json"
)
RESEARCH_PULSE_PIPELINE_VERSION = "research-pulse-v1"
PUBLISHED_STATE = "published"
REVIEWED_CONTENT_AVAILABLE = "reviewed_content_available"
LIMITED_COVERAGE = "limited"
DISCLAIMER_TEXT = (
    "OneRhythm is educational only. Research Pulse does not diagnose, interpret ECGs, or recommend treatment."
)
ALLOWED_SOURCE_CLASSIFICATIONS = {
    "peer_reviewed_study",
    "clinical_guideline",
    "institutional_reference",
    "founder_narrative",
    "internal",
}
ALLOWED_PUBLISHER_KINDS = {
    "journal",
    "professional_society",
    "health_system",
    "institution",
    "onerhythm_editorial",
    "founder",
    "internal",
}
EXCLUDED_PUBLIC_SOURCE_CLASSIFICATIONS = {"founder_narrative", "internal"}
GUIDELINE_HINTS = (
    "guideline",
    "consensus",
    "scientific statement",
    "position paper",
)
INTERNAL_SOURCE_HINTS = (
    "onerhythm",
    "github.com/daftpixie/onerhythm",
    "localhost",
    "127.0.0.1",
)
PROHIBITED_SUMMARY_PATTERNS = [
    r"\byour ecg\b",
    r"\bwe detected\b",
    r"\bthis confirms\b",
    r"\byou should start\b",
    r"\byou should stop\b",
    r"\btreatment recommendation\b",
]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized)


def _research_pulse_disclaimer() -> EducationalDisclaimerPolicyModel:
    return EducationalDisclaimerPolicyModel(
        disclaimer_version="v1",
        disclaimer_text=DISCLAIMER_TEXT,
        placement="persistent_banner",
        dismissible=False,
        required_on_surfaces=["api_response", "web_page", "educational_panel"],
    )


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:160] or f"research-pulse-{uuid4().hex[:8]}"


def _checksum(payload: dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


def _coalesce_publication_date(*values: datetime | None) -> datetime:
    for value in values:
        if value is not None:
            return value
    return utcnow()


def _freshness_score(publication_date: datetime | None) -> float:
    if publication_date is None:
        return 0.2
    age_days = max((utcnow() - publication_date).days, 0)
    return max(0.0, 1.0 - min(age_days, 365) / 365)


def _quality_score(article_type: str | None, study_design: str | None) -> float:
    text = " ".join(filter(None, [article_type, study_design])).lower()
    if "guideline" in text or "meta-analysis" in text:
        return 1.0
    if "randomized" in text or "trial" in text:
        return 0.9
    if "cohort" in text or "systematic review" in text:
        return 0.8
    if "review" in text:
        return 0.7
    return 0.55


def _relevance_score(topic_count: int) -> float:
    return min(1.0, 0.45 + topic_count * 0.15)


def _assert_summary_guardrails(payload: dict[str, Any]) -> None:
    text_surfaces = [
        payload.get("short_summary", ""),
        payload.get("plain_language_explanation", ""),
        payload.get("plain_title", ""),
        payload.get("why_it_matters", ""),
        payload.get("what_this_does_not_prove", ""),
        payload.get("what_researchers_studied", ""),
        payload.get("what_they_found", ""),
        payload.get("important_limits", ""),
        payload.get("study_type", ""),
        payload.get("population_sample_size", "") or "",
        *payload.get("questions_to_ask_your_doctor", []),
        payload.get("who_this_may_apply_to", ""),
        *payload.get("uncertainty_notes", []),
    ]
    for text in text_surfaces:
        lowered = text.lower()
        for pattern in PROHIBITED_SUMMARY_PATTERNS:
            if re.search(pattern, lowered):
                raise ValueError(f"Research Pulse content violates guardrail pattern: {pattern}")


@dataclass(frozen=True)
class ResearchPulseDiscoveredRecord:
    source_system: str
    query_key: str
    payload: dict[str, Any]


@dataclass(frozen=True)
class ResearchPulseSeedValidationError(ValueError):
    message: str

    def __str__(self) -> str:
        return self.message


def _ensure_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _latest_review_state(publication: Publication) -> PublicationReviewState | None:
    if not publication.review_states:
        return None
    return max(
        publication.review_states,
        key=lambda state: (
            _ensure_utc(state.reviewed_at) or datetime.min.replace(tzinfo=timezone.utc),
            _ensure_utc(state.created_at) or datetime.min.replace(tzinfo=timezone.utc),
        ),
    )


def _primary_provenance_records(publication: Publication) -> list[PublicationProvenance]:
    return [
        record
        for record in publication.provenance_records
        if record.publication_summary_id is None
    ]


def _normalized_publication_summary(
    publication: Publication,
    *,
    locale: str,
) -> PublicationSummary | None:
    return next((summary for summary in publication.summaries if summary.locale == locale), None)


def _source_typing_from_payload(
    publication: Publication,
) -> tuple[str | None, str | None]:
    for record in _primary_provenance_records(publication):
        payload = record.raw_payload_json
        if isinstance(payload, dict):
            source_classification = payload.get("source_classification")
            publisher_kind = payload.get("publisher_kind")
            if (
                isinstance(source_classification, str)
                and source_classification in ALLOWED_SOURCE_CLASSIFICATIONS
            ) or (
                isinstance(publisher_kind, str)
                and publisher_kind in ALLOWED_PUBLISHER_KINDS
            ):
                return (
                    source_classification if isinstance(source_classification, str) else None,
                    publisher_kind if isinstance(publisher_kind, str) else None,
                )
    return None, None


def _infer_source_classification(publication: Publication) -> str:
    explicit_classification, _ = _source_typing_from_payload(publication)
    if explicit_classification in ALLOWED_SOURCE_CLASSIFICATIONS:
        return explicit_classification

    source_urls = [
        publication.source_url,
        *[record.source_url for record in _primary_provenance_records(publication)],
    ]
    lowered_urls = " ".join(url.lower() for url in source_urls if url)
    if any(marker in lowered_urls for marker in INTERNAL_SOURCE_HINTS):
        return "internal"

    title_haystack = " ".join(
        filter(None, [publication.title, publication.article_type, publication.study_design])
    ).lower()
    if any(marker in title_haystack for marker in GUIDELINE_HINTS):
        return "clinical_guideline"
    if publication.is_peer_reviewed:
        return "peer_reviewed_study"
    return "institutional_reference"


def _infer_publisher_kind(publication: Publication, *, source_classification: str) -> str:
    _, explicit_publisher_kind = _source_typing_from_payload(publication)
    if explicit_publisher_kind in ALLOWED_PUBLISHER_KINDS:
        return explicit_publisher_kind
    if source_classification == "internal":
        return "internal"
    if source_classification == "founder_narrative":
        return "founder"
    if source_classification == "clinical_guideline":
        return "professional_society"
    if source_classification == "peer_reviewed_study":
        return "journal"
    return "institution"


def _summary_origin(summary: PublicationSummary | None) -> str:
    if summary is None:
        return "automated_summary"
    if summary.pipeline_version.startswith("research-pulse-editorial"):
        return "reviewed_editorial"
    return "automated_summary"


def _has_source_identifier(publication: Publication) -> bool:
    return bool(
        _find_identifier(publication, "doi")
        or _find_identifier(publication, "pmid")
        or _find_identifier(publication, "pmcid")
        or publication.source_url
    )


def _summary_claim_provenance_records(
    publication: Publication,
    *,
    summary: PublicationSummary | None,
) -> list[PublicationProvenance]:
    if summary is None:
        return []
    return [
        record
        for record in publication.provenance_records
        if record.publication_summary_id == summary.publication_summary_id
        and record.citation_label
    ]


def _assess_publication_integrity(
    publication: Publication,
    *,
    locale: str,
) -> ResearchPulseIntegrityModel:
    summary = _normalized_publication_summary(publication, locale=locale)
    review_state = _latest_review_state(publication)
    source_classification = _infer_source_classification(publication)
    publisher_kind = _infer_publisher_kind(
        publication, source_classification=source_classification
    )
    primary_provenance_records = _primary_provenance_records(publication)
    claim_records = _summary_claim_provenance_records(publication, summary=summary)
    summary_claims = summary.source_claims_json if summary is not None else []
    computed_provenance_complete = bool(primary_provenance_records) and all(
        bool(record.source_url) and (
            record.raw_payload_json is not None or record.checksum or record.external_id
        )
        for record in primary_provenance_records
    )
    computed_citation_complete = bool(summary_claims) and bool(claim_records)
    provenance_complete = bool(review_state and review_state.provenance_complete) and computed_provenance_complete
    citation_complete = bool(review_state and review_state.citation_complete) and computed_citation_complete
    human_reviewed = bool(review_state and review_state.reviewer_ref and review_state.reviewed_at)
    adequate_source_grounding = (
        summary is not None
        and not publication.is_preprint
        and not publication.is_retracted
        and not publication.is_expression_of_concern
        and source_classification not in EXCLUDED_PUBLIC_SOURCE_CLASSIFICATIONS
        and computed_provenance_complete
        and _has_source_identifier(publication)
        and publication.source_url.startswith("https://")
    )
    if (
        publication.is_preprint
        or publication.is_retracted
        or publication.is_expression_of_concern
        or source_classification in EXCLUDED_PUBLIC_SOURCE_CLASSIFICATIONS
    ):
        trust_state = "excluded"
    elif (
        adequate_source_grounding
        and review_state is not None
        and review_state.state == PUBLISHED_STATE
        and review_state.guardrail_status == "passed"
        and provenance_complete
        and citation_complete
        and human_reviewed
    ):
        trust_state = "verified"
    else:
        trust_state = "limited"

    return ResearchPulseIntegrityModel(
        summary_origin=_summary_origin(summary),
        human_reviewed=human_reviewed,
        review_state=review_state.state if review_state else "draft",
        guardrail_status=review_state.guardrail_status if review_state else "pending",
        source_classification=source_classification,
        publisher_kind=publisher_kind,
        provenance_complete=provenance_complete,
        citation_complete=citation_complete,
        adequate_source_grounding=adequate_source_grounding,
        trust_state=trust_state,
        reviewed_at=_ensure_utc(review_state.reviewed_at) if review_state else None,
        reviewer_ref=review_state.reviewer_ref if review_state else None,
    )


def _seed_entry_ref(entry: dict[str, Any]) -> str:
    article = entry.get("article", {})
    return str(article.get("title") or entry.get("slug") or "research_pulse_entry")


def _validate_seed_entry(entry: dict[str, Any]) -> None:
    entry_ref = _seed_entry_ref(entry)
    article_payload = entry.get("article")
    source_payload = entry.get("source")
    summary_payload = entry.get("summary")
    publication_payload = entry.get("publication")
    if not isinstance(article_payload, dict):
        raise ResearchPulseSeedValidationError(f"{entry_ref} is missing article metadata.")
    if not isinstance(source_payload, dict):
        raise ResearchPulseSeedValidationError(f"{entry_ref} is missing source metadata.")
    if not isinstance(summary_payload, dict):
        raise ResearchPulseSeedValidationError(f"{entry_ref} is missing summary metadata.")
    if not isinstance(publication_payload, dict):
        raise ResearchPulseSeedValidationError(f"{entry_ref} is missing publication metadata.")

    source_classification = source_payload.get("source_classification")
    publisher_kind = source_payload.get("publisher_kind")
    if source_classification not in ALLOWED_SOURCE_CLASSIFICATIONS:
        raise ResearchPulseSeedValidationError(
            f"{entry_ref} must declare a supported source_classification."
        )
    if publisher_kind not in ALLOWED_PUBLISHER_KINDS:
        raise ResearchPulseSeedValidationError(
            f"{entry_ref} must declare a supported publisher_kind."
        )
    if not isinstance(source_payload.get("source_url"), str) or not source_payload["source_url"].startswith(
        "https://"
    ):
        raise ResearchPulseSeedValidationError(f"{entry_ref} must use an https source_url.")
    if source_payload.get("raw_payload") is None:
        raise ResearchPulseSeedValidationError(f"{entry_ref} must preserve raw source payload metadata.")

    publish_state = publication_payload.get("publish_state") or summary_payload.get(
        "summary_status", PUBLISHED_STATE
    )
    has_identifier = bool(
        article_payload.get("canonical_doi")
        or article_payload.get("canonical_pmid")
        or source_payload.get("external_id")
    )
    if publish_state == PUBLISHED_STATE:
        if source_classification in EXCLUDED_PUBLIC_SOURCE_CLASSIFICATIONS:
            raise ResearchPulseSeedValidationError(
                f"{entry_ref} cannot be published from {source_classification} source typing."
            )
        if article_payload.get("is_preprint") or not article_payload.get("is_peer_reviewed", True):
            raise ResearchPulseSeedValidationError(
                f"{entry_ref} cannot be published without peer-reviewed journal or guideline grounding."
            )
        if article_payload.get("is_retracted") or article_payload.get("is_expression_of_concern"):
            raise ResearchPulseSeedValidationError(
                f"{entry_ref} cannot be published when retracted or flagged with expression of concern."
            )
        if not summary_payload.get("reviewer_ref") or not summary_payload.get("reviewed_at"):
            raise ResearchPulseSeedValidationError(
                f"{entry_ref} published items must record reviewer_ref and reviewed_at."
            )
        if not summary_payload.get("claim_citations"):
            raise ResearchPulseSeedValidationError(
                f"{entry_ref} published items must include claim_citations."
            )
        if not has_identifier and source_classification not in {"institutional_reference", "clinical_guideline"}:
            raise ResearchPulseSeedValidationError(
                f"{entry_ref} published items must include a DOI, PMID, or verified source identifier."
            )


def _candidate_has_adequate_source_grounding(candidate: PublicationCandidate) -> bool:
    return bool(
        candidate.title
        and candidate.source_url.startswith("https://")
        and candidate.provenance_records
        and (
            normalize_doi(candidate.canonical_doi)
            or normalize_pmid(candidate.canonical_pmid)
            or normalize_pmcid(candidate.canonical_pmcid)
        )
        and not candidate.is_preprint
        and candidate.is_peer_reviewed
        and not candidate.is_retracted
        and not candidate.is_expression_of_concern
    )

class ResearchPulseSourceAdapter(Protocol):
    def discover(self) -> list[ResearchPulseDiscoveredRecord]:
        ...


DEFAULT_SOURCE_FEEDS = [
    {
        "slug": "pubmed-eutils",
        "source_system": "pubmed",
        "display_name": "PubMed E-utilities",
        "base_url": "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/",
        "feed_kind": "eutils",
        "supports_fulltext_lookup": False,
    },
    {
        "slug": "europe-pmc",
        "source_system": "europe_pmc",
        "display_name": "Europe PMC",
        "base_url": "https://www.ebi.ac.uk/europepmc/webservices/rest/",
        "feed_kind": "api",
        "supports_fulltext_lookup": True,
    },
    {
        "slug": "crossref",
        "source_system": "crossref",
        "display_name": "Crossref",
        "base_url": "https://api.crossref.org/works/",
        "feed_kind": "api",
        "supports_fulltext_lookup": False,
    },
    {
        "slug": "pmc-oa",
        "source_system": "pmc_oa",
        "display_name": "PMC Open Access",
        "base_url": "https://pmc.ncbi.nlm.nih.gov/",
        "feed_kind": "oa_subset",
        "supports_fulltext_lookup": True,
    },
]

DEFAULT_SOURCE_QUERIES = [
    {
        "feed_slug": "pubmed-eutils",
        "query_key": "afib-ablation-recent",
        "label": "AFib ablation recent",
        "query_text": '(atrial fibrillation[Title/Abstract]) AND ablation[Title/Abstract] AND ("last 90 days"[PDat])',
        "diagnosis_code": "afib",
        "theme_key": "ablation",
    },
    {
        "feed_slug": "pubmed-eutils",
        "query_key": "vt-innovation-recent",
        "label": "VT innovation recent",
        "query_text": '(ventricular tachycardia[Title/Abstract]) AND (mapping OR innovation OR catheter)[Title/Abstract] AND ("last 90 days"[PDat])',
        "diagnosis_code": "vt",
        "theme_key": "innovation",
    },
]


def _ensure_source_feed(db: Session) -> SourceFeed:
    record = db.query(SourceFeed).filter(SourceFeed.slug == "launch-reviewed-seed").one_or_none()
    if record is None:
        record = SourceFeed(
            source_feed_id=str(uuid4()),
            slug="launch-reviewed-seed",
            source_system="seed_file",
            display_name="Research Pulse launch seed",
            base_url=None,
            feed_kind="api",
            supports_fulltext_lookup=False,
            active=True,
        )
        db.add(record)
        db.flush()
    return record


def ensure_default_source_registry(db: Session) -> None:
    existing_feeds = {record.slug: record for record in db.query(SourceFeed).all()}
    for payload in DEFAULT_SOURCE_FEEDS:
        record = existing_feeds.get(payload["slug"])
        if record is None:
            db.add(
                SourceFeed(
                    source_feed_id=str(uuid4()),
                    slug=payload["slug"],
                    source_system=payload["source_system"],
                    display_name=payload["display_name"],
                    base_url=payload["base_url"],
                    feed_kind=payload["feed_kind"],
                    supports_fulltext_lookup=payload["supports_fulltext_lookup"],
                    active=True,
                )
            )
    db.flush()
    existing_queries = {record.query_key: record for record in db.query(SourceQuery).all()}
    feed_lookup = {record.slug: record for record in db.query(SourceFeed).all()}
    for payload in DEFAULT_SOURCE_QUERIES:
        if payload["query_key"] in existing_queries:
            continue
        feed = feed_lookup[payload["feed_slug"]]
        db.add(
            SourceQuery(
                source_query_id=str(uuid4()),
                source_feed_id=feed.source_feed_id,
                query_key=payload["query_key"],
                label=payload["label"],
                query_text=payload["query_text"],
                diagnosis_code=payload.get("diagnosis_code"),
                theme_key=payload.get("theme_key"),
                locale="en-US",
                exclude_preprints=True,
                poll_interval_minutes=1440,
                active=True,
            )
        )
    db.commit()


def _ensure_source_query(db: Session, *, source_feed: SourceFeed) -> SourceQuery:
    record = db.query(SourceQuery).filter(SourceQuery.query_key == "launch-reviewed-seed").one_or_none()
    if record is None:
        record = SourceQuery(
            source_query_id=str(uuid4()),
            source_feed_id=source_feed.source_feed_id,
            query_key="launch-reviewed-seed",
            label="Launch reviewed seed",
            query_text="Locally reviewed launch summaries",
            locale="en-US",
            exclude_preprints=True,
            poll_interval_minutes=1440,
            active=True,
        )
        db.add(record)
        db.flush()
    return record


def _find_identifier(publication: Publication, kind: str) -> str | None:
    for identifier in publication.identifiers:
        if identifier.identifier_kind == kind and identifier.is_canonical:
            return identifier.identifier_value
    return None


def _upsert_journal(db: Session, payload: dict[str, Any]) -> PublicationJournal | None:
    title = payload.get("journal_name")
    if not title:
        return None
    record = db.query(PublicationJournal).filter(PublicationJournal.title == title).one_or_none()
    if record is None:
        record = PublicationJournal(
            publication_journal_id=str(uuid4()),
            title=title,
            publisher_name=payload.get("publisher_name"),
            journal_home_url=payload.get("journal_home_url"),
        )
        db.add(record)
        db.flush()
    else:
        record.publisher_name = payload.get("publisher_name")
        record.journal_home_url = payload.get("journal_home_url")
        record.updated_at = utcnow()
    return record


def _upsert_publication(
    db: Session,
    *,
    article_payload: dict[str, Any],
    slug: str,
    overall_rank: float,
    freshness_score: float,
    quality_score: float,
    relevance_score: float,
) -> Publication:
    canonical_doi = article_payload.get("canonical_doi")
    canonical_pmid = article_payload.get("canonical_pmid")
    publication = None
    if canonical_doi:
        publication = (
            db.query(Publication)
            .join(PublicationIdentifier)
            .filter(
                PublicationIdentifier.identifier_kind == "doi",
                PublicationIdentifier.normalized_value == canonical_doi.lower(),
                PublicationIdentifier.is_canonical.is_(True),
            )
            .one_or_none()
        )
    if publication is None and canonical_pmid:
        publication = (
            db.query(Publication)
            .join(PublicationIdentifier)
            .filter(
                PublicationIdentifier.identifier_kind == "pmid",
                PublicationIdentifier.normalized_value == canonical_pmid,
                PublicationIdentifier.is_canonical.is_(True),
            )
            .one_or_none()
        )

    journal = _upsert_journal(db, article_payload)
    checksum = _checksum(article_payload)
    content_scope = (
        "oa_fulltext"
        if article_payload.get("fulltext_reuse_allowed") and article_payload.get("open_access_status") == "oa_fulltext_reuse"
        else "abstract_only"
    )
    if publication is None:
        publication = Publication(
            publication_id=str(uuid4()),
            publication_journal_id=journal.publication_journal_id if journal else None,
            slug=slug,
            title=article_payload["title"],
            abstract_text=article_payload.get("abstract_text"),
            content_scope=content_scope,
            oa_fulltext_storage_ref=article_payload.get("oa_fulltext_storage_ref"),
            oa_fulltext_mime_type=article_payload.get("oa_fulltext_mime_type"),
            source_url=article_payload["source_url"],
            article_type=article_payload.get("article_type"),
            study_design=article_payload.get("study_design"),
            language=article_payload.get("language", "en"),
            publication_date=_parse_datetime(article_payload.get("publication_date")),
            epub_date=_parse_datetime(article_payload.get("epub_date")),
            is_peer_reviewed=article_payload.get("is_peer_reviewed", True),
            is_preprint=article_payload.get("is_preprint", False),
            is_retracted=article_payload.get("is_retracted", False),
            is_expression_of_concern=article_payload.get("is_expression_of_concern", False),
            freshness_score=freshness_score,
            relevance_score=relevance_score,
            quality_score=quality_score,
            overall_rank=overall_rank,
            metadata_checksum=checksum,
            first_seen_at=utcnow(),
            last_seen_at=utcnow(),
        )
        db.add(publication)
        db.flush()
    else:
        publication.publication_journal_id = journal.publication_journal_id if journal else None
        publication.slug = slug
        publication.title = article_payload["title"]
        publication.abstract_text = article_payload.get("abstract_text")
        publication.content_scope = content_scope
        publication.oa_fulltext_storage_ref = article_payload.get("oa_fulltext_storage_ref")
        publication.oa_fulltext_mime_type = article_payload.get("oa_fulltext_mime_type")
        publication.source_url = article_payload["source_url"]
        publication.article_type = article_payload.get("article_type")
        publication.study_design = article_payload.get("study_design")
        publication.language = article_payload.get("language", "en")
        publication.publication_date = _parse_datetime(article_payload.get("publication_date"))
        publication.epub_date = _parse_datetime(article_payload.get("epub_date"))
        publication.is_peer_reviewed = article_payload.get("is_peer_reviewed", True)
        publication.is_preprint = article_payload.get("is_preprint", False)
        publication.is_retracted = article_payload.get("is_retracted", False)
        publication.is_expression_of_concern = article_payload.get("is_expression_of_concern", False)
        publication.freshness_score = freshness_score
        publication.relevance_score = relevance_score
        publication.quality_score = quality_score
        publication.overall_rank = overall_rank
        publication.metadata_checksum = checksum
        publication.last_seen_at = utcnow()
        publication.updated_at = utcnow()

    return publication


def _replace_identifiers(db: Session, publication: Publication, article_payload: dict[str, Any]) -> None:
    db.query(PublicationIdentifier).filter(
        PublicationIdentifier.publication_id == publication.publication_id
    ).delete()
    for kind in ("doi", "pmid", "pmcid"):
        value = article_payload.get(f"canonical_{kind}")
        if not value:
            continue
        normalized = value.lower() if kind == "doi" else value
        db.add(
            PublicationIdentifier(
                publication_identifier_id=str(uuid4()),
                publication_id=publication.publication_id,
                identifier_kind=kind,
                identifier_value=value,
                normalized_value=normalized,
                is_canonical=True,
                source_system="seed_file",
            )
        )


def _replace_identifiers_from_candidate(
    db: Session,
    publication: Publication,
    candidate: PublicationCandidate,
    *,
    source_system: str,
) -> None:
    db.query(PublicationIdentifier).filter(
        PublicationIdentifier.publication_id == publication.publication_id
    ).delete()
    for kind, value in (
        ("doi", normalize_doi(candidate.canonical_doi)),
        ("pmid", normalize_pmid(candidate.canonical_pmid)),
        ("pmcid", normalize_pmcid(candidate.canonical_pmcid)),
    ):
        if not value:
            continue
        db.add(
            PublicationIdentifier(
                publication_identifier_id=str(uuid4()),
                publication_id=publication.publication_id,
                identifier_kind=kind,
                identifier_value=value,
                normalized_value=value,
                is_canonical=True,
                source_system=source_system,
            )
        )


def _replace_authors(db: Session, publication: Publication, authors_payload: list[dict[str, Any]]) -> None:
    db.query(PublicationAuthor).filter(
        PublicationAuthor.publication_id == publication.publication_id
    ).delete()
    for position, author in enumerate(authors_payload, start=1):
        display_name = author.get("display_name") or author.get("name")
        if not display_name:
            continue
        db.add(
            PublicationAuthor(
                publication_author_id=str(uuid4()),
                publication_id=publication.publication_id,
                author_position=position,
                display_name=display_name,
                given_name=author.get("given_name"),
                family_name=author.get("family_name"),
                affiliation=author.get("affiliation"),
                orcid=author.get("orcid"),
            )
        )


def _replace_license(db: Session, publication: Publication, article_payload: dict[str, Any]) -> None:
    db.query(PublicationLicense).filter(
        PublicationLicense.publication_id == publication.publication_id
    ).delete()
    access_status = article_payload.get("open_access_status", "metadata_only")
    fulltext_allowed = article_payload.get("fulltext_reuse_allowed", False)
    db.add(
        PublicationLicense(
            publication_license_id=str(uuid4()),
            publication_id=publication.publication_id,
            license_code=article_payload.get("license_code"),
            license_name=article_payload.get("license_name"),
            license_url=article_payload.get("license_url"),
            access_status=access_status,
            permits_fulltext_storage=fulltext_allowed,
            permits_fulltext_ai_processing=fulltext_allowed,
            permits_quote_excerpt=True,
            source_system="seed_file",
            verified_at=utcnow(),
        )
    )


def _replace_topics(db: Session, publication: Publication, topics_payload: list[dict[str, Any]]) -> None:
    db.query(PublicationTopic).filter(
        PublicationTopic.publication_id == publication.publication_id
    ).delete()
    for topic in topics_payload:
        db.add(
            PublicationTopic(
                publication_topic_id=str(uuid4()),
                publication_id=publication.publication_id,
                diagnosis_code=topic.get("diagnosis_code"),
                theme_key=topic["theme_key"],
                label=topic["label"],
                confidence=float(topic.get("confidence", 1.0)),
                assignment_source=topic.get("assignment_source", "reviewer"),
                active=True,
            )
        )


def _upsert_summary(db: Session, publication: Publication, summary_payload: dict[str, Any]) -> PublicationSummary:
    _assert_summary_guardrails(summary_payload)
    content_checksum = _checksum(summary_payload)
    summary = (
        db.query(PublicationSummary)
        .filter(
            PublicationSummary.publication_id == publication.publication_id,
            PublicationSummary.locale == summary_payload.get("locale", "en-US"),
        )
        .one_or_none()
    )
    if summary is None:
        summary = PublicationSummary(
            publication_summary_id=str(uuid4()),
            publication_id=publication.publication_id,
            locale=summary_payload.get("locale", "en-US"),
            pipeline_version=summary_payload.get("pipeline_version", RESEARCH_PULSE_PIPELINE_VERSION),
            short_summary=summary_payload["short_summary"],
            plain_title=summary_payload["plain_title"],
            plain_language_explanation=summary_payload["plain_language_explanation"],
            why_it_matters=summary_payload["why_it_matters"],
            what_this_does_not_prove=summary_payload["what_this_does_not_prove"],
            what_researchers_studied=summary_payload["what_researchers_studied"],
            what_they_found=summary_payload["what_they_found"],
            important_limits=summary_payload["important_limits"],
            study_type=summary_payload["study_type"],
            population_sample_size=summary_payload.get("population_sample_size"),
            questions_to_ask_your_doctor_json=summary_payload.get("questions_to_ask_your_doctor", []),
            who_this_may_apply_to=summary_payload["who_this_may_apply_to"],
            source_claims_json=summary_payload.get("source_claims", []),
            uncertainty_notes_json=summary_payload.get("uncertainty_notes", []),
            generated_at=_parse_datetime(summary_payload.get("generated_at")) or utcnow(),
            content_checksum=content_checksum,
        )
        db.add(summary)
        db.flush()
    else:
        summary.pipeline_version = summary_payload.get("pipeline_version", RESEARCH_PULSE_PIPELINE_VERSION)
        summary.short_summary = summary_payload["short_summary"]
        summary.plain_title = summary_payload["plain_title"]
        summary.plain_language_explanation = summary_payload["plain_language_explanation"]
        summary.why_it_matters = summary_payload["why_it_matters"]
        summary.what_this_does_not_prove = summary_payload["what_this_does_not_prove"]
        summary.what_researchers_studied = summary_payload["what_researchers_studied"]
        summary.what_they_found = summary_payload["what_they_found"]
        summary.important_limits = summary_payload["important_limits"]
        summary.study_type = summary_payload["study_type"]
        summary.population_sample_size = summary_payload.get("population_sample_size")
        summary.questions_to_ask_your_doctor_json = summary_payload.get("questions_to_ask_your_doctor", [])
        summary.who_this_may_apply_to = summary_payload["who_this_may_apply_to"]
        summary.source_claims_json = summary_payload.get("source_claims", [])
        summary.uncertainty_notes_json = summary_payload.get("uncertainty_notes", [])
        summary.generated_at = _parse_datetime(summary_payload.get("generated_at")) or utcnow()
        summary.content_checksum = content_checksum
        summary.updated_at = utcnow()
    return summary


def _replace_provenance(
    db: Session,
    *,
    publication: Publication,
    summary: PublicationSummary,
    source_feed: SourceFeed,
    source_query: SourceQuery,
    ingest_run: PublicationIngestRun,
    source_payload: dict[str, Any],
    claim_citations: list[dict[str, Any]],
) -> None:
    db.query(PublicationProvenance).filter(
        PublicationProvenance.publication_id == publication.publication_id
    ).delete()
    source_raw_payload = source_payload.get("raw_payload", {})
    if not isinstance(source_raw_payload, dict):
        source_raw_payload = {"value": source_raw_payload}
    source_raw_payload = {
        **source_raw_payload,
        "source_classification": source_payload.get("source_classification"),
        "publisher_kind": source_payload.get("publisher_kind"),
    }
    db.add(
        PublicationProvenance(
            publication_provenance_id=str(uuid4()),
            publication_id=publication.publication_id,
            source_feed_id=source_feed.source_feed_id,
            source_query_id=source_query.source_query_id,
            publication_ingest_run_id=ingest_run.publication_ingest_run_id,
            source_system=source_payload["source_system"],
            external_id=source_payload.get("external_id"),
            source_url=source_payload["source_url"],
            content_source_kind="metadata",
            reuse_status="metadata_only",
            citation_label=source_payload.get("source_system"),
            raw_payload_json=source_raw_payload,
            checksum=_checksum(source_raw_payload) if source_raw_payload else None,
            fetched_at=_parse_datetime(source_payload.get("fetched_at")) or utcnow(),
        )
    )
    for citation in claim_citations:
        db.add(
            PublicationProvenance(
                publication_provenance_id=str(uuid4()),
                publication_id=publication.publication_id,
                publication_summary_id=summary.publication_summary_id,
                source_feed_id=source_feed.source_feed_id,
                source_query_id=source_query.source_query_id,
                publication_ingest_run_id=ingest_run.publication_ingest_run_id,
                source_system=source_payload["source_system"],
                external_id=citation.get("pmid") or citation.get("doi"),
                source_url=citation["source_url"],
                content_source_kind=citation["source_span_kind"],
                reuse_status="oa_fulltext_reuse" if citation["source_span_kind"] == "oa_fulltext" else "metadata_only",
                citation_label=citation["citation_label"],
                source_quote_locator=citation.get("source_quote_locator"),
                raw_payload_json=None,
                checksum=None,
                fetched_at=_parse_datetime(source_payload.get("fetched_at")) or utcnow(),
            )
        )


def _replace_candidate_provenance(
    db: Session,
    *,
    publication: Publication,
    source_feed: SourceFeed,
    source_query: SourceQuery,
    ingest_run: PublicationIngestRun,
    candidate: PublicationCandidate,
    publication_summary_id: str | None = None,
) -> None:
    db.query(PublicationProvenance).filter(
        PublicationProvenance.publication_id == publication.publication_id
    ).delete()
    for provenance in candidate.provenance_records:
        checksum = (
            _checksum(provenance.raw_payload)
            if provenance.raw_payload is not None and isinstance(provenance.raw_payload, dict)
            else None
        )
        db.add(
            PublicationProvenance(
                publication_provenance_id=str(uuid4()),
                publication_id=publication.publication_id,
                publication_summary_id=publication_summary_id,
                source_feed_id=source_feed.source_feed_id,
                source_query_id=source_query.source_query_id,
                publication_ingest_run_id=ingest_run.publication_ingest_run_id,
                source_system=provenance.source_system,
                external_id=provenance.external_id,
                source_url=provenance.source_url,
                content_source_kind=provenance.content_source_kind,
                reuse_status=provenance.reuse_status,
                citation_label=provenance.citation_label,
                source_quote_locator=provenance.source_quote_locator,
                raw_payload_json=provenance.raw_payload,
                checksum=checksum,
                fetched_at=provenance.fetched_at,
            )
        )


def _replace_review_state(
    db: Session,
    *,
    publication: Publication,
    summary: PublicationSummary,
    source_payload: dict[str, Any],
    summary_payload: dict[str, Any],
    publication_payload: dict[str, Any],
) -> None:
    db.query(PublicationReviewState).filter(
        PublicationReviewState.publication_id == publication.publication_id
    ).delete()
    state = publication_payload.get("publish_state") or summary_payload.get("summary_status", PUBLISHED_STATE)
    review = PublicationReviewState(
        publication_review_state_id=str(uuid4()),
        publication_id=publication.publication_id,
        publication_summary_id=summary.publication_summary_id,
        state=state,
        guardrail_status="passed",
        provenance_complete=bool(source_payload.get("raw_payload")) and bool(source_payload.get("source_url")),
        citation_complete=bool(summary_payload.get("claim_citations")),
        reviewer_ref=summary_payload.get("reviewer_ref"),
        reviewer_note=publication_payload.get("reviewer_note"),
        reviewed_at=_parse_datetime(summary_payload.get("reviewed_at")) or utcnow(),
    )
    db.add(review)


def ingest_research_pulse_seed(
    db: Session,
    *,
    source_path: Path = RESEARCH_PULSE_SEED_PATH,
) -> int:
    entries = json.loads(source_path.read_text(encoding="utf-8"))
    for entry in entries:
        _validate_seed_entry(entry)
    source_feed = _ensure_source_feed(db)
    source_query = _ensure_source_query(db, source_feed=source_feed)
    ingest_run = PublicationIngestRun(
        publication_ingest_run_id=str(uuid4()),
        source_feed_id=source_feed.source_feed_id,
        source_query_id=source_query.source_query_id,
        started_at=utcnow(),
        status="running",
        items_seen=len(entries),
        items_accepted=0,
        items_rejected=0,
        created_at=utcnow(),
    )
    db.add(ingest_run)
    db.flush()

    for entry in entries:
        article_payload = entry["article"]
        if article_payload.get("is_preprint") or entry.get("is_preprint"):
            ingest_run.items_rejected += 1
            continue
        if not article_payload.get("is_peer_reviewed", True):
            ingest_run.items_rejected += 1
            continue

        publication_payload = entry["publication"]
        topic_count = len(entry.get("topics", []))
        freshness_score = float(publication_payload.get("freshness_score", _freshness_score(_parse_datetime(article_payload.get("publication_date")))))
        quality_score = float(publication_payload.get("quality_score", _quality_score(article_payload.get("article_type"), article_payload.get("study_design"))))
        relevance_score = float(publication_payload.get("relevance_score", _relevance_score(topic_count)))
        overall_rank = float(
            publication_payload.get(
                "overall_rank",
                round(freshness_score * 0.4 + quality_score * 0.35 + relevance_score * 0.25, 4),
            )
        )
        slug = publication_payload.get("slug") or _slugify(entry["summary"]["plain_title"])

        publication = _upsert_publication(
            db,
            article_payload=article_payload,
            slug=slug,
            overall_rank=overall_rank,
            freshness_score=freshness_score,
            quality_score=quality_score,
            relevance_score=relevance_score,
        )
        publication.published_at = _parse_datetime(publication_payload.get("published_at")) or _coalesce_publication_date(
            publication.publication_date, utcnow()
        )
        publication.featured_rank = publication_payload.get("featured_rank")
        publication.stale_after = _parse_datetime(publication_payload.get("stale_after")) or (
            _coalesce_publication_date(publication.publication_date, utcnow()) + timedelta(days=180)
        )
        publication.superseded_by_publication_id = publication_payload.get("superseded_by_publication_id")

        _replace_identifiers(db, publication, article_payload)
        _replace_authors(db, publication, article_payload.get("authors", []))
        _replace_license(db, publication, article_payload)
        _replace_topics(db, publication, entry.get("topics", []))

        summary = _upsert_summary(db, publication, entry["summary"])
        _replace_provenance(
            db,
            publication=publication,
            summary=summary,
            source_feed=source_feed,
            source_query=source_query,
            ingest_run=ingest_run,
            source_payload=entry["source"],
            claim_citations=entry["summary"].get("claim_citations", []),
        )
        _replace_review_state(
            db,
            publication=publication,
            summary=summary,
            source_payload=entry["source"],
            summary_payload=entry["summary"],
            publication_payload=publication_payload,
        )

        ingest_run.items_accepted += 1

    ingest_run.status = "completed"
    ingest_run.completed_at = utcnow()
    db.commit()
    return ingest_run.items_accepted


def _build_topic_tag(topic: PublicationTopic) -> ResearchPulseTopicTagModel:
    return ResearchPulseTopicTagModel(
        slug=_slugify(f"{topic.theme_key}-{topic.label}"),
        label=topic.label,
        diagnosis_code=topic.diagnosis_code,
        theme_key=topic.theme_key,
    )


def _build_source_reference(summary: PublicationSummary) -> EducationalSourceReferenceModel:
    publication = summary.publication
    journal_name = publication.publication_journal.title if publication.publication_journal else "Research Pulse"
    integrity = _assess_publication_integrity(publication, locale=summary.locale)
    source_document_id = (
        _find_identifier(publication, "doi")
        or _find_identifier(publication, "pmid")
        or publication.slug
    )
    topic_tags = sorted(
        {
            value
            for topic in publication.topics
            if topic.active
            for value in (topic.diagnosis_code, topic.theme_key)
            if value
        }
    )
    return EducationalSourceReferenceModel(
        source_reference_id=summary.publication_summary_id,
        registry_source_id=None,
        source_document_id=source_document_id,
        source_name=journal_name,
        source_url=publication.source_url,
        title=publication.title,
        published_at=publication.publication_date,
        reviewed_at=next((state.reviewed_at for state in publication.review_states if state.reviewed_at), summary.generated_at),
        reviewer_ref=next((state.reviewer_ref for state in publication.review_states if state.reviewer_ref), "research-pulse-review"),
        ingestion_run_id=next(
            (record.publication_ingest_run_id for record in publication.provenance_records if record.publication_ingest_run_id),
            "research-pulse-published",
        ),
        source_checksum=summary.content_checksum,
        monthly_update_cycle="rolling",
        approval_status=integrity.review_state,
        source_classification=integrity.source_classification,
        publisher_kind=integrity.publisher_kind,
        citation={
            "citation_label": publication.title,
            "doi": _find_identifier(publication, "doi"),
            "pmid": _find_identifier(publication, "pmid"),
        },
        topic_tags=topic_tags,
        usage_scope=["research_pulse_feed", "research_pulse_detail"],
        content_section="recent_advancements",
        evidence_kind="research_update",
    )


def _build_feed_item(
    publication: Publication,
    *,
    locale: str,
    integrity: ResearchPulseIntegrityModel,
) -> ResearchPulseFeedItemResponseModel:
    summary = next(summary for summary in publication.summaries if summary.locale == locale)
    diagnosis_tags = [_build_topic_tag(topic) for topic in publication.topics if topic.active and topic.diagnosis_code]
    theme_tags = [_build_topic_tag(topic) for topic in publication.topics if topic.active and not topic.diagnosis_code]
    journal_name = publication.publication_journal.title if publication.publication_journal else None
    return ResearchPulseFeedItemResponseModel(
        publication_id=publication.publication_id,
        slug=publication.slug,
        title=summary.plain_title,
        summary=summary.short_summary,
        why_it_matters=summary.why_it_matters,
        journal_name=journal_name,
        study_type=summary.study_type,
        published_at=publication.published_at or summary.generated_at,
        source_url=publication.source_url,
        doi=_find_identifier(publication, "doi"),
        pmid=_find_identifier(publication, "pmid"),
        diagnosis_tags=diagnosis_tags,
        theme_tags=theme_tags,
        integrity=integrity,
        disclaimer_required=True,
    )


def _filter_verified_publications(
    records: list[Publication],
    *,
    locale: str,
) -> tuple[list[tuple[Publication, ResearchPulseIntegrityModel]], int]:
    verified_records: list[tuple[Publication, ResearchPulseIntegrityModel]] = []
    excluded_items_count = 0
    for record in records:
        integrity = _assess_publication_integrity(record, locale=locale)
        if integrity.trust_state == "verified":
            verified_records.append((record, integrity))
        else:
            excluded_items_count += 1
    return verified_records, excluded_items_count


def list_research_pulse_publications(
    db: Session,
    *,
    locale: str = "en-US",
    diagnosis_code: str | None = None,
    theme_key: str | None = None,
    page: int = 1,
    page_size: int = 12,
) -> ResearchPulseFeedResponseModel:
    query = (
        db.query(Publication)
        .options(
            joinedload(Publication.publication_journal),
            joinedload(Publication.identifiers),
            joinedload(Publication.topics),
            joinedload(Publication.summaries),
            joinedload(Publication.review_states),
        )
        .join(PublicationSummary)
        .join(PublicationReviewState)
        .filter(
            PublicationSummary.locale == locale,
            PublicationReviewState.state == PUBLISHED_STATE,
            Publication.is_preprint.is_(False),
            Publication.is_retracted.is_(False),
            Publication.is_expression_of_concern.is_(False),
        )
    )
    if diagnosis_code or theme_key:
        query = query.join(PublicationTopic)
        if diagnosis_code:
            query = query.filter(PublicationTopic.diagnosis_code == diagnosis_code)
        if theme_key:
            query = query.filter(PublicationTopic.theme_key == theme_key)

    ordered_records = (
        query.distinct().order_by(
            Publication.featured_rank.asc().nulls_last(),
            Publication.overall_rank.desc(),
            Publication.published_at.desc().nulls_last(),
        )
        .all()
    )
    verified_records, excluded_items_count = _filter_verified_publications(
        ordered_records,
        locale=locale,
    )
    total_items = len(verified_records)
    page_records = verified_records[(page - 1) * page_size : page * page_size]
    return ResearchPulseFeedResponseModel(
        items=[
            _build_feed_item(record, locale=locale, integrity=integrity)
            for record, integrity in page_records
        ],
        page=page,
        page_size=page_size,
        total_items=total_items,
        coverage_state=(
            REVIEWED_CONTENT_AVAILABLE
            if total_items > 0 and excluded_items_count == 0
            else LIMITED_COVERAGE
        ),
        excluded_items_count=excluded_items_count,
    )


def _get_profile_for_user(db: Session, *, user_id: str) -> Profile:
    profile = (
        db.query(Profile)
        .filter(
            Profile.user_id == user_id,
            Profile.deleted_at.is_(None),
        )
        .one_or_none()
    )
    if profile is None:
        raise APIContractError(
            code="profile_not_found",
            message="Create your self-reported profile before opening a personalized research feed.",
            status_code=404,
        )
    return profile


def list_personalized_research_pulse_publications(
    db: Session,
    *,
    user_id: str,
    locale: str | None = None,
    theme_key: str | None = None,
    page: int = 1,
    page_size: int = 12,
) -> ResearchPulseFeedResponseModel:
    profile = _get_profile_for_user(db, user_id=user_id)
    effective_locale = locale or profile.user.preferred_language

    relevance_count = (
        db.query(PublicationUserRelevance)
        .filter(
            PublicationUserRelevance.profile_id == profile.profile_id,
            PublicationUserRelevance.locale == effective_locale,
        )
        .count()
    )
    if relevance_count == 0:
        recompute_publication_user_relevance(
            db,
            profile_id=profile.profile_id,
            locale=effective_locale,
        )

    query = (
        db.query(Publication)
        .options(
            joinedload(Publication.publication_journal),
            joinedload(Publication.identifiers),
            joinedload(Publication.topics),
            joinedload(Publication.summaries),
            joinedload(Publication.review_states),
            joinedload(Publication.user_relevance_records),
        )
        .join(PublicationSummary)
        .join(PublicationReviewState)
        .join(PublicationUserRelevance)
        .filter(
            PublicationSummary.locale == effective_locale,
            PublicationReviewState.state == PUBLISHED_STATE,
            PublicationUserRelevance.profile_id == profile.profile_id,
            PublicationUserRelevance.locale == effective_locale,
            Publication.is_preprint.is_(False),
            Publication.is_retracted.is_(False),
            Publication.is_expression_of_concern.is_(False),
        )
    )
    if theme_key:
        query = query.join(PublicationTopic).filter(PublicationTopic.theme_key == theme_key)

    ordered_records = (
        query.distinct().order_by(
            PublicationUserRelevance.relevance_score.desc(),
            Publication.overall_rank.desc(),
            Publication.published_at.desc().nulls_last(),
        )
        .all()
    )
    verified_records, excluded_items_count = _filter_verified_publications(
        ordered_records,
        locale=effective_locale,
    )
    total_items = len(verified_records)
    page_records = verified_records[(page - 1) * page_size : page * page_size]
    return ResearchPulseFeedResponseModel(
        items=[
            _build_feed_item(record, locale=effective_locale, integrity=integrity)
            for record, integrity in page_records
        ],
        page=page,
        page_size=page_size,
        total_items=total_items,
        coverage_state=(
            REVIEWED_CONTENT_AVAILABLE
            if total_items > 0 and excluded_items_count == 0
            else LIMITED_COVERAGE
        ),
        excluded_items_count=excluded_items_count,
    )


def get_research_pulse_publication(
    db: Session,
    *,
    slug: str,
    locale: str = "en-US",
) -> ResearchPulseDetailResponseModel | None:
    publication = (
        db.query(Publication)
        .options(
            joinedload(Publication.publication_journal),
            joinedload(Publication.identifiers),
            joinedload(Publication.topics),
            joinedload(Publication.summaries),
            joinedload(Publication.review_states),
            joinedload(Publication.provenance_records),
        )
        .join(PublicationSummary)
        .join(PublicationReviewState)
        .filter(
            Publication.slug == slug,
            PublicationSummary.locale == locale,
            PublicationReviewState.state == PUBLISHED_STATE,
        )
        .one_or_none()
    )
    if publication is None:
        return None

    integrity = _assess_publication_integrity(publication, locale=locale)
    if integrity.trust_state != "verified":
        return None

    feed_item = _build_feed_item(publication, locale=locale, integrity=integrity)
    summary = next(summary for summary in publication.summaries if summary.locale == locale)
    claim_records = [
        record
        for record in publication.provenance_records
        if record.publication_summary_id == summary.publication_summary_id and record.citation_label
    ]
    return ResearchPulseDetailResponseModel(
        **feed_item.model_dump(),
        short_summary=summary.short_summary,
        plain_language_explanation=summary.plain_language_explanation,
        what_this_does_not_prove=summary.what_this_does_not_prove,
        what_researchers_studied=summary.what_researchers_studied,
        what_they_found=summary.what_they_found,
        important_limits=summary.important_limits,
        population_sample_size=summary.population_sample_size,
        questions_to_ask_your_doctor=summary.questions_to_ask_your_doctor_json,
        who_this_may_apply_to=summary.who_this_may_apply_to,
        uncertainty_notes=summary.uncertainty_notes_json,
        source_references=[_build_source_reference(summary)],
        claim_citations=[
            ResearchPulseClaimCitationModel(
                claim_key=f"claim-{index + 1}",
                citation_label=record.citation_label or "Source citation",
                source_url=record.source_url,
                source_span_kind=record.content_source_kind,
                source_quote_locator=record.source_quote_locator,
                pmid=_find_identifier(publication, "pmid"),
                doi=_find_identifier(publication, "doi"),
            )
            for index, record in enumerate(claim_records)
        ],
        disclaimer=_research_pulse_disclaimer(),
    )


def list_profile_research_highlights(
    db: Session,
    *,
    locale: str,
    diagnosis_code: str,
    profile_keywords: list[str],
    limit: int = 3,
) -> list[EducationalResearchHighlightModel]:
    feed = list_research_pulse_publications(
        db,
        locale=locale,
        diagnosis_code=diagnosis_code,
        page=1,
        page_size=max(limit * 3, limit),
    )
    keyword_terms = {keyword.strip().lower() for keyword in profile_keywords if keyword.strip()}
    scored_items: list[tuple[float, ResearchPulseFeedItemResponseModel]] = []
    for item in feed.items:
        publication_topics = [
            {
                "diagnosis_code": tag.diagnosis_code,
                "theme_key": tag.theme_key,
                "label": tag.label,
            }
            for tag in [*item.diagnosis_tags, *item.theme_tags]
        ]
        score, _ = score_publication_for_profile(
            publication_title=item.title,
            publication_summary=item.summary,
            publication_topics=publication_topics,
            profile_relevance_input={
                "diagnosis_code": diagnosis_code,
                "physical_symptoms": list(keyword_terms),
                "emotional_context": list(keyword_terms),
                "ablation_count": 0,
                "has_implantable_device": False,
                "current_medications": [],
                "prior_procedures": [],
                "personal_narrative": " ".join(keyword_terms),
            },
        )
        scored_items.append((score, item))
    scored_items.sort(key=lambda pair: (pair[0], pair[1].published_at), reverse=True)
    selected = [item for _, item in scored_items[:limit]]
    return [
        EducationalResearchHighlightModel(
            source_reference_id=item.publication_id,
            title=item.title,
            summary=item.summary,
            source_name=item.journal_name or "Research Pulse",
            source_url=item.source_url,
            published_at=item.published_at,
        )
        for item in selected
    ]


def _candidate_to_article_payload(candidate: PublicationCandidate) -> dict[str, Any]:
    return {
        "canonical_doi": normalize_doi(candidate.canonical_doi),
        "canonical_pmid": normalize_pmid(candidate.canonical_pmid),
        "canonical_pmcid": normalize_pmcid(candidate.canonical_pmcid),
        "title": candidate.title,
        "abstract_text": candidate.abstract_text,
        "journal_name": candidate.journal_name,
        "publisher_name": candidate.publisher_name,
        "publication_date": candidate.publication_date.isoformat() if candidate.publication_date else None,
        "epub_date": candidate.epub_date.isoformat() if candidate.epub_date else None,
        "article_type": candidate.article_type,
        "study_design": candidate.study_design,
        "language": candidate.language,
        "authors": candidate.authors,
        "source_url": candidate.source_url,
        "is_peer_reviewed": candidate.is_peer_reviewed,
        "is_preprint": candidate.is_preprint,
        "is_retracted": candidate.is_retracted,
        "is_expression_of_concern": candidate.is_expression_of_concern,
        "license_code": candidate.license_code,
        "license_name": candidate.license_name,
        "license_url": candidate.license_url,
        "open_access_status": candidate.open_access_status,
        "fulltext_reuse_allowed": candidate.fulltext_reuse_allowed,
        "oa_fulltext_storage_ref": candidate.oa_fulltext_storage_ref,
        "oa_fulltext_mime_type": candidate.oa_fulltext_mime_type,
    }


def ingest_publication_candidate(
    db: Session,
    *,
    source_feed: SourceFeed,
    source_query: SourceQuery,
    candidate: PublicationCandidate,
) -> str | None:
    if candidate.is_preprint or not candidate.is_peer_reviewed:
        return None
    if not _candidate_has_adequate_source_grounding(candidate):
        return None

    if not candidate.topics:
        candidate.topics = classify_publication_candidate(candidate)
    topic_count = len(candidate.topics)
    article_payload = _candidate_to_article_payload(candidate)
    freshness_score = _freshness_score(candidate.publication_date)
    quality_score = _quality_score(candidate.article_type, candidate.study_design)
    relevance_score = _relevance_score(topic_count)
    overall_rank = round(freshness_score * 0.4 + quality_score * 0.35 + relevance_score * 0.25, 4)
    slug = _slugify(candidate.title)

    publication = _upsert_publication(
        db,
        article_payload=article_payload,
        slug=slug,
        overall_rank=overall_rank,
        freshness_score=freshness_score,
        quality_score=quality_score,
        relevance_score=relevance_score,
    )
    publication.published_at = None
    publication.featured_rank = None
    publication.stale_after = candidate.publication_date + timedelta(days=180) if candidate.publication_date else None

    ingest_run = PublicationIngestRun(
        publication_ingest_run_id=str(uuid4()),
        publication_id=publication.publication_id,
        source_feed_id=source_feed.source_feed_id,
        source_query_id=source_query.source_query_id,
        started_at=utcnow(),
        completed_at=utcnow(),
        status="completed",
        items_seen=1,
        items_accepted=1,
        items_rejected=0,
        created_at=utcnow(),
    )
    db.add(ingest_run)
    db.flush()

    _replace_identifiers_from_candidate(
        db,
        publication,
        candidate,
        source_system=source_feed.source_system,
    )
    _replace_authors(db, publication, candidate.authors)
    _replace_license(db, publication, article_payload)
    _replace_topics(db, publication, candidate.topics)
    _replace_candidate_provenance(
        db,
        publication=publication,
        source_feed=source_feed,
        source_query=source_query,
        ingest_run=ingest_run,
        candidate=candidate,
    )
    db.query(PublicationReviewState).filter(
        PublicationReviewState.publication_id == publication.publication_id
    ).delete()
    db.add(
        PublicationReviewState(
            publication_review_state_id=str(uuid4()),
            publication_id=publication.publication_id,
            state="draft",
            guardrail_status="pending",
            provenance_complete=bool(candidate.provenance_records),
            citation_complete=False,
            reviewer_ref=None,
            reviewer_note="Imported from source connectors; summary not generated yet.",
            reviewed_at=None,
            created_at=utcnow(),
        )
    )
    db.commit()
    return publication.publication_id


def recompute_publication_user_relevance(
    db: Session,
    *,
    profile_id: str,
    locale: str | None = None,
) -> int:
    profile_input = build_profile_relevance_input(db, profile_id)
    effective_locale = locale or str(profile_input["locale"])
    publications = (
        db.query(Publication)
        .options(joinedload(Publication.topics), joinedload(Publication.summaries), joinedload(Publication.review_states))
        .join(PublicationSummary)
        .join(PublicationReviewState)
        .filter(
            PublicationSummary.locale == effective_locale,
            PublicationReviewState.state == PUBLISHED_STATE,
            Publication.is_preprint.is_(False),
            Publication.is_retracted.is_(False),
        )
        .all()
    )
    db.query(PublicationUserRelevance).filter(
        PublicationUserRelevance.profile_id == profile_id,
        PublicationUserRelevance.locale == effective_locale,
    ).delete()
    saved = 0
    for publication in publications:
        integrity = _assess_publication_integrity(publication, locale=effective_locale)
        if integrity.trust_state != "verified":
            continue
        summary = next((item for item in publication.summaries if item.locale == effective_locale), None)
        if summary is None:
            continue
        publication_topics = [
            {
                "diagnosis_code": topic.diagnosis_code,
                "theme_key": topic.theme_key,
                "label": topic.label,
            }
            for topic in publication.topics
            if topic.active
        ]
        score, rationale = score_publication_for_profile(
            publication_title=summary.plain_title,
            publication_summary=summary.why_it_matters,
            publication_topics=publication_topics,
            profile_relevance_input=profile_input,
        )
        matched_keywords = sorted(set(rationale.get("keyword_matches", [])))
        db.add(
            PublicationUserRelevance(
                publication_user_relevance_id=str(uuid4()),
                publication_id=publication.publication_id,
                profile_id=profile_id,
                locale=effective_locale,
                diagnosis_code=str(profile_input["diagnosis_code"]),
                matched_keywords_json=matched_keywords,
                relevance_score=score,
                rationale_json=rationale,
                computed_at=utcnow(),
                model_version="research-pulse-relevance-v1",
            )
        )
        saved += 1
    db.commit()
    return saved


def summarize_research_pulse_publications(
    db: Session,
    *,
    locale: str = "en-US",
    publication_ids: list[str] | None = None,
    limit: int = 20,
) -> int:
    return summarize_publications(
        db,
        locale=locale,
        publication_ids=publication_ids,
        limit=limit,
    )


def discover_and_ingest_source_queries(
    db: Session,
    *,
    query_key: str | None = None,
    retmax: int = 20,
    transport: UrllibTransport | None = None,
) -> int:
    ensure_default_source_registry(db)
    resolved_transport = transport or UrllibTransport()
    pubmed = PubMedConnector(transport=resolved_transport)
    europe_pmc = EuropePMCConnector(transport=resolved_transport)
    crossref = CrossrefConnector(transport=resolved_transport)
    pmc_oa = PMCOAConnector(transport=resolved_transport)

    query = db.query(SourceQuery).join(SourceFeed).filter(SourceFeed.source_system == "pubmed", SourceQuery.active.is_(True))
    if query_key:
        query = query.filter(SourceQuery.query_key == query_key)
    source_queries = query.all()
    ingested = 0
    for source_query in source_queries:
        source_feed = source_query.source_feed
        candidates = pubmed.fetch_candidates(query_text=source_query.query_text, retmax=retmax)
        for candidate in candidates:
            if source_query.exclude_preprints and candidate.is_preprint:
                continue
            candidate = europe_pmc.enrich(candidate)
            if source_query.exclude_preprints and candidate.is_preprint:
                continue
            candidate = crossref.enrich(candidate)
            if source_query.exclude_preprints and candidate.is_preprint:
                continue
            candidate = pmc_oa.fetch_fulltext(candidate)
            if source_query.diagnosis_code or source_query.theme_key:
                topic_label = source_query.label.replace(" recent", "")
                candidate.topics = [
                    {
                        "diagnosis_code": source_query.diagnosis_code,
                        "theme_key": source_query.theme_key or "innovation",
                        "label": topic_label,
                        "confidence": 0.8,
                        "assignment_source": "rule",
                    }
                ]
            publication_id = ingest_publication_candidate(
                db,
                source_feed=source_feed,
                source_query=source_query,
                candidate=candidate,
            )
            if publication_id:
                ingested += 1
    return ingested
