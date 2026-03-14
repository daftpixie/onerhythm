from __future__ import annotations

import io
import os
import tempfile
import time
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

from fastapi import UploadFile
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.errors import APIContractError
from app.db.base import Base
from app.db.models import AuditEvent, MosaicTile, ProcessingJob, UploadSession, User
from app.services.artistic_transform import (
    ArtisticTransformError,
    ArtisticTransformResult,
    MOSAIC_TILE_VERSION,
    TileVisualDerivationResult,
)
from app.services.ocr_redaction import OCRRedactionError, OCRRedactionResult
from app.services.temp_storage import TemporaryUploadWorkspace, WorkspaceCleanupReport
from app.services.upload_pipeline import (
    _determine_upload_format,
    _write_upload_to_workspace,
    build_upload_session_response,
    process_upload_session_file,
)


class UploadPipelineUnitTests(unittest.TestCase):
    def test_determine_upload_format_accepts_matching_png(self) -> None:
        upload = UploadFile(
            filename="trace.png",
            file=io.BytesIO(b"\x89PNG\r\n\x1a\npayload"),
            headers={"content-type": "image/png"},
        )

        resolved = _determine_upload_format(upload, header=b"\x89PNG\r\n\x1a\npayload")

        self.assertEqual(resolved, "png")

    def test_determine_upload_format_rejects_mismatch(self) -> None:
        upload = UploadFile(
            filename="trace.png",
            file=io.BytesIO(b"%PDF-1.7"),
            headers={"content-type": "image/png"},
        )

        with self.assertRaises(APIContractError) as context:
            _determine_upload_format(upload, header=b"%PDF-1.7")

        self.assertEqual(context.exception.code, "file_type_mismatch")
        self.assertNotIn("filename", context.exception.details)
        self.assertEqual(context.exception.details["filename_extension"], ".png")

    def test_write_upload_to_workspace_rejects_oversize(self) -> None:
        workspace = TemporaryUploadWorkspace("oversize-test")
        upload = UploadFile(
            filename="trace.png",
            file=io.BytesIO(b"a" * 32),
            headers={"content-type": "image/png"},
        )

        with patch("app.services.upload_pipeline.MAX_UPLOAD_BYTES", 8):
            with self.assertRaises(APIContractError) as context:
                _write_upload_to_workspace(
                    workspace,
                    upload,
                    deadline=time.monotonic() + 5,
                )

        self.assertEqual(context.exception.code, "file_too_large")
        workspace.cleanup()

    def test_build_upload_session_response_surfaces_recoverable_failure(self) -> None:
        class Session:
            upload_session_id = "session-1"
            profile_id = "profile-1"
            upload_format = "png"
            processing_status = "failed"
            consent_record_ids: list[str] = []
            phi_redaction_applied = False
            started_at = "2026-03-12T00:00:00Z"
            completed_at = "2026-03-12T00:01:00Z"
            resulting_tile_id = None
            failure_reason = "file_too_large"

        response = build_upload_session_response(Session())

        self.assertTrue(response["retryable"])
        self.assertEqual(response["status_detail"], "File exceeds upload limit.")
        self.assertIn("smaller", response["recommended_action"])


class TemporaryWorkspaceTests(unittest.TestCase):
    def test_cleanup_stale_workspaces_removes_old_directory(self) -> None:
        with tempfile.TemporaryDirectory() as temp_root:
            with patch("app.services.temp_storage.UPLOAD_TMP_ROOT", Path(temp_root)):
                workspace = TemporaryUploadWorkspace("stale-test")
                old_timestamp = time.time() - 7200
                Path(workspace.root, "marker.txt").write_text("x", encoding="utf-8")
                os.utime(workspace.root, (old_timestamp, old_timestamp))
                removed = TemporaryUploadWorkspace.cleanup_stale_workspaces(max_age_seconds=3600)

        self.assertEqual(removed, 1)


def _png_upload_file() -> UploadFile:
    image_buffer = io.BytesIO()
    Image.new("RGB", (600, 240), "white").save(image_buffer, format="PNG")
    image_buffer.seek(0)
    return UploadFile(
        filename="trace.png",
        file=image_buffer,
        headers={"content-type": "image/png"},
    )


