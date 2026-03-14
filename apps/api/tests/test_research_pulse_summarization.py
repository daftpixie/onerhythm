from __future__ import annotations

import unittest

from app.api.errors import APIContractError
from app.db.models import Publication
from app.services.research_pulse_summarization import TemplateSummaryGenerator, _enforce_summary_guardrails


class ResearchPulseSummarizationTests(unittest.TestCase):
    def test_template_generator_explains_observational_limits_plainly(self) -> None:
        publication = Publication(
            publication_id="publication-1",
            slug="observational-afib-study",
            title="Atrial fibrillation outcomes in a cohort of 36 adults after ablation",
            abstract_text=(
                "A cohort of 36 adults with atrial fibrillation was followed after ablation. "
                "The authors described anxiety and quality of life patterns during follow-up."
            ),
            content_scope="abstract_only",
            source_url="https://pubmed.ncbi.nlm.nih.gov/12345678/",
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

        payload = TemplateSummaryGenerator().generate(publication=publication)

        self.assertEqual(payload["study_type"], "Observational cohort study")
        self.assertEqual(payload["population_sample_size"], "cohort of 36")
        self.assertIn("can show patterns but not prove", payload["important_limits"])
        self.assertIn("does not tell anyone what treatment choice to make", payload["what_this_does_not_prove"])
        self.assertGreaterEqual(len(payload["questions_to_ask_your_doctor"]), 3)
        self.assertTrue(any(claim["claim_key"] == "population_sample_size" for claim in payload["source_claims"]))

    def test_guardrails_reject_prohibited_clinical_language(self) -> None:
        with self.assertRaises(APIContractError):
            _enforce_summary_guardrails(
                {
                    "short_summary": "Your ECG proves that treatment should change.",
                    "plain_language_explanation": "This is not safe.",
                    "why_it_matters": "This is not safe.",
                    "what_this_does_not_prove": "This is not safe.",
                    "what_researchers_studied": "This is not safe.",
                    "what_they_found": "This is not safe.",
                    "important_limits": "This is not safe.",
                    "study_type": "Study",
                    "population_sample_size": "",
                    "who_this_may_apply_to": "This is not safe.",
                    "questions_to_ask_your_doctor": [],
                    "uncertainty_notes": [],
                }
            )


if __name__ == "__main__":
    unittest.main()
