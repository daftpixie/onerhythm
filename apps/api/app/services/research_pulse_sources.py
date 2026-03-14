from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Protocol
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET


DEFAULT_USER_AGENT = os.getenv(
    "RESEARCH_PULSE_USER_AGENT",
    "OneRhythmResearchPulse/0.1 (+https://github.com/daftpixie/onerhythm)",
)
NCBI_TOOL = os.getenv("RESEARCH_PULSE_NCBI_TOOL", "onerhythm-research-pulse")
NCBI_EMAIL = os.getenv("RESEARCH_PULSE_CONTACT_EMAIL", "opensource@onerhythm.local")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def normalize_doi(value: str | None) -> str | None:
    if not value:
        return None
    normalized = value.strip().lower()
    normalized = normalized.removeprefix("https://doi.org/")
    normalized = normalized.removeprefix("http://doi.org/")
    normalized = normalized.removeprefix("doi:")
    return normalized or None


def normalize_pmid(value: str | None) -> str | None:
    if not value:
        return None
    digits = "".join(character for character in value if character.isdigit())
    return digits or None


def normalize_pmcid(value: str | None) -> str | None:
    if not value:
        return None
    normalized = value.strip().upper()
    if not normalized.startswith("PMC"):
        normalized = f"PMC{normalized}"
    return normalized


def parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value.replace("Z", "+00:00")
    for candidate in (
        normalized,
        f"{normalized}-01",
        f"{normalized}-01-01",
    ):
        try:
            parsed = datetime.fromisoformat(candidate)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            else:
                parsed = parsed.astimezone(timezone.utc)
            return parsed
        except ValueError:
            continue
    return None


class HTTPTransport(Protocol):
    def fetch_json(self, url: str) -> dict[str, Any]:
        ...

    def fetch_text(self, url: str) -> str:
        ...


@dataclass
class UrllibTransport:
    user_agent: str = DEFAULT_USER_AGENT
    timeout_seconds: int = 20

    def fetch_text(self, url: str) -> str:
        request = Request(url, headers={"User-Agent": self.user_agent})
        with urlopen(request, timeout=self.timeout_seconds) as response:
            return response.read().decode("utf-8")

    def fetch_json(self, url: str) -> dict[str, Any]:
        return json.loads(self.fetch_text(url))


@dataclass
class PublicationCandidateProvenance:
    source_system: str
    source_url: str
    external_id: str | None
    content_source_kind: str
    reuse_status: str
    raw_payload: dict[str, Any] | None
    fetched_at: datetime = field(default_factory=utcnow)
    citation_label: str | None = None
    source_quote_locator: str | None = None


@dataclass
class PublicationCandidate:
    title: str
    source_url: str
    abstract_text: str | None = None
    canonical_doi: str | None = None
    canonical_pmid: str | None = None
    canonical_pmcid: str | None = None
    journal_name: str | None = None
    publisher_name: str | None = None
    publication_date: datetime | None = None
    epub_date: datetime | None = None
    article_type: str | None = None
    study_design: str | None = None
    language: str | None = None
    authors: list[dict[str, Any]] = field(default_factory=list)
    is_peer_reviewed: bool = True
    is_preprint: bool = False
    is_retracted: bool = False
    is_expression_of_concern: bool = False
    open_access_status: str = "metadata_only"
    fulltext_reuse_allowed: bool = False
    license_code: str | None = None
    license_name: str | None = None
    license_url: str | None = None
    oa_fulltext_xml: str | None = None
    oa_fulltext_storage_ref: str | None = None
    oa_fulltext_mime_type: str | None = None
    topics: list[dict[str, Any]] = field(default_factory=list)
    provenance_records: list[PublicationCandidateProvenance] = field(default_factory=list)


def _looks_like_preprint(text_values: list[str | None]) -> bool:
    haystack = " ".join(value.lower() for value in text_values if value)
    return "preprint" in haystack or "medrxiv" in haystack or "biorxiv" in haystack


