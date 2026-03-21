from __future__ import annotations

import unittest
from datetime import timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.routes.upload_sessions import delete_upload_session, list_upload_sessions
from app.auth import AuthSessionContext
from app.db.base import Base
from app.db.models import MosaicTile, ProcessingJob, Profile, UploadSession, User, utcnow


class UploadSessionRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite:///:memory:", future=True)
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine, autoflush=False, autocommit=False, future=True)
        self.db = self.SessionLocal()

        now = utcnow()
        self.user = User(
            user_id="user-1",
            email="person@example.com",
            password_hash="hashed",
            role="user",
            preferred_language="en-US",
            created_at=now,
            updated_at=now,
        )
        self.profile = Profile(
            profile_id="profile-1",
            user_id=self.user.user_id,
            diagnosis_code="afib",
            diagnosis_source="self_reported",
            free_text_condition=None,
            physical_symptoms=["palpitations"],
            emotional_context=["uncertain"],
            ablation_count=1,
            has_implantable_device=False,
            current_medications=["beta blocker"],
            prior_procedures=[],
            personal_narrative=None,
            created_at=now,
            updated_at=now,
        )
        self.other_user = User(
            user_id="user-2",
            email="other@example.com",
            password_hash="hashed",
            role="user",
            preferred_language="en-US",
            created_at=now,
            updated_at=now,
        )
        self.db.add_all([self.user, self.profile, self.other_user])
        self.db.commit()
        self.auth_session = AuthSessionContext(
            user_id=self.user.user_id,
            email=self.user.email,
            role=self.user.role,
            session_id="session-1",
        )

    def tearDown(self) -> None:
        self.db.close()
        self.engine.dispose()

    def _upload_session(
        self,
        *,
        upload_session_id: str,
        user_id: str,
        profile_id: str | None,
        started_at,
        processing_status: str = "completed",
        completed_at=None,
        failure_reason: str | None = None,
        resulting_tile_id: str | None = None,
        anonymization_summary: dict | None = None,
        redaction_summary: dict | None = None,
    ) -> UploadSession:
        session = UploadSession(
            upload_session_id=upload_session_id,
            user_id=user_id,
            profile_id=profile_id,
            upload_format="pdf",
            processing_status=processing_status,
            consent_record_ids=["consent-1"],
            phi_redaction_applied=processing_status == "completed",
            raw_upload_retained=False,
            processing_pipeline_version="ecg-contribution-v1",
            started_at=started_at,
            completed_at=completed_at,
            resulting_tile_id=resulting_tile_id,
            failure_reason=failure_reason,
            anonymization_summary=anonymization_summary,
            redaction_summary=redaction_summary,
        )
        self.db.add(session)
        return session

    def test_list_upload_sessions_returns_only_owned_sessions_in_reverse_chronological_order(self) -> None:
        now = utcnow()
        older = self._upload_session(
            upload_session_id="upload-old",
            user_id=self.user.user_id,
            profile_id=self.profile.profile_id,
            started_at=now - timedelta(days=2),
            completed_at=now - timedelta(days=2, seconds=-3),
            resulting_tile_id="tile-old",
            anonymization_summary={
                "contribution_distance": {
                    "distance_cm": 25.0,
                    "policy_id": "standard_12_lead_long_strip",
                    "label": "Standard 10-second rhythm strip",
                    "rationale": "Canonical long-strip page.",
                    "provenance": "Applied the documented 25 cm policy.",
                    "inferred_layout": "standard_12_lead_with_long_strip",
                    "paper_speed_mm_per_sec": 25,
                    "fallback_used": False,
                }
            },
        )
        self.db.add(
            MosaicTile(
                tile_id="tile-old",
                source_upload_session_id=older.upload_session_id,
                condition_category="afib",
                display_date="2026-03-13",
                is_public=True,
                visibility_status="visible",
                tile_version=1,
                render_version="artistic-abstract-v1",
                visual_style={
                    "color_family": "signal",
                    "opacity": 0.82,
                    "texture_kind": "grain",
                    "glow_level": "bright",
                },
                rhythm_distance_cm=25.0,
                contributed_at=now - timedelta(days=2, seconds=-3),
            )
        )
        newer = self._upload_session(
            upload_session_id="upload-new",
            user_id=self.user.user_id,
            profile_id=self.profile.profile_id,
            started_at=now - timedelta(hours=1),
            processing_status="failed",
            completed_at=now - timedelta(hours=1, seconds=-2),
            failure_reason="artistic_transform_failed",
        )
        self._upload_session(
            upload_session_id="upload-other",
            user_id=self.other_user.user_id,
            profile_id=None,
            started_at=now - timedelta(minutes=30),
        )
        self.db.commit()
        self.db.refresh(older)
        self.db.refresh(newer)

        response = list_upload_sessions(auth_session=self.auth_session, db=self.db)

        self.assertEqual([record.upload_session_id for record in response], ["upload-new", "upload-old"])
        self.assertEqual(response[0].processing_status, "failed")
        self.assertEqual(response[1].result_tile.tile_id, "tile-old")
        self.assertEqual(response[1].contribution_distance.distance_cm, 25.0)

    def test_delete_upload_session_removes_derived_records_and_rebuilds_aggregate(self) -> None:
        now = utcnow()
        session = self._upload_session(
            upload_session_id="upload-delete",
            user_id=self.user.user_id,
            profile_id=self.profile.profile_id,
            started_at=now - timedelta(minutes=5),
            completed_at=now - timedelta(minutes=5, seconds=-3),
            resulting_tile_id="tile-delete",
        )
        self.db.add(
            ProcessingJob(
                processing_job_id="job-1",
                upload_session_id=session.upload_session_id,
                job_kind="pipeline_attempt",
                status="completed",
                attempt_count=1,
                queued_at=now - timedelta(minutes=5),
                started_at=now - timedelta(minutes=5),
                completed_at=now - timedelta(minutes=5, seconds=-3),
                job_payload={"status": "completed"},
            )
        )
        self.db.add(
            MosaicTile(
                tile_id="tile-delete",
                source_upload_session_id=session.upload_session_id,
                condition_category="afib",
                display_date="2026-03-15",
                is_public=True,
                visibility_status="visible",
                tile_version=1,
                render_version="artistic-abstract-v1",
                visual_style={
                    "color_family": "signal",
                    "opacity": 0.82,
                    "texture_kind": "grain",
                    "glow_level": "bright",
                },
                rhythm_distance_cm=25.0,
                contributed_at=now - timedelta(minutes=5, seconds=-3),
            )
        )
        self.db.commit()

        response = delete_upload_session(
            upload_session_id=session.upload_session_id,
            auth_session=self.auth_session,
            db=self.db,
        )

        self.assertEqual(response.status_code, 204)
        self.assertIsNone(
            self.db.query(UploadSession)
            .filter(UploadSession.upload_session_id == session.upload_session_id)
            .one_or_none()
        )
        self.assertEqual(
            self.db.query(ProcessingJob)
            .filter(ProcessingJob.upload_session_id == session.upload_session_id)
            .count(),
            0,
        )
        self.assertIsNone(
            self.db.query(MosaicTile).filter(MosaicTile.tile_id == "tile-delete").one_or_none()
        )


if __name__ == "__main__":
    unittest.main()
