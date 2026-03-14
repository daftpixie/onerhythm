from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from datetime import datetime, timezone

from app.db.models import (
    ConsentRecord,
    Profile,
    Publication,
    PublicationProvenance,
    PublicationReviewState,
    PublicationSummary,
    User,
)
from app.services.research_pulse import (
    get_research_pulse_publication,
    ingest_research_pulse_seed,
    list_research_pulse_publications,
    list_personalized_research_pulse_publications,
    ResearchPulseSeedValidationError,
    summarize_research_pulse_publications,
)


class ResearchPulseTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite:///:memory:", future=True)
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine, autoflush=False, autocommit=False, future=True)

    def tearDown(self) -> None:
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def test_ingest_seed_builds_public_feed_and_detail(self) -> None:
        payload = [
            {
                "article": {
                    "canonical_doi": "10.1000/example-doi",
                    "canonical_pmid": "12345678",
                    "title": "Catheter ablation outcomes in contemporary atrial fibrillation care",
                    "abstract_text": "A contemporary cohort study examining outcomes after ablation.",
                    "journal_name": "Heart Rhythm",
                    "publisher_name": "Elsevier",
                    "publication_date": "2026-02-01T00:00:00+00:00",
                    "article_type": "cohort study",
                    "study_design": "cohort",
                    "language": "en",
                    "authors": [{"display_name": "A. Researcher"}],
                    "source_url": "https://pubmed.ncbi.nlm.nih.gov/12345678/",
                    "is_peer_reviewed": True,
                    "is_preprint": False,
                    "is_retracted": False,
                    "is_expression_of_concern": False,
                    "license_code": "abstract-only",
                    "open_access_status": "metadata_only",
                    "fulltext_reuse_allowed": False,
                },
                "source": {
                    "source_system": "pubmed",
                    "external_id": "12345678",
                    "source_url": "https://pubmed.ncbi.nlm.nih.gov/12345678/",
                    "source_classification": "peer_reviewed_study",
                    "publisher_kind": "journal",
                    "query_key": "afib-ablation",
                    "raw_payload": {"pmid": "12345678"},
                    "fetched_at": "2026-03-12T00:00:00+00:00",
                },
                "topics": [
                    {
                        "diagnosis_code": "afib",
                        "theme_key": "ablation",
                        "label": "Atrial fibrillation",
                        "confidence": 1.0,
                        "assignment_source": "reviewer",
                    },
                    {
                        "diagnosis_code": None,
                        "theme_key": "ablation",
                        "label": "Ablation",
                        "confidence": 1.0,
                        "assignment_source": "reviewer",
                    },
                ],
                "summary": {
                    "locale": "en-US",
                    "pipeline_version": "research-pulse-v1",
                    "summary_status": "published",
                    "short_summary": "A contemporary cohort study adds another public data point on AFib ablation outcomes.",
                    "plain_title": "What a new ablation outcomes study adds to the picture",
                    "plain_language_explanation": "This paper gives a plain-language snapshot of one AFib ablation cohort study without turning it into personal advice.",
                    "why_it_matters": "It adds another data point for people trying to understand how ablation is being studied in current practice.",
                    "what_this_does_not_prove": "It does not prove what any one person should expect from care or treatment.",
                    "what_researchers_studied": "Researchers followed a contemporary atrial fibrillation cohort after catheter ablation.",
                    "what_they_found": "The study reported outcome patterns after ablation in a modern care setting.",
                    "important_limits": "This is still one study design and cannot settle every question on its own.",
                    "study_type": "Observational cohort study",
                    "population_sample_size": "cohort of 240",
                    "questions_to_ask_your_doctor": [
                        "How does this kind of cohort study fit with the larger body of evidence?",
                        "Which parts of this study are most relevant to my own history?",
                    ],
                    "who_this_may_apply_to": "People reading about atrial fibrillation ablation research in general.",
                    "source_claims": [{"claim_key": "cohort-design"}],
                    "uncertainty_notes": ["Study results need to be read alongside other evidence and clinical context."],
                    "generated_at": "2026-03-12T00:00:00+00:00",
                    "reviewed_at": "2026-03-12T01:00:00+00:00",
                    "reviewer_ref": "onerhythm-editorial",
                    "claim_citations": [
                        {
                            "claim_key": "cohort-design",
                            "citation_label": "PubMed abstract record",
                            "source_url": "https://pubmed.ncbi.nlm.nih.gov/12345678/",
                            "source_span_kind": "abstract",
                            "pmid": "12345678",
                            "doi": "10.1000/example-doi",
                        }
                    ],
                },
                "publication": {
                    "slug": "ablation-outcomes-study-adds-to-the-picture",
                    "publish_state": "published",
                    "published_at": "2026-03-12T02:00:00+00:00",
                    "featured_rank": 1,
                },
            }
        ]

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "research_pulse_seed.json"
            source_path.write_text(json.dumps(payload), encoding="utf-8")

            db = self.SessionLocal()
            try:
                ingested = ingest_research_pulse_seed(db, source_path=source_path)
                self.assertEqual(ingested, 1)

                feed = list_research_pulse_publications(db, diagnosis_code="afib")
                self.assertEqual(feed.total_items, 1)
                self.assertEqual(feed.coverage_state, "reviewed_content_available")
                self.assertEqual(feed.items[0].title, "What a new ablation outcomes study adds to the picture")
                self.assertEqual(feed.items[0].integrity.summary_origin, "automated_summary")
                self.assertTrue(feed.items[0].integrity.human_reviewed)
                self.assertEqual(feed.items[0].integrity.trust_state, "verified")

                detail = get_research_pulse_publication(
                    db,
                    slug="ablation-outcomes-study-adds-to-the-picture",
                )
                self.assertIsNotNone(detail)
                assert detail is not None
                self.assertEqual(detail.study_type, "Observational cohort study")
                self.assertEqual(detail.population_sample_size, "cohort of 240")
                self.assertEqual(detail.questions_to_ask_your_doctor[0], "How does this kind of cohort study fit with the larger body of evidence?")
                self.assertEqual(len(detail.claim_citations), 1)
                self.assertEqual(detail.source_references[0].citation["pmid"], "12345678")
                self.assertEqual(detail.integrity.review_state, "published")
                self.assertEqual(detail.integrity.source_classification, "peer_reviewed_study")
            finally:
                db.close()

    def test_summarize_publication_pipeline_creates_review_ready_summary(self) -> None:
        payload = [
            {
                "article": {
                    "canonical_doi": "10.1000/example-summary",
                    "canonical_pmid": "87654321",
                    "title": "Quality of life after atrial fibrillation ablation in a cohort of 48 adults",
                    "abstract_text": "A cohort of 48 adults with atrial fibrillation reported anxiety and quality of life outcomes after catheter ablation.",
                    "journal_name": "Heart Rhythm",
                    "publisher_name": "Elsevier",
                    "publication_date": "2026-02-10T00:00:00+00:00",
                    "article_type": "Journal Article",
                    "study_design": "cohort",
                    "language": "en",
                    "authors": [{"display_name": "B. Researcher"}],
                    "source_url": "https://pubmed.ncbi.nlm.nih.gov/87654321/",
                    "is_peer_reviewed": True,
                    "is_preprint": False,
                    "is_retracted": False,
                    "is_expression_of_concern": False,
                    "license_code": "abstract-only",
                    "open_access_status": "metadata_only",
                    "fulltext_reuse_allowed": False,
                },
                "source": {
                    "source_system": "pubmed",
                    "external_id": "87654321",
                    "source_url": "https://pubmed.ncbi.nlm.nih.gov/87654321/",
                    "source_classification": "peer_reviewed_study",
                    "publisher_kind": "journal",
                    "query_key": "afib-qol",
                    "raw_payload": {"pmid": "87654321"},
                    "fetched_at": "2026-03-12T00:00:00+00:00",
                },
                "topics": [
                    {
                        "diagnosis_code": "afib",
                        "theme_key": "quality_of_life",
                        "label": "Quality of life",
                        "confidence": 1.0,
                        "assignment_source": "reviewer",
                    }
                ],
                "summary": {
                    "locale": "en-US",
                    "pipeline_version": "research-pulse-v1",
                    "summary_status": "draft",
                    "short_summary": "Temporary reviewed launch summary.",
                    "plain_title": "Temporary reviewed launch summary",
                    "plain_language_explanation": "Temporary reviewed launch summary.",
                    "why_it_matters": "Temporary reviewed launch summary.",
                    "what_this_does_not_prove": "Temporary reviewed launch summary.",
                    "what_researchers_studied": "Temporary reviewed launch summary.",
                    "what_they_found": "Temporary reviewed launch summary.",
                    "important_limits": "Temporary reviewed launch summary.",
                    "study_type": "Study",
                    "population_sample_size": None,
                    "questions_to_ask_your_doctor": [],
                    "who_this_may_apply_to": "Temporary reviewed launch summary.",
                    "source_claims": [],
                    "uncertainty_notes": [],
                    "generated_at": "2026-03-12T00:00:00+00:00",
                    "reviewed_at": "2026-03-12T01:00:00+00:00",
                    "reviewer_ref": "onerhythm-editorial",
                    "claim_citations": [],
                },
                "publication": {
                    "slug": "quality-of-life-after-afib-ablation",
                    "publish_state": "draft",
                    "published_at": None,
                    "featured_rank": None,
                },
            }
        ]

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "research_pulse_seed.json"
            source_path.write_text(json.dumps(payload), encoding="utf-8")

            db = self.SessionLocal()
            try:
                ingested = ingest_research_pulse_seed(db, source_path=source_path)
                self.assertEqual(ingested, 1)

                summarized = summarize_research_pulse_publications(db, limit=1)
                self.assertEqual(summarized, 1)

                detail = get_research_pulse_publication(
                    db,
                    slug="quality-of-life-after-afib-ablation",
                )
                self.assertIsNone(detail)
                feed = list_research_pulse_publications(db, diagnosis_code="afib")
                self.assertEqual(feed.total_items, 0)
                self.assertEqual(feed.coverage_state, "limited")

                publication = db.query(Publication).filter(Publication.slug == "quality-of-life-after-afib-ablation").one()
                summary_record = (
                    db.query(PublicationSummary)
                    .filter(PublicationSummary.publication_id == publication.publication_id)
                    .one()
                )
                review_state = (
                    db.query(PublicationReviewState)
                    .filter(PublicationReviewState.publication_id == publication.publication_id)
                    .one()
                )
                provenance_records = (
                    db.query(PublicationProvenance)
                    .filter(PublicationProvenance.publication_summary_id == summary_record.publication_summary_id)
                    .all()
                )
                self.assertIn("one piece of the public evidence", summary_record.plain_language_explanation)
                self.assertEqual(summary_record.study_type, "Observational cohort study")
                self.assertEqual(summary_record.population_sample_size, "cohort of 48")
                self.assertGreaterEqual(len(summary_record.questions_to_ask_your_doctor_json), 3)
                self.assertEqual(review_state.state, "review_ready")
                self.assertEqual(review_state.guardrail_status, "passed")
                self.assertGreaterEqual(len(provenance_records), 4)
            finally:
                db.close()

    def test_personalized_feed_orders_published_results_by_profile_relevance(self) -> None:
        payload = [
            {
                "article": {
                    "canonical_doi": "10.1000/example-personalized",
                    "canonical_pmid": "24682468",
                    "title": "Atrial fibrillation ablation and anxiety in a cohort of 64 adults",
                    "abstract_text": "A cohort of 64 adults with atrial fibrillation reported anxiety and quality of life changes after ablation.",
                    "journal_name": "Heart Rhythm",
                    "publisher_name": "Elsevier",
                    "publication_date": "2026-02-20T00:00:00+00:00",
                    "article_type": "Journal Article",
                    "study_design": "cohort",
                    "language": "en",
                    "authors": [{"display_name": "C. Researcher"}],
                    "source_url": "https://pubmed.ncbi.nlm.nih.gov/24682468/",
                    "is_peer_reviewed": True,
                    "is_preprint": False,
                    "is_retracted": False,
                    "is_expression_of_concern": False,
                    "license_code": "abstract-only",
                    "open_access_status": "metadata_only",
                    "fulltext_reuse_allowed": False,
                },
                "source": {
                    "source_system": "pubmed",
                    "external_id": "24682468",
                    "source_url": "https://pubmed.ncbi.nlm.nih.gov/24682468/",
                    "source_classification": "peer_reviewed_study",
                    "publisher_kind": "journal",
                    "query_key": "afib-ablation-anxiety",
                    "raw_payload": {"pmid": "24682468"},
                    "fetched_at": "2026-03-12T00:00:00+00:00",
                },
                "topics": [
                    {
                        "diagnosis_code": "afib",
                        "theme_key": "ablation",
                        "label": "Atrial fibrillation",
                        "confidence": 1.0,
                        "assignment_source": "reviewer",
                    },
                    {
                        "diagnosis_code": None,
                        "theme_key": "mental_health",
                        "label": "Mental health",
                        "confidence": 1.0,
                        "assignment_source": "reviewer",
                    },
                ],
                "summary": {
                    "locale": "en-US",
                    "pipeline_version": "research-pulse-v1",
                    "summary_status": "published",
                    "short_summary": "One AFib ablation cohort study adds public evidence about anxiety and quality of life after care.",
                    "plain_title": "What this AFib ablation and anxiety study adds",
                    "plain_language_explanation": "This is a plain-language translation of one AFib ablation cohort study.",
                    "why_it_matters": "It keeps anxiety and quality of life visible inside a technical area of arrhythmia care.",
                    "what_this_does_not_prove": "It does not prove what one person should expect from treatment.",
                    "what_researchers_studied": "Researchers followed adults with atrial fibrillation after ablation.",
                    "what_they_found": "The abstract reports anxiety and quality-of-life patterns during follow-up.",
                    "important_limits": "This is observational research, so it can show patterns but not prove cause and effect.",
                    "study_type": "Observational cohort study",
                    "population_sample_size": "cohort of 64",
                    "questions_to_ask_your_doctor": [
                        "How does this fit with the larger evidence base?",
                    ],
                    "who_this_may_apply_to": "People reading about AFib ablation research.",
                    "source_claims": [{"claim_key": "cohort-design"}],
                    "uncertainty_notes": ["This is one study and should be read alongside other evidence."],
                    "generated_at": "2026-03-12T00:00:00+00:00",
                    "reviewed_at": "2026-03-12T01:00:00+00:00",
                    "reviewer_ref": "onerhythm-editorial",
                    "claim_citations": [
                        {
                            "claim_key": "cohort-design",
                            "citation_label": "PubMed abstract record",
                            "source_url": "https://pubmed.ncbi.nlm.nih.gov/24682468/",
                            "source_span_kind": "abstract",
                            "pmid": "24682468",
                            "doi": "10.1000/example-personalized",
                        }
                    ],
                },
                "publication": {
                    "slug": "afib-ablation-anxiety-cohort",
                    "publish_state": "published",
                    "published_at": "2026-03-12T02:00:00+00:00",
                    "featured_rank": 1,
                },
            }
        ]

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "research_pulse_seed.json"
            source_path.write_text(json.dumps(payload), encoding="utf-8")

            db = self.SessionLocal()
            try:
                user = User(
                    user_id="user-1",
                    email="alex@example.com",
                    password_hash="scrypt$test$test",
                    role="user",
                    preferred_language="en-US",
                )
                profile = Profile(
                    profile_id="profile-1",
                    user_id="user-1",
                    display_name="Alex",
                    diagnosis_code="afib",
                    diagnosis_source="self_reported",
                    free_text_condition=None,
                    physical_symptoms=["palpitations"],
                    emotional_context=["anxiety"],
                    ablation_count=1,
                    has_implantable_device=False,
                    current_medications=[],
                    prior_procedures=["catheter ablation"],
                    personal_narrative="anxiety after ablation",
                    profile_version=1,
                )
                consent = ConsentRecord(
                    consent_record_id="consent-1",
                    profile_id="profile-1",
                    consent_type="educational_profile",
                    status="granted",
                    policy_version="v1",
                    locale="en-US",
                    source="web",
                    effective_at=datetime.now(timezone.utc),
                    granted_at=datetime.now(timezone.utc),
                )
                db.add(user)
                db.add(profile)
                db.add(consent)
                db.commit()

                ingested = ingest_research_pulse_seed(db, source_path=source_path)
                self.assertEqual(ingested, 1)

                feed = list_personalized_research_pulse_publications(
                    db,
                    user_id="user-1",
                    locale="en-US",
                    page=1,
                    page_size=12,
                )
                self.assertEqual(feed.total_items, 1)
                self.assertEqual(feed.items[0].study_type, "Observational cohort study")
                self.assertIn("quality of life", feed.items[0].why_it_matters.lower())
                self.assertEqual(feed.items[0].integrity.trust_state, "verified")
            finally:
                db.close()

    def test_seed_validation_rejects_internal_published_item(self) -> None:
        payload = [
            {
                "article": {
                    "canonical_doi": None,
                    "canonical_pmid": None,
                    "title": "Internal unpublished launch note",
                    "abstract_text": None,
                    "journal_name": None,
                    "publisher_name": "OneRhythm",
                    "publication_date": "2026-03-01T00:00:00+00:00",
                    "article_type": "internal memo",
                    "study_design": None,
                    "language": "en",
                    "authors": [],
                    "source_url": "https://github.com/daftpixie/onerhythm/blob/main/docs/notes/internal.md",
                    "is_peer_reviewed": False,
                    "is_preprint": False,
                    "is_retracted": False,
                    "is_expression_of_concern": False,
                    "license_code": "internal",
                    "open_access_status": "metadata_only",
                    "fulltext_reuse_allowed": False,
                },
                "source": {
                    "source_system": "seed_file",
                    "external_id": "internal-1",
                    "source_url": "https://github.com/daftpixie/onerhythm/blob/main/docs/notes/internal.md",
                    "source_classification": "internal",
                    "publisher_kind": "internal",
                    "query_key": "internal-note",
                    "raw_payload": {"kind": "internal"},
                    "fetched_at": "2026-03-12T00:00:00+00:00",
                },
                "topics": [],
                "summary": {
                    "locale": "en-US",
                    "pipeline_version": "research-pulse-v1",
                    "summary_status": "published",
                    "short_summary": "Internal note.",
                    "plain_title": "Internal note.",
                    "plain_language_explanation": "Internal note.",
                    "why_it_matters": "Internal note.",
                    "what_this_does_not_prove": "Internal note.",
                    "what_researchers_studied": "Internal note.",
                    "what_they_found": "Internal note.",
                    "important_limits": "Internal note.",
                    "study_type": "Internal note",
                    "population_sample_size": None,
                    "questions_to_ask_your_doctor": [],
                    "who_this_may_apply_to": "Internal note.",
                    "source_claims": [{"claim_key": "internal"}],
                    "uncertainty_notes": [],
                    "generated_at": "2026-03-12T00:00:00+00:00",
                    "reviewed_at": "2026-03-12T01:00:00+00:00",
                    "reviewer_ref": "onerhythm-editorial",
                    "claim_citations": [
                        {
                            "claim_key": "internal",
                            "citation_label": "Internal note",
                            "source_url": "https://github.com/daftpixie/onerhythm/blob/main/docs/notes/internal.md",
                            "source_span_kind": "metadata",
                        }
                    ],
                },
                "publication": {
                    "slug": "internal-note",
                    "publish_state": "published",
                    "published_at": "2026-03-12T02:00:00+00:00",
                    "featured_rank": 1,
                },
            }
        ]

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "research_pulse_seed.json"
            source_path.write_text(json.dumps(payload), encoding="utf-8")

            db = self.SessionLocal()
            try:
                with self.assertRaises(ResearchPulseSeedValidationError):
                    ingest_research_pulse_seed(db, source_path=source_path)
            finally:
                db.close()

    def test_public_feed_excludes_published_item_when_integrity_drifts(self) -> None:
        payload = [
            {
                "article": {
                    "canonical_doi": "10.1000/example-drift",
                    "canonical_pmid": "11223344",
                    "title": "Atrial fibrillation monitoring cohort",
                    "abstract_text": "A cohort study with monitoring follow-up.",
                    "journal_name": "Heart Rhythm",
                    "publisher_name": "Elsevier",
                    "publication_date": "2026-02-01T00:00:00+00:00",
                    "article_type": "cohort study",
                    "study_design": "cohort",
                    "language": "en",
                    "authors": [{"display_name": "A. Researcher"}],
                    "source_url": "https://pubmed.ncbi.nlm.nih.gov/11223344/",
                    "is_peer_reviewed": True,
                    "is_preprint": False,
                    "is_retracted": False,
                    "is_expression_of_concern": False,
                    "license_code": "abstract-only",
                    "open_access_status": "metadata_only",
                    "fulltext_reuse_allowed": False,
                },
                "source": {
                    "source_system": "pubmed",
                    "external_id": "11223344",
                    "source_url": "https://pubmed.ncbi.nlm.nih.gov/11223344/",
                    "source_classification": "peer_reviewed_study",
                    "publisher_kind": "journal",
                    "query_key": "afib-monitoring",
                    "raw_payload": {"pmid": "11223344"},
                    "fetched_at": "2026-03-12T00:00:00+00:00",
                },
                "topics": [
                    {
                        "diagnosis_code": "afib",
                        "theme_key": "monitoring",
                        "label": "Atrial fibrillation",
                        "confidence": 1.0,
                        "assignment_source": "reviewer",
                    }
                ],
                "summary": {
                    "locale": "en-US",
                    "pipeline_version": "research-pulse-v1",
                    "summary_status": "published",
                    "short_summary": "One monitoring cohort adds another AFib data point.",
                    "plain_title": "What this monitoring cohort adds",
                    "plain_language_explanation": "This is a plain-language summary of one AFib cohort.",
                    "why_it_matters": "It adds one more public data point.",
                    "what_this_does_not_prove": "It does not prove what one person should expect.",
                    "what_researchers_studied": "Researchers followed people after monitoring.",
                    "what_they_found": "The abstract reports follow-up patterns.",
                    "important_limits": "This is one cohort study.",
                    "study_type": "Observational cohort study",
                    "population_sample_size": "cohort of 100",
                    "questions_to_ask_your_doctor": ["How does this fit with other evidence?"],
                    "who_this_may_apply_to": "People reading AFib monitoring research.",
                    "source_claims": [{"claim_key": "cohort-design"}],
                    "uncertainty_notes": ["This is one study."],
                    "generated_at": "2026-03-12T00:00:00+00:00",
                    "reviewed_at": "2026-03-12T01:00:00+00:00",
                    "reviewer_ref": "onerhythm-editorial",
                    "claim_citations": [
                        {
                            "claim_key": "cohort-design",
                            "citation_label": "PubMed abstract record",
                            "source_url": "https://pubmed.ncbi.nlm.nih.gov/11223344/",
                            "source_span_kind": "abstract",
                            "pmid": "11223344",
                            "doi": "10.1000/example-drift",
                        }
                    ],
                },
                "publication": {
                    "slug": "afib-monitoring-cohort",
                    "publish_state": "published",
                    "published_at": "2026-03-12T02:00:00+00:00",
                    "featured_rank": 1,
                },
            }
        ]

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "research_pulse_seed.json"
            source_path.write_text(json.dumps(payload), encoding="utf-8")

            db = self.SessionLocal()
            try:
                ingested = ingest_research_pulse_seed(db, source_path=source_path)
                self.assertEqual(ingested, 1)

                publication = db.query(Publication).filter(Publication.slug == "afib-monitoring-cohort").one()
                review_state = (
                    db.query(PublicationReviewState)
                    .filter(PublicationReviewState.publication_id == publication.publication_id)
                    .one()
                )
                review_state.reviewer_ref = None
                db.commit()

                feed = list_research_pulse_publications(db, diagnosis_code="afib")
                self.assertEqual(feed.total_items, 0)
                self.assertEqual(feed.coverage_state, "limited")
                self.assertEqual(feed.excluded_items_count, 1)
                detail = get_research_pulse_publication(db, slug="afib-monitoring-cohort")
                self.assertIsNone(detail)
            finally:
                db.close()


if __name__ == "__main__":
    unittest.main()