@dataclass
class PubMedConnector:
    transport: HTTPTransport

    def search(self, *, query_text: str, retmax: int = 20) -> list[str]:
        params = urlencode(
            {
                "db": "pubmed",
                "term": query_text,
                "retmode": "json",
                "retmax": retmax,
                "sort": "pub date",
                "tool": NCBI_TOOL,
                "email": NCBI_EMAIL,
            }
        )
        payload = self.transport.fetch_json(
            f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?{params}"
        )
        return [normalize_pmid(value) for value in payload.get("esearchresult", {}).get("idlist", []) if normalize_pmid(value)]

    def fetch_candidates(self, *, query_text: str, retmax: int = 20) -> list[PublicationCandidate]:
        ids = self.search(query_text=query_text, retmax=retmax)
        if not ids:
            return []
        params = urlencode(
            {
                "db": "pubmed",
                "id": ",".join(ids),
                "retmode": "json",
                "tool": NCBI_TOOL,
                "email": NCBI_EMAIL,
            }
        )
        payload = self.transport.fetch_json(
            f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?{params}"
        )
        result = payload.get("result", {})
        candidates: list[PublicationCandidate] = []
        for identifier in ids:
            record = result.get(identifier)
            if not record:
                continue
            article_ids = record.get("articleids", [])
            doi = normalize_doi(next((item.get("value") for item in article_ids if item.get("idtype") == "doi"), None))
            pmcid = normalize_pmcid(next((item.get("value") for item in article_ids if item.get("idtype") == "pmc"), None))
            pubtypes = record.get("pubtype", [])
            if _looks_like_preprint(pubtypes + [record.get("fulljournalname"), record.get("title")]):
                continue
            authors = [{"display_name": author.get("name")} for author in record.get("authors", []) if author.get("name")]
            candidate = PublicationCandidate(
                title=record.get("title") or "Untitled publication",
                source_url=f"https://pubmed.ncbi.nlm.nih.gov/{identifier}/",
                canonical_doi=doi,
                canonical_pmid=normalize_pmid(identifier),
                canonical_pmcid=pmcid,
                journal_name=record.get("fulljournalname"),
                publication_date=parse_date(record.get("pubdate")),
                epub_date=parse_date(record.get("epubdate")),
                article_type=", ".join(pubtypes) if pubtypes else None,
                language=(record.get("lang") or [None])[0],
                authors=authors,
                is_peer_reviewed=True,
                is_preprint=False,
                open_access_status="free_full_text_link" if pmcid else "metadata_only",
                provenance_records=[
                    PublicationCandidateProvenance(
                        source_system="pubmed",
                        source_url=f"https://pubmed.ncbi.nlm.nih.gov/{identifier}/",
                        external_id=identifier,
                        content_source_kind="metadata",
                        reuse_status="metadata_only",
                        raw_payload=record,
                        citation_label=record.get("title"),
                    )
                ],
            )
            candidates.append(candidate)
        return candidates


@dataclass
class EuropePMCConnector:
    transport: HTTPTransport

    def enrich(self, candidate: PublicationCandidate) -> PublicationCandidate:
        if candidate.canonical_pmid:
            query = f"EXT_ID:{candidate.canonical_pmid} AND SRC:MED"
        elif candidate.canonical_pmcid:
            query = f"PMCID:{candidate.canonical_pmcid}"
        elif candidate.canonical_doi:
            query = f'DOI:"{candidate.canonical_doi}"'
        else:
            query = f'TITLE:"{candidate.title}"'
        url = (
            "https://www.ebi.ac.uk/europepmc/webservices/rest/search?"
            + urlencode({"query": query, "format": "json", "pageSize": 1})
        )
        payload = self.transport.fetch_json(url)
        results = payload.get("resultList", {}).get("result", [])
        if not results:
            return candidate
        record = results[0]
        if _looks_like_preprint([record.get("pubType"), record.get("title"), record.get("journalTitle")]):
            candidate.is_preprint = True
            return candidate
        candidate.canonical_doi = normalize_doi(record.get("doi")) or candidate.canonical_doi
        candidate.canonical_pmid = normalize_pmid(record.get("pmid")) or candidate.canonical_pmid
        candidate.canonical_pmcid = normalize_pmcid(record.get("pmcid")) or candidate.canonical_pmcid
        candidate.journal_name = record.get("journalTitle") or candidate.journal_name
        candidate.publication_date = parse_date(record.get("firstPublicationDate")) or candidate.publication_date
        candidate.language = record.get("language") or candidate.language
        candidate.article_type = record.get("pubType") or candidate.article_type
        candidate.open_access_status = (
            "oa_fulltext_reuse" if record.get("isOpenAccess") == "Y" and record.get("hasBook") != "Y" else candidate.open_access_status
        )
        candidate.provenance_records.append(
            PublicationCandidateProvenance(
                source_system="europe_pmc",
                source_url=record.get("source") and f"https://europepmc.org/article/{record.get('source')}/{record.get('id')}" or "https://europepmc.org/",
                external_id=record.get("id"),
                content_source_kind="metadata",
                reuse_status=candidate.open_access_status,
                raw_payload=record,
                citation_label=record.get("title"),
            )
        )
        return candidate