class StubSuccessfulOCRService:
    provider_name = "stub-ocr"

    def redact(self, *, source_path: Path, upload_format: str) -> OCRRedactionResult:
        redacted_path = source_path.with_name(f"{source_path.stem}.redacted.{upload_format}")
        redacted_path.write_bytes(source_path.read_bytes())
        return OCRRedactionResult(
            redacted_path=redacted_path,
            phi_redaction_applied=True,
            summary={
                "stage": "ocr_redaction",
                "status": "completed",
                "provider": self.provider_name,
                "input_format": upload_format,
                "output_format": upload_format,
                "ocr_ran": True,
                "detected_text_region_count": 1,
                "redacted_region_count": 1,
                "redaction_applied": True,
                "recognized_text_persisted": False,
                "redacted_regions": [
                    {
                        "page_index": 1,
                        "bounding_box": [10, 10, 80, 40],
                        "confidence": 0.99,
                        "reasons": ["visible_text_overlay", "identifier_keyword"],
                    }
                ],
            },
        )


class StubFailingOCRService:
    provider_name = "stub-ocr"

    def redact(self, *, source_path: Path, upload_format: str) -> OCRRedactionResult:
        raise OCRRedactionError(
            summary={
                "stage": "ocr_redaction",
                "status": "failed",
                "provider": self.provider_name,
                "input_format": upload_format,
                "output_format": upload_format,
                "ocr_ran": True,
                "failure_stage": "text_detection",
                "failure_reason": "RuntimeError",
                "recognized_text_persisted": False,
                "redacted_regions": [],
            }
        )


class RecordingSuccessfulArtisticTransformService:
    provider_name = "stub-artistic-transform"

    def __init__(self) -> None:
        self.received_source_paths: list[Path] = []

    def transform(self, *, source_path: Path, upload_format: str) -> ArtisticTransformResult:
        self.received_source_paths.append(source_path)
        transformed_path = source_path.with_name(f"{source_path.stem}.artistic.png")
        Image.new("L", (96, 96), color=144).save(transformed_path, format="PNG")
        return ArtisticTransformResult(
            transformed_path=transformed_path,
            summary={
                "stage": "artistic_transform",
                "status": "completed",
                "provider": self.provider_name,
                "provider_version": "test",
                "source_stage": "ocr_redaction",
                "input_format": upload_format,
                "output_format": "png",
                "artifact_kind": "abstract_luminance_field",
                "clinical_interpretation_supported": False,
                "biometric_fidelity_preserved": False,
                "derived_artifact_retained_only_in_temp_workspace": True,
                "artifact_checksum_sha256": "checksum-1",
                "output_dimensions": [96, 96],
            },
        )


class FailingArtisticTransformService:
    provider_name = "stub-artistic-transform"

    def __init__(self) -> None:
        self.received_source_paths: list[Path] = []

    def transform(self, *, source_path: Path, upload_format: str) -> ArtisticTransformResult:
        self.received_source_paths.append(source_path)
        raise ArtisticTransformError(
            summary={
                "stage": "artistic_transform",
                "status": "failed",
                "provider": self.provider_name,
                "provider_version": "test",
                "source_stage": "ocr_redaction",
                "input_format": upload_format,
                "output_format": "png",
                "clinical_interpretation_supported": False,
                "biometric_fidelity_preserved": False,
                "failure_stage": "transform",
                "failure_reason": "RuntimeError",
            }
        )


class UploadPipelineIntegrationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite:///:memory:", future=True)
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine, autoflush=False, autocommit=False, future=True)

    def tearDown(self) -> None:
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def _create_session_fixture(self) -> tuple[object, UploadSession]:
        db = self.SessionLocal()
        user = User(
            user_id=str(uuid4()),
            email="uploader@example.com",
            password_hash="hash",
            preferred_language="en",
        )
        session = UploadSession(
            upload_session_id=str(uuid4()),
            user_id=user.user_id,
            profile_id=None,
            upload_format="png",
            processing_status="initiated",
            consent_record_ids=[],
            phi_redaction_applied=False,
            raw_upload_retained=False,
            processing_pipeline_version="pending",
            started_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.add(session)
        db.flush()
        return db, session

    def _audit_event_types_for_session(self, db, upload_session_id: str) -> list[str]:
        return [
            audit_event.event_type
            for audit_event in db.query(AuditEvent)
            .filter(AuditEvent.entity_id == upload_session_id)
            .order_by(AuditEvent.created_at.asc())
            .all()
        ]

    def test_process_upload_session_file_persists_successful_redaction_summary(self) -> None:
        db, session = self._create_session_fixture()
        transform_service = RecordingSuccessfulArtisticTransformService()
        tile_derivation_inputs: list[Path] = []

        def derive_tile_visual_style_from_artifact(*, transformed_path: Path) -> TileVisualDerivationResult:
            tile_derivation_inputs.append(transformed_path)
            return TileVisualDerivationResult(
                visual_style={
                    "color_family": "signal",
                    "opacity": 0.74,
                    "texture_kind": "grain",
                    "glow_level": "bright",
                },
                render_version="artistic-abstract-v1",
                summary={
                    "stage": "tile_visual_derivation",
                    "status": "completed",
                    "input_stage": "artistic_transform",
                    "render_version": "artistic-abstract-v1",
                    "clinical_interpretation_supported": False,
                },
            )

        try:
            with tempfile.TemporaryDirectory() as temp_root:
                with patch(
                    "app.services.temp_storage.UPLOAD_TMP_ROOT",
                    Path(temp_root),
                ), patch(
                    "app.services.upload_pipeline.build_default_ocr_redaction_service",
                    return_value=StubSuccessfulOCRService(),
                ), patch(
                    "app.services.upload_pipeline.build_default_artistic_transform_service",
                    return_value=transform_service,
                ), patch(
                    "app.services.upload_pipeline.derive_tile_visual_style_from_artifact",
                    side_effect=derive_tile_visual_style_from_artifact,
                ):
                    process_upload_session_file(
                        db,
                        actor_id=session.user_id,
                        processing_pipeline_version="pipeline-v2",
                        session=session,
                        uploaded_file=_png_upload_file(),
                    )

                self.assertEqual(list(Path(temp_root).iterdir()), [])

            redaction_job = (
                db.query(ProcessingJob)
                .filter(
                    ProcessingJob.upload_session_id == session.upload_session_id,
                    ProcessingJob.job_kind == "ocr_redaction",
                )
                .one()
            )
            transform_job = (
                db.query(ProcessingJob)
                .filter(
                    ProcessingJob.upload_session_id == session.upload_session_id,
                    ProcessingJob.job_kind == "artistic_transform",
                )
                .one()
            )
            tile_job = (
                db.query(ProcessingJob)
                .filter(
                    ProcessingJob.upload_session_id == session.upload_session_id,
                    ProcessingJob.job_kind == "tile_artifact_generation",
                )
                .one()
            )
            pipeline_attempt = (
                db.query(ProcessingJob)
                .filter(
                    ProcessingJob.upload_session_id == session.upload_session_id,
                    ProcessingJob.job_kind == "pipeline_attempt",
                )
                .one()
            )
            tile = db.query(MosaicTile).filter(MosaicTile.tile_id == session.resulting_tile_id).one()
            audit_event_types = self._audit_event_types_for_session(db, session.upload_session_id)

            self.assertEqual(session.processing_status, "completed")
            self.assertIsNone(session.failure_reason)
            self.assertTrue(session.phi_redaction_applied)
            self.assertFalse(session.raw_upload_retained)
            self.assertIsNotNone(session.raw_upload_destroyed_at)
            self.assertIsNotNone(session.resulting_tile_id)
            self.assertEqual(session.redaction_summary["ocr_redaction"]["status"], "completed")
            self.assertEqual(session.redaction_summary["ocr_redaction"]["provider"], "stub-ocr")
            self.assertEqual(
                transform_service.received_source_paths[0].suffix,
                ".png",
            )
            self.assertIn(".redacted.", transform_service.received_source_paths[0].name)
            self.assertIn(".artistic.png", tile_derivation_inputs[0].name)
            self.assertFalse(session.anonymization_summary["raw_to_derived_handoff"]["tile_derivation_reads_raw_upload"])
            self.assertFalse(
                session.anonymization_summary["raw_to_derived_handoff"]["tile_derivation_reads_redacted_upload"]
            )
            self.assertEqual(
                session.anonymization_summary["artistic_transform"]["status"],
                "completed",
            )
            self.assertEqual(
                session.anonymization_summary["tile_visual_derivation"]["status"],
                "completed",
            )
            self.assertEqual(
                pipeline_attempt.job_payload["stage_reports"]["intake_validation"]["status"],
                "completed",
            )
            self.assertEqual(
                pipeline_attempt.job_payload["stage_reports"]["artistic_transform"]["status"],
                "completed",
            )
            self.assertEqual(
                pipeline_attempt.job_payload["stage_reports"]["cleanup"]["status"],
                "completed",
            )
            self.assertNotIn(
                "filename",
                pipeline_attempt.job_payload["stage_reports"]["intake_validation"],
            )
            self.assertEqual(redaction_job.status, "completed")
            self.assertEqual(redaction_job.job_payload["provider"], "stub-ocr")
            self.assertTrue(redaction_job.job_payload["redaction_applied"])
            self.assertEqual(transform_job.status, "completed")
            self.assertEqual(transform_job.job_payload["provider"], "stub-artistic-transform")
            self.assertEqual(tile_job.status, "completed")
            self.assertEqual(tile_job.job_payload["visual_style"]["glow_level"], "bright")
            self.assertEqual(tile.render_version, "artistic-abstract-v1")
            self.assertEqual(tile.tile_version, MOSAIC_TILE_VERSION)
            self.assertEqual(tile.visual_style["texture_kind"], "grain")
            self.assertIn("upload_session.stage_completed", audit_event_types)
            self.assertIn("upload_session.non_retention_verified", audit_event_types)
            cleanup_audit = (
                db.query(AuditEvent)
                .filter(
                    AuditEvent.entity_id == session.upload_session_id,
                    AuditEvent.event_type == "upload_session.non_retention_verified",
                )
                .one()
            )
            self.assertFalse(cleanup_audit.event_payload["raw_upload_retained"])
            self.assertTrue(cleanup_audit.event_payload["raw_upload_present_before_cleanup"])
            self.assertFalse(cleanup_audit.event_payload["raw_upload_present_after_cleanup"])
        finally:
            db.close()

    def test_process_upload_session_file_persists_failed_redaction_summary(self) -> None:
        db, session = self._create_session_fixture()
        try:
            with tempfile.TemporaryDirectory() as temp_root:
                with patch(
                    "app.services.temp_storage.UPLOAD_TMP_ROOT",
                    Path(temp_root),
                ), patch(
                    "app.services.upload_pipeline.build_default_ocr_redaction_service",
                    return_value=StubFailingOCRService(),
                ):
                    with self.assertRaises(APIContractError) as context:
                        process_upload_session_file(
                            db,
                            actor_id=session.user_id,
                            processing_pipeline_version="pipeline-v2",
                            session=session,
                            uploaded_file=_png_upload_file(),
                        )

                self.assertEqual(list(Path(temp_root).iterdir()), [])

            redaction_job = (
                db.query(ProcessingJob)
                .filter(
                    ProcessingJob.upload_session_id == session.upload_session_id,
                    ProcessingJob.job_kind == "ocr_redaction",
                )
                .one()
            )
            pipeline_attempt = (
                db.query(ProcessingJob)
                .filter(
                    ProcessingJob.upload_session_id == session.upload_session_id,
                    ProcessingJob.job_kind == "pipeline_attempt",
                )
                .one()
            )

            self.assertEqual(context.exception.code, "ocr_redaction_failed")
            self.assertEqual(session.processing_status, "failed")
            self.assertFalse(session.phi_redaction_applied)
            self.assertFalse(session.raw_upload_retained)
            self.assertIsNotNone(session.raw_upload_destroyed_at)
            self.assertEqual(session.redaction_summary["ocr_redaction"]["status"], "failed")
            self.assertEqual(
                session.redaction_summary["ocr_redaction"]["failure_stage"],
                "text_detection",
            )
            self.assertEqual(redaction_job.status, "failed")
            self.assertEqual(redaction_job.failure_reason, "ocr_redaction_failed")
            self.assertEqual(
                pipeline_attempt.job_payload["stage_reports"]["ocr_redaction"]["status"],
                "failed",
            )
        finally:
            db.close()

    def test_process_upload_session_file_fails_closed_when_artistic_transform_fails(self) -> None:
        db, session = self._create_session_fixture()
        transform_service = FailingArtisticTransformService()

        try:
            with tempfile.TemporaryDirectory() as temp_root:
                with patch(
                    "app.services.temp_storage.UPLOAD_TMP_ROOT",
                    Path(temp_root),
                ), patch(
                    "app.services.upload_pipeline.build_default_ocr_redaction_service",
                    return_value=StubSuccessfulOCRService(),
                ), patch(
                    "app.services.upload_pipeline.build_default_artistic_transform_service",
                    return_value=transform_service,
                ), patch(
                    "app.services.upload_pipeline.derive_tile_visual_style_from_artifact",
                    side_effect=AssertionError("tile derivation should not run"),
                ):
                    with self.assertRaises(APIContractError) as context:
                        process_upload_session_file(
                            db,
                            actor_id=session.user_id,
                            processing_pipeline_version="pipeline-v2",
                            session=session,
                            uploaded_file=_png_upload_file(),
                        )

                self.assertEqual(list(Path(temp_root).iterdir()), [])

            transform_job = (
                db.query(ProcessingJob)
                .filter(
                    ProcessingJob.upload_session_id == session.upload_session_id,
                    ProcessingJob.job_kind == "artistic_transform",
                )
                .one()
            )
            tile_job_count = (
                db.query(ProcessingJob)
                .filter(
                    ProcessingJob.upload_session_id == session.upload_session_id,
                    ProcessingJob.job_kind == "tile_artifact_generation",
                )
                .count()
            )

            self.assertEqual(context.exception.code, "artistic_transform_failed")
            self.assertIn(".redacted.", transform_service.received_source_paths[0].name)
            self.assertEqual(session.processing_status, "failed")
            self.assertFalse(session.raw_upload_retained)
            self.assertIsNotNone(session.raw_upload_destroyed_at)
            self.assertEqual(session.anonymization_summary["artistic_transform"]["status"], "failed")
            self.assertEqual(transform_job.status, "failed")
            self.assertEqual(transform_job.failure_reason, "artistic_transform_failed")
            self.assertEqual(tile_job_count, 0)
        finally:
            db.close()

    def test_process_upload_session_file_cleans_up_on_timeout(self) -> None:
        db, session = self._create_session_fixture()
        try:
            with tempfile.TemporaryDirectory() as temp_root:
                with patch(
                    "app.services.temp_storage.UPLOAD_TMP_ROOT",
                    Path(temp_root),
                ), patch(
                    "app.services.upload_pipeline.MAX_PROCESSING_SECONDS",
                    -1,
                ):
                    with self.assertRaises(APIContractError) as context:
                        process_upload_session_file(
                            db,
                            actor_id=session.user_id,
                            processing_pipeline_version="pipeline-v2",
                            session=session,
                            uploaded_file=_png_upload_file(),
                        )

                self.assertEqual(list(Path(temp_root).iterdir()), [])

            cleanup_job = (
                db.query(ProcessingJob)
                .filter(
                    ProcessingJob.upload_session_id == session.upload_session_id,
                    ProcessingJob.job_kind == "cleanup",
                )
                .one()
            )

            self.assertEqual(context.exception.code, "processing_timeout")
            self.assertEqual(session.processing_status, "failed")
            self.assertFalse(session.raw_upload_retained)
            self.assertIsNotNone(session.raw_upload_destroyed_at)
            self.assertEqual(cleanup_job.status, "completed")
        finally:
            db.close()

    def test_process_upload_session_file_marks_cleanup_failed_when_workspace_persists(self) -> None:
        db, session = self._create_session_fixture()
        transform_service = RecordingSuccessfulArtisticTransformService()

        try:
            with patch(
                "app.services.upload_pipeline.build_default_ocr_redaction_service",
                return_value=StubSuccessfulOCRService(),
            ), patch(
                "app.services.upload_pipeline.build_default_artistic_transform_service",
                return_value=transform_service,
            ), patch(
                "app.services.upload_pipeline.derive_tile_visual_style_from_artifact",
                return_value=TileVisualDerivationResult(
                    visual_style={
                        "color_family": "signal",
                        "opacity": 0.7,
                        "texture_kind": "grain",
                        "glow_level": "subtle",
                    },
                    render_version="artistic-abstract-v1",
                    summary={
                        "stage": "tile_visual_derivation",
                        "status": "completed",
                        "input_stage": "artistic_transform",
                        "render_version": "artistic-abstract-v1",
                        "clinical_interpretation_supported": False,
                    },
                ),
            ), patch(
                "app.services.temp_storage.TemporaryUploadWorkspace.cleanup",
                return_value=WorkspaceCleanupReport(
                    workspace_removed=False,
                    workspace_exists_after_cleanup=True,
                    tracked_artifact_labels=["raw_upload", "sanitized_upload"],
                    artifacts_present_before_cleanup=2,
                    artifacts_present_after_cleanup=2,
                    raw_upload_present_before_cleanup=True,
                    raw_upload_present_after_cleanup=True,
                ),
            ):
                process_upload_session_file(
                    db,
                    actor_id=session.user_id,
                    processing_pipeline_version="pipeline-v2",
                    session=session,
                    uploaded_file=_png_upload_file(),
                )

            cleanup_job = (
                db.query(ProcessingJob)
                .filter(
                    ProcessingJob.upload_session_id == session.upload_session_id,
                    ProcessingJob.job_kind == "cleanup",
                )
                .one()
            )

            self.assertEqual(session.processing_status, "cleanup_failed")
            self.assertEqual(session.failure_reason, "cleanup_failed")
            self.assertEqual(cleanup_job.status, "failed")
            self.assertIn("temporary_workspace_still_exists", cleanup_job.failure_reason)
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
