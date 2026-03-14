from __future__ import annotations

import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.models import (
    Publication,
    PublicationIdentifier,
    PublicationLicense,
    PublicationProvenance,
    PublicationReviewState,
    SourceFeed,
    SourceQuery,
)
from app.services.research_pulse import (
    discover_and_ingest_source_queries,
    ensure_default_source_registry,
    ingest_publication_candidate,
)
from app.services.research_pulse_sources import (
    CrossrefConnector,
    EuropePMCConnector,
    PMCOAConnector,
    PubMedConnector,
    PublicationCandidate,
)


class MockTransport:
    def __init__(self) -> None:
        self.json_responses = {
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=%28atrial+fibrillation%5BTitle%2FAbstract%5D%29+AND+ablation%5BTitle%2FAbstract%5D+AND+%28%22last+90+days%22%5BPDat%5D%29&retmode=json&retmax=20&sort=pub+date&tool=onerhythm-research-pulse&email=opensource%40onerhythm.local": {
                "esearchresult": {"idlist": ["12345678"]}
            },
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=12345678&retmode=json&tool=onerhythm-research-pulse&email=opensource%40onerhythm.local": {
                "result": {
                    "12345678": {
                        "uid": "12345678",
                        "title": "Catheter ablation outcomes in contemporary atrial fibrillation care",
                        "fulljournalname": "Heart Rhythm",
                        "pubdate": "2026-02-01",
                        "epubdate": "2026-01-15",
                        "lang": ["eng"],
                        "pubtype": ["Journal Article", "Observational Study"],
                        "authors": [{"name": "A. Researcher"}],
                        "articleids": [
                            {"idtype": "doi", "value": "10.1000/example-doi"},
                            {"idtype": "pubmed", "value": "12345678"},
                            {"idtype": "pmc", "value": "PMC1234567"},
                        ],
                    }
                }
            },
            "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID%3A12345678+AND+SRC%3AMED&format=json&pageSize=1": {
                "resultList": {
                    "result": [
                        {
                            "id": "12345678",
                            "source": "MED",
                            "pmid": "12345678",
                            "pmcid": "PMC1234567",
                            "doi": "10.1000/example-doi",
                            "journalTitle": "Heart Rhythm",
                            "title": "Catheter ablation outcomes in contemporary atrial fibrillation care",
                            "pubType": "Journal Article",
                            "language": "en",
                            "firstPublicationDate": "2026-02-01",
                            "isOpenAccess": "Y",
                        }
                    ]
                }
            },
            "https://api.crossref.org/works/10.1000%2Fexample-doi": {
                "message": {
                    "type": "journal-article",
                    "publisher": "Elsevier",
                    "URL": "https://doi.org/10.1000/example-doi",
                    "title": ["Catheter ablation outcomes in contemporary atrial fibrillation care"],
                    "license": [
                        {"URL": "https://creativecommons.org/licenses/by/4.0/"}
                    ],
                }
            },
        }
        self.text_responses = {
            "https://www.ebi.ac.uk/europepmc/webservices/rest/PMC1234567/fullTextXML": "<article><body>Reusable OA text</body></article>"
        }

    def fetch_json(self, url: str):
        if url not in self.json_responses:
            raise AssertionError(f"Unexpected JSON URL {url}")
        return self.json_responses[url]

    def fetch_text(self, url: str):
        if url not in self.text_responses:
            raise AssertionError(f"Unexpected text URL {url}")
        return self.text_responses[url]


class ResearchPulseSourceConnectorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.transport = MockTransport()
        self.engine = create_engine("sqlite:///:memory:", future=True)
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine, autoflush=False, autocommit=False, future=True)

    def tearDown(self) -> None:
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def test_connector_chain_normalizes_identifiers_and_oa_flags(self) -> None:
        pubmed = PubMedConnector(transport=self.transport)
        europe_pmc = EuropePMCConnector(transport=self.transport)
        crossref = CrossrefConnector(transport=self.transport)
        pmc_oa = PMCOAConnector(transport=self.transport)

        candidates = pubmed.fetch_candidates(
            query_text='(atrial fibrillation[Title/Abstract]) AND ablation[Title/Abstract] AND ("last 90 days"[PDat])'
        )
        self.assertEqual(len(candidates), 1)
        candidate = pmc_oa.fetch_fulltext(crossref.enrich(europe_pmc.enrich(candidates[0])))

        self.assertEqual(candidate.canonical_doi, "10.1000/example-doi")
        self.assertEqual(candidate.canonical_pmid, "12345678")
        self.assertEqual(candidate.canonical_pmcid, "PMC1234567")
        self.assertTrue(candidate.fulltext_reuse_allowed)
        self.assertEqual(candidate.open_access_status, "oa_fulltext_reuse")
        self.assertEqual(candidate.oa_fulltext_storage_ref, "pmc_oa:PMC1234567")
        self.assertGreaterEqual(len(candidate.provenance_records), 4)

    def test_discover_and_ingest_source_queries_stores_normalized_publication(self) -> None:
        db = self.SessionLocal()
        try:
            ensure_default_source_registry(db)
            ingested = discover_and_ingest_source_queries(
                db,
                query_key="afib-ablation-recent",
                transport=self.transport,
            )
            self.assertEqual(ingested, 1)

            publication = db.query(Publication).one()
            self.assertEqual(publication.content_scope, "oa_fulltext")
            self.assertFalse(publication.is_preprint)

            identifiers = db.query(PublicationIdentifier).all()
            self.assertEqual({identifier.identifier_kind for identifier in identifiers}, {"doi", "pmid", "pmcid"})

            license_record = db.query(PublicationLicense).one()
            self.assertTrue(license_record.permits_fulltext_storage)

            provenance_records = db.query(PublicationProvenance).all()
            self.assertGreaterEqual(len(provenance_records), 4)

            review_state = db.query(PublicationReviewState).one()
            self.assertEqual(review_state.state, "draft")
            self.assertEqual(review_state.guardrail_status, "pending")
        finally:
            db.close()

    def test_ingest_publication_candidate_rejects_under_sourced_candidate(self) -> None:
        db = self.SessionLocal()
        try:
            ensure_default_source_registry(db)
            source_feed = db.query(SourceFeed).filter(SourceFeed.slug == "pubmed-eutils").one()
            source_query = (
                db.query(SourceQuery)
                .filter(SourceQuery.query_key == "afib-ablation-recent")
                .one()
            )
            candidate = PublicationCandidate(
                title="Under-sourced publication",
                source_url="https://pubmed.ncbi.nlm.nih.gov/99999999/",
                journal_name="Heart Rhythm",
                is_peer_reviewed=True,
                provenance_records=[],
            )
            publication_id = ingest_publication_candidate(
                db,
                source_feed=source_feed,
                source_query=source_query,
                candidate=candidate,
            )
            self.assertIsNone(publication_id)
            self.assertEqual(db.query(Publication).count(), 0)
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