@dataclass
class CrossrefConnector:
    transport: HTTPTransport

    def enrich(self, candidate: PublicationCandidate) -> PublicationCandidate:
        if not candidate.canonical_doi:
            return candidate
        doi_path = quote(candidate.canonical_doi, safe="")
        payload = self.transport.fetch_json(f"https://api.crossref.org/works/{doi_path}")
        record = payload.get("message", {})
        if record.get("type") == "posted-content":
            candidate.is_preprint = True
            return candidate
        license_entries = record.get("license", [])
        license_url = license_entries[0].get("URL") if license_entries else None
        candidate.publisher_name = record.get("publisher") or candidate.publisher_name
        candidate.license_url = license_url or candidate.license_url
        candidate.license_code = license_url.rsplit("/", 1)[-1] if license_url else candidate.license_code
        candidate.license_name = license_url or candidate.license_name
        if license_url and "creativecommons.org" in license_url:
            candidate.fulltext_reuse_allowed = True
            if candidate.open_access_status == "metadata_only":
                candidate.open_access_status = "oa_fulltext_reuse"
        candidate.provenance_records.append(
            PublicationCandidateProvenance(
                source_system="crossref",
                source_url=record.get("URL") or f"https://doi.org/{candidate.canonical_doi}",
                external_id=candidate.canonical_doi,
                content_source_kind="metadata",
                reuse_status=candidate.open_access_status,
                raw_payload=record,
                citation_label=(record.get("title") or [candidate.title])[0] if isinstance(record.get("title"), list) else candidate.title,
            )
        )
        return candidate


@dataclass
class PMCOAConnector:
    transport: HTTPTransport

    def fetch_fulltext(self, candidate: PublicationCandidate) -> PublicationCandidate:
        if not candidate.canonical_pmcid or not candidate.fulltext_reuse_allowed:
            return candidate
        pmcid = normalize_pmcid(candidate.canonical_pmcid)
        if not pmcid:
            return candidate
        url = (
            "https://www.ebi.ac.uk/europepmc/webservices/rest/"
            f"{pmcid}/fullTextXML"
        )
        try:
            xml_text = self.transport.fetch_text(url)
        except Exception:
            return candidate
        if not xml_text.strip():
            return candidate
        candidate.oa_fulltext_xml = xml_text
        candidate.oa_fulltext_storage_ref = f"pmc_oa:{pmcid}"
        candidate.oa_fulltext_mime_type = "application/xml"
        candidate.open_access_status = "oa_fulltext_reuse"
        candidate.provenance_records.append(
            PublicationCandidateProvenance(
                source_system="pmc_oa",
                source_url=f"https://pmc.ncbi.nlm.nih.gov/articles/{pmcid}/",
                external_id=pmcid,
                content_source_kind="oa_fulltext",
                reuse_status="oa_fulltext_reuse",
                raw_payload={"pmcid": pmcid, "fulltext_xml_retrieved": True},
                citation_label=f"PMC Open Access XML {pmcid}",
            )
        )
        return candidate
