from __future__ import annotations

import copy
import json
import tempfile
import unittest
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.models import Profile, User
from app.services.content_ingestion import (
    APPROVED_SOURCES_PATH,
    LAUNCH_DIAGNOSIS_CODES,
    REQUIRED_CONTENT_SECTIONS,
    REQUIRED_TOPIC_TAGS_BY_DIAGNOSIS,
    CuratedContentValidationError,
    build_launch_coverage_report,
    ingest_curated_content,
    load_curated_content_entries,
)
from app.services.educational_guidance import generate_educational_content


class CuratedContentTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite:///:memory:", future=True)
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine, autoflush=False, autocommit=False, future=True)

    def tearDown(self) -> None:
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def _create_profile(self, db, *, diagnosis_code: str, suffix: str) -> str:
        user = User(
            user_id=f"user-{suffix}",
            email=f"user-{suffix}@example.com",
            password_hash="scrypt$test$test",
            role="user",
            preferred_language="en-US",
        )
        profile = Profile(
            profile_id=f"profile-{suffix}",
            user_id=user.user_id,
            display_name=f"Profile {suffix}",
            diagnosis_code=diagnosis_code,
            diagnosis_source="self_reported",
            free_text_condition=None,
            physical_symptoms=["palpitations"],
            emotional_context=["anxiety"],
            ablation_count=1 if diagnosis_code in {"afib", "vt", "svt", "wpw"} else 0,
            has_implantable_device=diagnosis_code in {"arvc", "vt", "brugada"},
            current_medications=["beta blocker"] if diagnosis_code in {"afib", "vt", "long_qt"} else [],
            prior_procedures=["catheter ablation"] if diagnosis_code in {"afib", "svt", "wpw"} else [],
            personal_narrative="Testing curated educational guidance.",
            profile_version=1,
        )
        db.add(user)
        db.add(profile)
        db.commit()
        return profile.profile_id

    def test_repo_approved_sources_cover_launch_diagnoses(self) -> None:
        entries = load_curated_content_entries()
        report = build_launch_coverage_report(entries)

        self.assertEqual(len(entries), 28)
        for diagnosis_code in LAUNCH_DIAGNOSIS_CODES:
            self.assertEqual(
                set(report[diagnosis_code]["content_sections"]),
                set(REQUIRED_CONTENT_SECTIONS),
            )
            self.assertTrue(
                REQUIRED_TOPIC_TAGS_BY_DIAGNOSIS[diagnosis_code].issubset(
                    set(report[diagnosis_code]["topic_tags"])
                )
            )

    def test_validation_rejects_non_external_curated_source(self) -> None:
        entries = copy.deepcopy(load_curated_content_entries(source_path=APPROVED_SOURCES_PATH))

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "approved_sources.json"
            for entry in entries:
                entry["provenance"]["ingested_from"] = source_path.as_posix()
            entries[0]["provenance"]["publisher_kind"] = "onerhythm_editorial"
            source_path.write_text(json.dumps(entries), encoding="utf-8")

            with self.assertRaises(CuratedContentValidationError) as context:
                load_curated_content_entries(source_path=source_path)

            self.assertIn("external publisher_kind", str(context.exception))

    def test_generate_educational_content_uses_external_launch_corpus(self) -> None:
        db = self.SessionLocal()
        try:
            ingested = ingest_curated_content(db)
            self.assertEqual(ingested, 28)

            for index, diagnosis_code in enumerate(LAUNCH_DIAGNOSIS_CODES, start=1):
                profile_id = self._create_profile(db, diagnosis_code=diagnosis_code, suffix=str(index))
                response = generate_educational_content(db, profile_id=profile_id)

                self.assertEqual(response.retrieval_corpus_version, "curated-content-v2")
                self.assertFalse(response.ecg_clinical_inputs_used)
                self.assertTrue(response.recent_advancements)
                self.assertTrue(response.mental_health_resources)
                self.assertEqual(
                    {status.section_key for status in response.section_statuses},
                    set(REQUIRED_CONTENT_SECTIONS),
                )

                for reference in response.source_references:
                    self.assertNotIn(reference.publisher_kind, {"onerhythm_editorial", "founder"})
                    self.assertTrue(reference.source_document_id)
                    self.assertTrue(reference.topic_tags)
                    self.assertIn("educational_guidance", reference.usage_scope)
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
