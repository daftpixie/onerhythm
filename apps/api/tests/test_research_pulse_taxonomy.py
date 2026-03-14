from __future__ import annotations

import unittest
from datetime import datetime, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.models import (
    Profile,
    Publication,
    PublicationIdentifier,
    PublicationProvenance,
    PublicationReviewState,
    PublicationSummary,
    PublicationTopic,
    User,
)
from app.services.research_pulse import recompute_publication_user_relevance
from app.services.research_pulse_taxonomy import classify_publication_candidate, score_publication_for_profile
from app.services.research_pulse_sources import PublicationCandidate


class ResearchPulseTaxonomyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite:///:memory:", future=True)
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine, autoflush=False, autocommit=False, future=True)

    def tearDown(self) -> None:
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def test_classify_publication_candidate_assigns_patient_relevant_topics(self) -> None:
        candidate = PublicationCandidate(
            title="Atrial fibrillation ablation and quality of life outcomes",
            source_url="https://example.org",
            abstract_text="This atrial fibrillation study examines catheter ablation, anxiety, and quality of life after treatment.",
            article_type="Journal Article",
            study_design="cohort",
        )

        topics = classify_publication_candidate(candidate)

        labels = {topic["label"] for topic in topics}
        self.assertIn("Atrial fibrillation", labels)
        self.assertIn("Catheter ablation", labels)
        self.assertIn("Mental health", labels)
        self.assertIn("Quality of life", labels)

    def test_score_publication_for_profile_is_transparent(self) -> None:
        score, rationale = score_publication_for_profile(
            publication_title="Atrial fibrillation ablation and anxiety after ICD therapy",
            publication_summary="This study looks at anxiety, device therapy, and ablation recovery.",
            publication_topics=[
                {"diagnosis_code": "afib", "theme_key": "ablation", "label": "Catheter ablation"},
                {"diagnosis_code": None, "theme_key": "mental_health", "label": "Mental health"},
                {"diagnosis_code": None, "theme_key": "device", "label": "Device therapy"},
            ],
            profile_relevance_input={
                "diagnosis_code": "afib",
                "physical_symptoms": ["palpitations"],
                "emotional_context": ["anxiety"],
                "ablation_count": 1,
                "has_implantable_device": True,
                "current_medications": [],
                "prior_procedures": ["catheter ablation"],
                "personal_narrative": "living with anxiety after ablation and device therapy",
            },
        )

        self.assertGreater(score, 0.6)
        self.assertTrue(rationale["diagnosis_match"])
        self.assertTrue(rationale["mental_health_match"])
        self.assertIn("anxiety", rationale["keyword_matches"])

    def test_recompute_publication_user_relevance_persists_scores(self) -> None:
        db = self.SessionLocal()
        try:
            user = User(
                user_id="user-1",
                email="person@example.com",
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
                has_implantable_device=True,
                current_medications=["beta blocker"],
                prior_procedures=["catheter ablation"],
                personal_narrative="anxiety after ablation and device therapy",
                profile_version=1,
            )
            publication = Publication(
                publication_id="publication-1",
                slug="afib-ablation-anxiety-study",
                title="AFib ablation and anxiety outcomes",
                abstract_text="A study about ablation, device therapy, and anxiety.",
                content_scope="abstract_only",
                source_url="https://example.org/study",
                article_type="Journal Article",
                study_design="cohort",
                language="en",
                is_peer_reviewed=True,
                is_preprint=False,
                is_retracted=False,
                is_expression_of_concern=False,
                metadata_checksum="checksum",
                freshness_score=0.8,
                relevance_score=0.8,
                quality_score=0.8,
                overall_rank=0.8,
            )
            publication_summary = PublicationSummary(
                publication_summary_id="summary-1",
                publication_id="publication-1",
                locale="en-US",
                pipeline_version="research-pulse-v1",
                short_summary="A study about AFib ablation and anxiety outcomes.",
                plain_title="What this AFib ablation study looked at",
                plain_language_explanation="This paper gives a plain-language snapshot of one AFib ablation study without turning it into personal advice.",
                why_it_matters="It examines anxiety and recovery after ablation and device therapy.",
                what_this_does_not_prove="It does not prove what any one person should expect from care.",
                what_researchers_studied="Atrial fibrillation care after ablation.",
                what_they_found="Anxiety and quality-of-life patterns remained important.",
                important_limits="One cohort study cannot answer every question.",
                study_type="Observational cohort study",
                population_sample_size=None,
                questions_to_ask_your_doctor_json=[],
                who_this_may_apply_to="People reading about atrial fibrillation ablation.",
                source_claims_json=[{"claim_key": "cohort-design"}],
                uncertainty_notes_json=[],
                generated_at=datetime.now(timezone.utc),
                content_checksum="checksum",
            )
            publication_identifier = PublicationIdentifier(
                publication_identifier_id="identifier-1",
                publication_id="publication-1",
                identifier_kind="pmid",
                identifier_value="12345678",
                normalized_value="12345678",
                is_canonical=True,
                source_system="pubmed",
            )
            primary_provenance = PublicationProvenance(
                publication_provenance_id="provenance-1",
                publication_id="publication-1",
                publication_summary_id=None,
                source_system="pubmed",
                external_id="12345678",
                source_url="https://pubmed.ncbi.nlm.nih.gov/12345678/",
                content_source_kind="metadata",
                reuse_status="metadata_only",
                citation_label="PubMed metadata",
                raw_payload_json={"pmid": "12345678"},
                checksum="checksum-primary",
                fetched_at=datetime.now(timezone.utc),
            )
            summary_provenance = PublicationProvenance(
                publication_provenance_id="provenance-2",
                publication_id="publication-1",
                publication_summary_id="summary-1",
                source_system="pubmed",
                external_id="12345678",
                source_url="https://pubmed.ncbi.nlm.nih.gov/12345678/",
                content_source_kind="abstract",
                reuse_status="metadata_only",
                citation_label="PubMed abstract",
                raw_payload_json=None,
                checksum=None,
                fetched_at=datetime.now(timezone.utc),
            )
            review_state = PublicationReviewState(
                publication_review_state_id="review-1",
                publication_id="publication-1",
                publication_summary_id="summary-1",
                state="published",
                guardrail_status="passed",
                provenance_complete=True,
                citation_complete=True,
                reviewer_ref="onerhythm-editorial",
                reviewed_at=datetime.now(timezone.utc),
            )
            topic_one = PublicationTopic(
                publication_topic_id="topic-1",
                publication_id="publication-1",
                diagnosis_code="afib",
                theme_key="ablation",
                label="Catheter ablation",
                confidence=0.9,
                assignment_source="rule",
                active=True,
            )
            topic_two = PublicationTopic(
                publication_topic_id="topic-2",
                publication_id="publication-1",
                diagnosis_code=None,
                theme_key="mental_health",
                label="Mental health",
                confidence=0.8,
                assignment_source="rule",
                active=True,
            )
            db.add(user)
            db.add(profile)
            db.add(publication)
            db.add(publication_summary)
            db.add(publication_identifier)
            db.add(primary_provenance)
            db.add(summary_provenance)
            db.add(review_state)
            db.add(topic_one)
            db.add(topic_two)
            db.commit()

            saved = recompute_publication_user_relevance(db, profile_id="profile-1")

            self.assertEqual(saved, 1)
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
