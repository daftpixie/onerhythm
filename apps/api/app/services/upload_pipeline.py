from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile, status
from PIL import Image, UnidentifiedImageError
from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.api.errors import APIContractError
from app.audit import append_audit_event
from app.db.models import MosaicTile, ProcessingJob, Profile, UploadSession
from app.services.artistic_transform import (
    ArtisticTransformError,
    MOSAIC_TILE_VERSION,
    build_default_artistic_transform_service,
    derive_tile_visual_style_from_artifact,
)
from app.services.ocr_redaction import (
    OCRRedactionError,
    build_default_ocr_redaction_service,
)
from app.services.temp_storage import (
    TemporaryUploadWorkspace,
    cleanup_report_to_dict,
    stale_cleanup_report_to_dict,
)

logger = logging.getLogger(__name__)


# --- Legacy stubs ---
# These functions were provided by services deleted during the PRD v3 cleanup
# (metadata_purge, rhythm_counter, rhythm_contributions). The upload pipeline
# is retained per PRD v3 §18 but these operations are no longer available.


class _MetadataPurgeResult:
    def __init__(self, sanitized_path, summary):
        self.sanitized_path = sanitized_path
        self.summary = summary


def purge_source_metadata(*, workspace, raw_path, upload_format):
    """Stub: metadata purge service removed. Pass through the raw file."""
    return _MetadataPurgeResult(sanitized_path=raw_path, summary={"stub": True})


class _ContributionDistance:
    def __init__(self):
        self.distance_cm = 75

    def to_summary(self):
        return {"distance_cm": 75, "stub": True}


def determine_contribution_distance(*, redaction_summary):
    """Stub: rhythm_counter service removed."""
    return _ContributionDistance()


def rebuild_rhythm_distance_aggregate(db):
    """Stub: legacy aggregate service removed. Mission v3 is the canonical truth layer."""
    pass


def record_rhythm_distance(db, *, tile_id, distance_cm):
    """Stub: legacy distance recording removed."""
    pass


def create_real_ecg_contribution(db, *, upload_session, tile, distance_cm):
    """Stub: legacy contribution service removed."""
    return None


def serialize_contribution_summary(contribution, artifact_scope="owned"):
    """Stub: legacy serialization removed."""
    return None


def reconcile_upload_session_contribution_distance(db, *, session):
    """Stub: legacy reconciliation removed."""
    return False


# --- End legacy stubs ---

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))
MAX_PROCESSING_SECONDS = int(os.getenv("MAX_PROCESSING_SECONDS", "30"))
MAX_PDF_PROCESSING_SECONDS = int(
    os.getenv("MAX_PDF_PROCESSING_SECONDS", str(max(MAX_PROCESSING_SECONDS, 90)))
)
MAX_PIPELINE_ATTEMPTS = int(os.getenv("MAX_PIPELINE_ATTEMPTS", "2"))
MAX_WORKSPACE_AGE_SECONDS = int(os.getenv("MAX_WORKSPACE_AGE_SECONDS", "3600"))
READ_CHUNK_BYTES = int(os.getenv("UPLOAD_READ_CHUNK_BYTES", str(1024 * 1024)))

SUPPORTED_CONTENT_TYPES = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "application/pdf": "pdf",
}
SUPPORTED_EXTENSIONS = {
    ".jpg": "jpeg",
    ".jpeg": "jpeg",
    ".png": "png",
    ".pdf": "pdf",
}
MAGIC_SIGNATURES = {
    "jpeg": (b"\xff\xd8\xff",),
    "png": (b"\x89PNG\r\n\x1a\n",),
    "pdf": (b"%PDF-",),
}
STATUS_MESSAGES = {
    "initiated": (
        False,
        "Upload session created.",
        "The upload session is ready for a file.",
        "Upload a supported JPEG, PNG, or single-page PDF.",
    ),
    "validating": (
        False,
        "Validating file type and size.",
        "We are checking the file type, size, and basic integrity.",
        None,
    ),
    "received": (
        False,
        "File accepted.",
        "The upload passed intake validation and entered the secure processing workspace.",
        None,
    ),
    "sanitizing": (
        False,
        "Removing source metadata.",
        "We are stripping metadata before later processing stages.",
        None,
    ),
    "redacting": (
        False,
        "Running redaction stage.",
        "We are running the explicit OCR and redaction hook for visible identifiers.",
        None,
    ),
    "transforming": (
        False,
        "Running artistic privacy transform.",
        "We are destroying biometric waveform fidelity before tile derivation.",
        None,
    ),
    "tile_generating": (
        False,
        "Generating anonymized tile artifact.",
        "We are producing the visual-only tile handoff for the mosaic.",
        None,
    ),
    "cleaning_up": (
        False,
        "Destroying temporary processing artifacts.",
        "We are removing raw and derived temporary files from the secure workspace.",
        None,
    ),
    "completed": (
        False,
        "Processing completed successfully.",
        "Your contribution finished processing and the original file has been destroyed.",
        None,
    ),
    "failed": (
        True,
        "Processing failed.",
        "The upload did not complete. Review the failure reason and try again if appropriate.",
        "Retry with a supported file if the error is recoverable.",
    ),
    "cleanup_failed": (
        False,
        "Cleanup needs manual review.",
        "The upload failed during cleanup and requires operator review before retry.",
        "Do not retry immediately. Inspect cleanup logs and workspace state first.",
    ),
}
FAILURE_DETAILS = {
    "unsupported_file_type": (
        False,
        "Unsupported file type.",
        "Only JPEG, PNG, and single-page PDF uploads are supported.",
        "Choose a JPEG, PNG, or single-page PDF file.",
    ),
    "file_type_mismatch": (
        True,
        "File type mismatch.",
        "The file extension or declared content type did not match the file itself.",
        "Rename or re-export the file so its format matches the upload type.",
    ),
    "file_signature_invalid": (
        True,
        "File signature invalid.",
        "The uploaded file did not match a valid JPEG, PNG, or PDF signature.",
        "Re-export the file from its source before trying again.",
    ),
    "image_decode_failed": (
        True,
        "Image could not be decoded.",
        "The uploaded image file appears damaged or incomplete.",
        "Try a fresh export or a different file.",
    ),
    "pdf_page_count_invalid": (
        True,
        "PDF page count invalid.",
        "PDF uploads must contain exactly one page.",
        "Export a single-page PDF before trying again.",
    ),
    "file_too_large": (
        True,
        "File exceeds upload limit.",
        "The uploaded file is larger than the current safe processing limit.",
        "Use a smaller export or image file.",
    ),
    "processing_timeout": (
        True,
        "Processing timed out.",
        "The upload took too long to process safely.",
        "Try again with a smaller or simpler file.",
    ),
    "metadata_purge_failed": (
        True,
        "Metadata purge failed.",
        "We could not sanitize the uploaded file safely.",
        "Try a clean export of the file.",
    ),
    "ocr_redaction_failed": (
        True,
        "Redaction stage failed.",
        "The explicit redaction stage could not complete.",
        "Retry later or use a cleaner export.",
    ),
    "artistic_transform_failed": (
        True,
        "Anonymization transform failed.",
        "We could not complete the privacy-preserving artistic transform safely.",
        "Retry later or use a cleaner export.",
    ),
    "tile_artifact_generation_failed": (
        True,
        "Tile generation failed.",
        "The upload was sanitized but the tile artifact could not be produced.",
        "Retry the upload once.",
    ),
    "cleanup_failed": (
        False,
        "Cleanup failed.",
        "The temporary workspace could not be fully destroyed.",
        "Do not retry until the cleanup issue is resolved.",
    ),
    "retry_limit_reached": (
        False,
        "Retry limit reached.",
        "This upload session has already reached its retry limit.",
        "Start a new upload session with a fresh file.",
    ),
}

PROCESSING_STATUS_TRANSITIONS = {
    "initiated": {"validating"},
    "failed": {"validating", "cleanup_failed"},
    "cleanup_failed": {"validating"},
    "validating": {"received", "failed"},
    "received": {"sanitizing", "failed"},
    "sanitizing": {"redacting", "failed"},
    "redacting": {"transforming", "failed"},
    "transforming": {"tile_generating", "failed"},
    "tile_generating": {"cleaning_up", "failed"},
    "cleaning_up": {"completed", "failed", "cleanup_failed"},
    "completed": set(),
}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _record_audit_event(
    db: Session,
    *,
    entity_type: str,
    entity_id: str,
    event_type: str,
    actor_id: str,
    payload: dict | None = None,
) -> None:
    append_audit_event(
        db,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        actor_type="user",
        actor_id=actor_id,
        payload=payload,
    )


def _log_upload_event(event: str, **payload: object) -> None:
    logger.info("upload_pipeline.%s %s", event, payload)


def _set_processing_status(upload_session: UploadSession, status_value: str) -> None:
    current_status = upload_session.processing_status
    if current_status == status_value:
        return
    allowed_next = PROCESSING_STATUS_TRANSITIONS.get(current_status, set())
    if status_value not in allowed_next:
        raise RuntimeError(
            f"invalid_upload_status_transition:{current_status}->{status_value}"
        )
    upload_session.processing_status = status_value


def _append_stage_report(
    pipeline_attempt: ProcessingJob,
    *,
    stage: str,
    status_value: str,
    payload: dict | None = None,
) -> None:
    existing_payload = dict(pipeline_attempt.job_payload or {})
    stage_reports = dict(existing_payload.get("stage_reports") or {})
    stage_report = dict(stage_reports.get(stage) or {})
    stage_report.update(
        {
            "status": status_value,
            "recorded_at": utcnow().isoformat(),
        }
    )
    if payload:
        stage_report.update(payload)
    stage_reports[stage] = stage_report
    pipeline_attempt.job_payload = {
        **existing_payload,
        "stage_reports": stage_reports,
    }


def _record_stage_audit_event(
    db: Session,
    *,
    upload_session_id: str,
    actor_id: str,
    stage: str,
    status_value: str,
    payload: dict | None = None,
) -> None:
    _record_audit_event(
        db,
        entity_type="upload_session",
        entity_id=upload_session_id,
        event_type=f"upload_session.stage_{status_value}",
        actor_id=actor_id,
        payload={"stage": stage, **(payload or {})},
    )


def _deadline_guard(deadline: float, *, code: str = "processing_timeout") -> None:
    if time.monotonic() > deadline:
        raise APIContractError(
            code=code,
            message="The upload took too long to process safely.",
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
        )


def _processing_deadline(started_at: float, *, upload_format: str | None = None) -> float:
    budget_seconds = MAX_PROCESSING_SECONDS
    if upload_format == "pdf":
        budget_seconds = max(MAX_PROCESSING_SECONDS, MAX_PDF_PROCESSING_SECONDS)
    return started_at + budget_seconds


def _job_attempt_count(db: Session, *, upload_session_id: str, job_kind: str) -> int:
    return (
        db.query(ProcessingJob)
        .filter(
            ProcessingJob.upload_session_id == upload_session_id,
            ProcessingJob.job_kind == job_kind,
        )
        .count()
        + 1
    )


def _create_job(
    db: Session,
    *,
    upload_session_id: str,
    job_kind: str,
    status_value: str,
    payload: dict | None = None,
) -> ProcessingJob:
    job = ProcessingJob(
        processing_job_id=str(uuid4()),
        upload_session_id=upload_session_id,
        job_kind=job_kind,
        status=status_value,
        attempt_count=_job_attempt_count(db, upload_session_id=upload_session_id, job_kind=job_kind),
        queued_at=utcnow(),
        started_at=utcnow() if status_value == "running" else None,
        completed_at=utcnow() if status_value == "completed" else None,
        job_payload=payload,
    )
    db.add(job)
    return job


def _update_job(
    job: ProcessingJob,
    *,
    status_value: str,
    failure_reason: str | None = None,
    payload_updates: dict | None = None,
) -> None:
    job.status = status_value
    if status_value == "running" and job.started_at is None:
        job.started_at = utcnow()
    if status_value in {"completed", "failed"}:
        job.completed_at = utcnow()
    job.failure_reason = failure_reason
    if payload_updates:
        job.job_payload = {**(job.job_payload or {}), **payload_updates}


def _normalize_requested_format(file: UploadFile) -> tuple[str | None, str | None]:
    content_type_format = SUPPORTED_CONTENT_TYPES.get(file.content_type or "")
    suffix_format = SUPPORTED_EXTENSIONS.get(Path(file.filename or "").suffix.lower())
    return content_type_format, suffix_format


def _detect_format_from_signature(header: bytes) -> str | None:
    for upload_format, signatures in MAGIC_SIGNATURES.items():
        if any(header.startswith(signature) for signature in signatures):
            return upload_format
    return None


def _determine_upload_format(file: UploadFile, *, header: bytes) -> str:
    content_type_format, suffix_format = _normalize_requested_format(file)
    signature_format = _detect_format_from_signature(header)

    if signature_format is None:
        raise APIContractError(
            code="file_signature_invalid",
            message="The uploaded file did not match a supported file signature.",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"content_type": file.content_type or "unknown"},
        )

    mismatches = [
        candidate
        for candidate in (content_type_format, suffix_format)
        if candidate is not None and candidate != signature_format
    ]
    if mismatches:
        raise APIContractError(
            code="file_type_mismatch",
            message="The file extension or content type did not match the file itself.",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={
                "content_type": file.content_type or "unknown",
                "filename_extension": Path(file.filename or "").suffix.lower() or None,
                "detected_format": signature_format,
            },
        )

    return signature_format


def _write_upload_to_workspace(
    workspace: TemporaryUploadWorkspace,
    file: UploadFile,
    *,
    deadline: float,
) -> tuple[Path, int, bytes]:
    suffix = Path(file.filename or "upload.bin").suffix or ".bin"
    raw_path = workspace.path_for(f"raw{suffix}", artifact_label="raw_upload")
    header = b""
    total_size = 0

    with raw_path.open("wb") as raw_file:
        while True:
            _deadline_guard(deadline)
            chunk = file.file.read(READ_CHUNK_BYTES)
            if not chunk:
                break
            if not header:
                header = chunk[:16]
            total_size += len(chunk)
            if total_size > MAX_UPLOAD_BYTES:
                raise APIContractError(
                    code="file_too_large",
                    message="The uploaded file exceeds the current upload size limit.",
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                    details={"max_upload_bytes": MAX_UPLOAD_BYTES},
                )
            raw_file.write(chunk)

    if total_size == 0:
        raise APIContractError(
            code="file_signature_invalid",
            message="The uploaded file was empty.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    return raw_path, total_size, header


def _validate_raster_image(path: Path, *, upload_format: str) -> None:
    expected_format = "JPEG" if upload_format == "jpeg" else "PNG"
    try:
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            actual_format = image.format
    except (UnidentifiedImageError, OSError) as exc:
        raise APIContractError(
            code="image_decode_failed",
            message="The uploaded image could not be decoded safely.",
            status_code=status.HTTP_400_BAD_REQUEST,
        ) from exc

    if actual_format != expected_format:
        raise APIContractError(
            code="file_type_mismatch",
            message="The uploaded image did not match the expected image format.",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"expected_format": expected_format, "actual_format": actual_format or "unknown"},
        )


def _ensure_single_page_pdf(path: Path) -> None:
    with path.open("rb") as pdf_file:
        reader = PdfReader(pdf_file)
        if len(reader.pages) != 1:
            raise APIContractError(
                code="pdf_page_count_invalid",
                message="PDF uploads must contain exactly one page.",
                status_code=status.HTTP_400_BAD_REQUEST,
                details={"page_count": len(reader.pages)},
            )


def _validate_source_file(path: Path, *, upload_format: str) -> None:
    if upload_format in {"jpeg", "png"}:
        _validate_raster_image(path, upload_format=upload_format)
        return
    if upload_format == "pdf":
        _ensure_single_page_pdf(path)
        return
    raise APIContractError(
        code="unsupported_file_type",
        message="Supported upload types are JPEG, PNG, and single-page PDF.",
        status_code=status.HTTP_400_BAD_REQUEST,
    )


def _create_mosaic_tile(
    db: Session,
    *,
    upload_session: UploadSession,
    visual_style: dict,
    render_version: str,
    rhythm_distance_cm: float | None = None,
) -> str:
    profile = (
        db.query(Profile).filter(Profile.profile_id == upload_session.profile_id).one_or_none()
        if upload_session.profile_id
        else None
    )
    tile_id = str(uuid4())
    db.add(
        MosaicTile(
            tile_id=tile_id,
            source_upload_session_id=upload_session.upload_session_id,
            condition_category=profile.diagnosis_code if profile else "other",
            display_date=utcnow().date().isoformat(),
            is_public=True,
            visibility_status="visible",
            tile_version=MOSAIC_TILE_VERSION,
            render_version=render_version,
            visual_style=visual_style,
            rhythm_distance_cm=rhythm_distance_cm,
            contributed_at=utcnow(),
            ledger_adapter_ref=None,
        )
    )
    # SessionLocal runs with autoflush disabled, so flush before any downstream
    # code queries the newly inserted tile in the same transaction.
    db.flush()
    return tile_id


def _serialize_mosaic_tile(tile: MosaicTile | None) -> dict | None:
    if tile is None:
        return None
    return {
        "tile_id": tile.tile_id,
        "condition_category": tile.condition_category,
        "contributed_at": tile.contributed_at,
        "is_public": tile.is_public,
        "display_date": tile.display_date,
        "tile_version": tile.tile_version,
        "render_version": tile.render_version,
        "visual_style": tile.visual_style,
        "rhythm_distance_cm": tile.rhythm_distance_cm,
    }


def _safe_tile_visual_style_payload(visual_style: dict) -> dict:
    safe_visual_style = {
        key: value
        for key, value in visual_style.items()
        if key not in {"waveform_signature", "attribution"}
    }
    waveform_signature = visual_style.get("waveform_signature")
    if isinstance(waveform_signature, dict):
        bands = waveform_signature.get("bands") or []
        safe_visual_style["waveform_signature"] = {
            "source": waveform_signature.get("source"),
            "band_count": len(bands),
            "points_per_band": len(bands[0].get("points") or []) if bands else 0,
        }
    attribution = visual_style.get("attribution")
    if isinstance(attribution, dict):
        safe_visual_style["attribution"] = {
            "name_present": bool(attribution.get("contributor_name")),
            "location_present": bool(attribution.get("contributor_location")),
        }
    return safe_visual_style


def _mark_failed(upload_session: UploadSession, reason: str) -> None:
    _set_processing_status(upload_session, "failed")
    upload_session.failure_reason = reason
    upload_session.completed_at = utcnow()


def _prepare_retry_state(session: UploadSession) -> None:
    session.failure_reason = None
    session.completed_at = None
    session.redaction_summary = None
    session.anonymization_summary = None
    session.resulting_tile_id = None
    session.raw_upload_destroyed_at = None
    session.phi_redaction_applied = False
    session.raw_upload_retained = False


def process_upload_session_file(
    db: Session,
    *,
    actor_id: str,
    processing_pipeline_version: str,
    session: UploadSession,
    uploaded_file: UploadFile,
    tile_attribution: dict | None = None,
) -> None:
    stale_cleanup_report = TemporaryUploadWorkspace.cleanup_stale_workspaces_report(
        max_age_seconds=MAX_WORKSPACE_AGE_SECONDS
    )
    started_at_monotonic = time.monotonic()
    deadline = _processing_deadline(started_at_monotonic)
    workspace = TemporaryUploadWorkspace(session.upload_session_id)
    redaction_service = build_default_ocr_redaction_service()
    artistic_transform_service = build_default_artistic_transform_service()
    session.processing_pipeline_version = processing_pipeline_version

    previous_attempts = (
        db.query(ProcessingJob)
        .filter(
            ProcessingJob.upload_session_id == session.upload_session_id,
            ProcessingJob.job_kind == "pipeline_attempt",
        )
        .count()
    )
    if previous_attempts >= MAX_PIPELINE_ATTEMPTS:
        raise APIContractError(
            code="retry_limit_reached",
            message="This upload session has reached its retry limit.",
            status_code=status.HTTP_409_CONFLICT,
            details={"max_attempts": MAX_PIPELINE_ATTEMPTS},
        )
    if session.processing_status not in {"initiated", "failed", "cleanup_failed"}:
        raise APIContractError(
            code="upload_session_not_retryable",
            message="This upload session is not in a retryable state.",
            status_code=status.HTTP_409_CONFLICT,
            details={"processing_status": session.processing_status},
        )

    _prepare_retry_state(session)
    pipeline_attempt = _create_job(
        db,
        upload_session_id=session.upload_session_id,
        job_kind="pipeline_attempt",
        status_value="running",
        payload={
            "processing_pipeline_version": processing_pipeline_version,
            "preflight_cleanup": stale_cleanup_report_to_dict(stale_cleanup_report),
            "stage_reports": {},
        },
    )
    _append_stage_report(
        pipeline_attempt,
        stage="stale_workspace_cleanup",
        status_value="completed",
        payload=stale_cleanup_report_to_dict(stale_cleanup_report),
    )

    try:
        _set_processing_status(session, "validating")
        validation_job = _create_job(
            db,
            upload_session_id=session.upload_session_id,
            job_kind="intake_validation",
            status_value="running",
            payload={
                "declared_content_type": uploaded_file.content_type or "unknown",
                "filename_extension": Path(uploaded_file.filename or "").suffix.lower() or None,
                "client_filename_supplied": bool(uploaded_file.filename),
            },
        )
        _record_stage_audit_event(
            db,
            upload_session_id=session.upload_session_id,
            actor_id=actor_id,
            stage="intake_validation",
            status_value="started",
            payload=validation_job.job_payload,
        )
        try:
            raw_path, total_size, header = _write_upload_to_workspace(
                workspace,
                uploaded_file,
                deadline=deadline,
            )
            session.upload_format = _determine_upload_format(uploaded_file, header=header)
            deadline = _processing_deadline(
                started_at_monotonic,
                upload_format=session.upload_format,
            )
            _validate_source_file(raw_path, upload_format=session.upload_format)
        except APIContractError as exc:
            validation_failure_payload = {
                "code": exc.code,
                "details": exc.details,
            }
            _update_job(
                validation_job,
                status_value="failed",
                failure_reason=exc.code,
                payload_updates=validation_failure_payload,
            )
            _append_stage_report(
                pipeline_attempt,
                stage="intake_validation",
                status_value="failed",
                payload=validation_failure_payload,
            )
            _record_stage_audit_event(
                db,
                upload_session_id=session.upload_session_id,
                actor_id=actor_id,
                stage="intake_validation",
                status_value="failed",
                payload=validation_failure_payload,
            )
            raise

        _set_processing_status(session, "received")
        validation_payload = {
            "upload_bytes": total_size,
            "detected_format": session.upload_format,
            "declared_content_type": uploaded_file.content_type or "unknown",
            "filename_extension": Path(uploaded_file.filename or "").suffix.lower() or None,
            "raw_upload_present_in_temp_workspace": raw_path.exists(),
        }
        _update_job(
            validation_job,
            status_value="completed",
            payload_updates=validation_payload,
        )
        _append_stage_report(
            pipeline_attempt,
            stage="intake_validation",
            status_value="completed",
            payload=validation_payload,
        )
        _record_stage_audit_event(
            db,
            upload_session_id=session.upload_session_id,
            actor_id=actor_id,
            stage="intake_validation",
            status_value="completed",
            payload=validation_payload,
        )
        _log_upload_event(
            "validated",
            upload_session_id=session.upload_session_id,
            upload_format=session.upload_format,
            upload_bytes=total_size,
        )

        _deadline_guard(deadline)
        _set_processing_status(session, "sanitizing")
        metadata_job = _create_job(
            db,
            upload_session_id=session.upload_session_id,
            job_kind="metadata_purge",
            status_value="running",
        )
        _record_stage_audit_event(
            db,
            upload_session_id=session.upload_session_id,
            actor_id=actor_id,
            stage="metadata_purge",
            status_value="started",
        )
        try:
            metadata_result = purge_source_metadata(
                workspace=workspace,
                raw_path=raw_path,
                upload_format=session.upload_format,
            )
        except APIContractError:
            raise
        except Exception as exc:
            metadata_failure_payload = {"code": "metadata_purge_failed"}
            _update_job(
                metadata_job,
                status_value="failed",
                failure_reason="metadata_purge_failed",
                payload_updates=metadata_failure_payload,
            )
            _append_stage_report(
                pipeline_attempt,
                stage="metadata_purge",
                status_value="failed",
                payload=metadata_failure_payload,
            )
            _record_stage_audit_event(
                db,
                upload_session_id=session.upload_session_id,
                actor_id=actor_id,
                stage="metadata_purge",
                status_value="failed",
                payload=metadata_failure_payload,
            )
            raise APIContractError(
                code="metadata_purge_failed",
                message="The uploaded file could not be sanitized.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                details={"upload_session_id": session.upload_session_id},
            ) from exc
        workspace.register_artifact("sanitized_upload", metadata_result.sanitized_path)
        metadata_payload = {"summary": metadata_result.summary}
        _update_job(
            metadata_job,
            status_value="completed",
            payload_updates=metadata_payload,
        )
        _append_stage_report(
            pipeline_attempt,
            stage="metadata_purge",
            status_value="completed",
            payload=metadata_payload,
        )
        _record_stage_audit_event(
            db,
            upload_session_id=session.upload_session_id,
            actor_id=actor_id,
            stage="metadata_purge",
            status_value="completed",
            payload=metadata_payload,
        )

        _deadline_guard(deadline)
        _set_processing_status(session, "redacting")
        redaction_job = _create_job(
            db,
            upload_session_id=session.upload_session_id,
            job_kind="ocr_redaction",
            status_value="running",
            payload={"provider": redaction_service.provider_name},
        )
        _record_stage_audit_event(
            db,
            upload_session_id=session.upload_session_id,
            actor_id=actor_id,
            stage="ocr_redaction",
            status_value="started",
            payload={"provider": redaction_service.provider_name},
        )
        try:
            redaction_result = redaction_service.redact(
                source_path=metadata_result.sanitized_path,
                upload_format=session.upload_format,
            )
        except OCRRedactionError as exc:
            session.redaction_summary = {
                "metadata_purge": metadata_result.summary,
                "ocr_redaction": exc.summary,
                "hipaa_identifier_strip_stage": "ocr_redaction",
            }
            session.phi_redaction_applied = False
            redaction_failure_payload = {
                "provider": redaction_service.provider_name,
                "failure_stage": exc.summary.get("failure_stage"),
            }
            _update_job(
                redaction_job,
                status_value="failed",
                failure_reason="ocr_redaction_failed",
                payload_updates=redaction_failure_payload,
            )
            _append_stage_report(
                pipeline_attempt,
                stage="ocr_redaction",
                status_value="failed",
                payload={
                    **redaction_failure_payload,
                    "summary": exc.summary,
                },
            )
            _record_stage_audit_event(
                db,
                upload_session_id=session.upload_session_id,
                actor_id=actor_id,
                stage="ocr_redaction",
                status_value="failed",
                payload=redaction_failure_payload,
            )
            raise APIContractError(
                code="ocr_redaction_failed",
                message="The uploaded file could not complete the redaction stage.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                details={
                    "upload_session_id": session.upload_session_id,
                    "failure_stage": exc.summary.get("failure_stage"),
                },
            ) from exc
        except Exception as exc:
            session.redaction_summary = {
                "metadata_purge": metadata_result.summary,
                "ocr_redaction": {
                    "stage": "ocr_redaction",
                    "status": "failed",
                    "provider": redaction_service.provider_name,
                    "failure_stage": "unexpected_error",
                    "failure_reason": exc.__class__.__name__,
                    "recognized_text_persisted": False,
                },
                "hipaa_identifier_strip_stage": "ocr_redaction",
            }
            session.phi_redaction_applied = False
            redaction_failure_payload = {
                "provider": redaction_service.provider_name,
                "failure_stage": "unexpected_error",
            }
            _update_job(
                redaction_job,
                status_value="failed",
                failure_reason="ocr_redaction_failed",
                payload_updates=redaction_failure_payload,
            )
            _append_stage_report(
                pipeline_attempt,
                stage="ocr_redaction",
                status_value="failed",
                payload={
                    **redaction_failure_payload,
                    "summary": session.redaction_summary["ocr_redaction"],
                },
            )
            _record_stage_audit_event(
                db,
                upload_session_id=session.upload_session_id,
                actor_id=actor_id,
                stage="ocr_redaction",
                status_value="failed",
                payload=redaction_failure_payload,
            )
            raise APIContractError(
                code="ocr_redaction_failed",
                message="The uploaded file could not complete the redaction stage.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                details={"upload_session_id": session.upload_session_id},
            ) from exc
        workspace.register_artifact("redacted_upload", redaction_result.redacted_path)
        session.redaction_summary = {
            "metadata_purge": metadata_result.summary,
            "ocr_redaction": redaction_result.summary,
            "hipaa_identifier_strip_stage": "ocr_redaction",
        }
        session.phi_redaction_applied = redaction_result.phi_redaction_applied
        redaction_payload = {
            "provider": redaction_service.provider_name,
            "detected_text_region_count": redaction_result.summary.get(
                "detected_text_region_count",
                0,
            ),
            "redaction_applied": redaction_result.phi_redaction_applied,
            "summary": redaction_result.summary,
        }
        _update_job(
            redaction_job,
            status_value="completed",
            payload_updates=redaction_payload,
        )
        _append_stage_report(
            pipeline_attempt,
            stage="ocr_redaction",
            status_value="completed",
            payload=redaction_payload,
        )
        _record_stage_audit_event(
            db,
            upload_session_id=session.upload_session_id,
            actor_id=actor_id,
            stage="ocr_redaction",
            status_value="completed",
            payload={
                "provider": redaction_service.provider_name,
                "redaction_applied": redaction_result.phi_redaction_applied,
                "detected_text_region_count": redaction_result.summary.get(
                    "detected_text_region_count",
                    0,
                ),
            },
        )

        _deadline_guard(deadline)
        _set_processing_status(session, "transforming")
        transform_job = _create_job(
            db,
            upload_session_id=session.upload_session_id,
            job_kind="artistic_transform",
            status_value="running",
            payload={"provider": artistic_transform_service.provider_name},
        )
        _record_stage_audit_event(
            db,
            upload_session_id=session.upload_session_id,
            actor_id=actor_id,
            stage="artistic_transform",
            status_value="started",
            payload={"provider": artistic_transform_service.provider_name},
        )
        try:
            transform_result = artistic_transform_service.transform(
                source_path=redaction_result.redacted_path,
                upload_format=session.upload_format,
            )
        except ArtisticTransformError as exc:
            session.anonymization_summary = {
                "source_stage": "ocr_redaction",
                "artistic_transform": exc.summary,
                "raw_to_derived_handoff": {
                    "tile_derivation_input_stage": None,
                    "tile_derivation_reads_raw_upload": False,
                    "tile_derivation_reads_redacted_upload": False,
                    "derived_artifact_retained_only_in_temp_workspace": True,
                },
            }
            transform_failure_payload = {
                "provider": artistic_transform_service.provider_name,
                "failure_stage": exc.summary.get("failure_stage"),
            }
            _update_job(
                transform_job,
                status_value="failed",
                failure_reason="artistic_transform_failed",
                payload_updates=transform_failure_payload,
            )
            _append_stage_report(
                pipeline_attempt,
                stage="artistic_transform",
                status_value="failed",
                payload={
                    **transform_failure_payload,
                    "summary": exc.summary,
                },
            )
            _record_stage_audit_event(
                db,
                upload_session_id=session.upload_session_id,
                actor_id=actor_id,
                stage="artistic_transform",
                status_value="failed",
                payload=transform_failure_payload,
            )
            raise APIContractError(
                code="artistic_transform_failed",
                message="The upload could not complete the artistic anonymization stage.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                details={
                    "upload_session_id": session.upload_session_id,
                    "failure_stage": exc.summary.get("failure_stage"),
                },
            ) from exc
        except Exception as exc:
            session.anonymization_summary = {
                "source_stage": "ocr_redaction",
                "artistic_transform": {
                    "stage": "artistic_transform",
                    "status": "failed",
                    "provider": artistic_transform_service.provider_name,
                    "failure_stage": "unexpected_error",
                    "failure_reason": exc.__class__.__name__,
                    "clinical_interpretation_supported": False,
                    "biometric_fidelity_preserved": False,
                },
                "raw_to_derived_handoff": {
                    "tile_derivation_input_stage": None,
                    "tile_derivation_reads_raw_upload": False,
                    "tile_derivation_reads_redacted_upload": False,
                    "derived_artifact_retained_only_in_temp_workspace": True,
                },
            }
            transform_failure_payload = {
                "provider": artistic_transform_service.provider_name,
                "failure_stage": "unexpected_error",
            }
            _update_job(
                transform_job,
                status_value="failed",
                failure_reason="artistic_transform_failed",
                payload_updates=transform_failure_payload,
            )
            _append_stage_report(
                pipeline_attempt,
                stage="artistic_transform",
                status_value="failed",
                payload={
                    **transform_failure_payload,
                    "summary": session.anonymization_summary["artistic_transform"],
                },
            )
            _record_stage_audit_event(
                db,
                upload_session_id=session.upload_session_id,
                actor_id=actor_id,
                stage="artistic_transform",
                status_value="failed",
                payload=transform_failure_payload,
            )
            raise APIContractError(
                code="artistic_transform_failed",
                message="The upload could not complete the artistic anonymization stage.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                details={"upload_session_id": session.upload_session_id},
            ) from exc
        workspace.register_artifact(
            "artistic_transform_artifact",
            transform_result.transformed_path,
        )
        session.anonymization_summary = {
            "source_stage": "ocr_redaction",
            "artistic_transform": transform_result.summary,
            "raw_to_derived_handoff": {
                "tile_derivation_input_stage": "artistic_transform",
                "tile_derivation_reads_raw_upload": False,
                "tile_derivation_reads_redacted_upload": False,
                "derived_artifact_retained_only_in_temp_workspace": True,
                "derived_artifact_checksum_sha256": transform_result.summary.get(
                    "artifact_checksum_sha256"
                ),
            },
        }
        transform_payload = {
            "provider": artistic_transform_service.provider_name,
            "artifact_checksum_sha256": transform_result.summary.get(
                "artifact_checksum_sha256"
            ),
            "output_dimensions": transform_result.summary.get("output_dimensions"),
            "summary": transform_result.summary,
        }
        _update_job(
            transform_job,
            status_value="completed",
            payload_updates=transform_payload,
        )
        _append_stage_report(
            pipeline_attempt,
            stage="artistic_transform",
            status_value="completed",
            payload=transform_payload,
        )
        _record_stage_audit_event(
            db,
            upload_session_id=session.upload_session_id,
            actor_id=actor_id,
            stage="artistic_transform",
            status_value="completed",
            payload={
                "provider": artistic_transform_service.provider_name,
                "artifact_checksum_sha256": transform_result.summary.get(
                    "artifact_checksum_sha256"
                ),
                "output_dimensions": transform_result.summary.get("output_dimensions"),
            },
        )

        _deadline_guard(deadline)
        _set_processing_status(session, "tile_generating")
        tile_job = _create_job(
            db,
            upload_session_id=session.upload_session_id,
            job_kind="tile_artifact_generation",
            status_value="running",
            payload={
                "input_stage": "artistic_transform",
                "artifact_suffix": transform_result.transformed_path.suffix,
            },
        )
        _record_stage_audit_event(
            db,
            upload_session_id=session.upload_session_id,
            actor_id=actor_id,
            stage="tile_artifact_generation",
            status_value="started",
            payload={"input_stage": "artistic_transform"},
        )
        created_contribution = None
        try:
            tile_visual_derivation = derive_tile_visual_style_from_artifact(
                transformed_path=transform_result.transformed_path,
                source_path=redaction_result.redacted_path,
                source_upload_format=session.upload_format,
                attribution=tile_attribution,
            )
            contribution_distance = determine_contribution_distance(
                redaction_summary=session.redaction_summary,
            )
            distance_cm = contribution_distance.distance_cm
            session.resulting_tile_id = _create_mosaic_tile(
                db,
                upload_session=session,
                visual_style=tile_visual_derivation.visual_style,
                render_version=tile_visual_derivation.render_version,
                rhythm_distance_cm=distance_cm,
            )
            resulting_tile = (
                db.query(MosaicTile)
                .filter(MosaicTile.tile_id == session.resulting_tile_id)
                .one()
            )
            created_contribution = create_real_ecg_contribution(
                db,
                upload_session=session,
                tile=resulting_tile,
                distance_cm=distance_cm,
            )
            record_rhythm_distance(
                db, tile_id=session.resulting_tile_id, distance_cm=distance_cm
            )
        except Exception as exc:
            if session.resulting_tile_id is not None:
                partial_tile = (
                    db.query(MosaicTile)
                    .filter(MosaicTile.tile_id == session.resulting_tile_id)
                    .one_or_none()
                )
                if partial_tile is not None:
                    db.delete(partial_tile)
                    db.flush()
                session.resulting_tile_id = None
            if created_contribution is not None:
                db.delete(created_contribution)
                db.flush()
            if session.resulting_tile_id is None or created_contribution is not None:
                rebuild_rhythm_distance_aggregate(db)
            session.anonymization_summary = {
                **(session.anonymization_summary or {}),
                "tile_visual_derivation": {
                    "stage": "tile_visual_derivation",
                    "status": "failed",
                    "input_stage": "artistic_transform",
                    "failure_reason": exc.__class__.__name__,
                    "clinical_interpretation_supported": False,
                },
            }
            tile_failure_payload = {"input_stage": "artistic_transform"}
            _update_job(
                tile_job,
                status_value="failed",
                failure_reason="tile_artifact_generation_failed",
                payload_updates=tile_failure_payload,
            )
            _append_stage_report(
                pipeline_attempt,
                stage="tile_artifact_generation",
                status_value="failed",
                payload={
                    **tile_failure_payload,
                    "summary": session.anonymization_summary["tile_visual_derivation"],
                },
            )
            _record_stage_audit_event(
                db,
                upload_session_id=session.upload_session_id,
                actor_id=actor_id,
                stage="tile_artifact_generation",
                status_value="failed",
                payload=tile_failure_payload,
            )
            raise APIContractError(
                code="tile_artifact_generation_failed",
                message="The upload could not be converted into a mosaic tile artifact.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                details={"upload_session_id": session.upload_session_id},
            ) from exc
        session.anonymization_summary = {
            **(session.anonymization_summary or {}),
            "tile_visual_derivation": tile_visual_derivation.summary,
            "contribution_distance": contribution_distance.to_summary(),
        }
        tile_payload = {
            "render_version": tile_visual_derivation.render_version,
            "visual_style": _safe_tile_visual_style_payload(
                tile_visual_derivation.visual_style
            ),
            "resulting_tile_id": session.resulting_tile_id,
            "contribution_distance": contribution_distance.to_summary(),
            "attribution": {
                "name_present": bool((tile_attribution or {}).get("contributor_name")),
                "location_present": bool((tile_attribution or {}).get("contributor_location")),
            },
            "summary": tile_visual_derivation.summary,
        }
        _update_job(
            tile_job,
            status_value="completed",
            payload_updates=tile_payload,
        )
        _append_stage_report(
            pipeline_attempt,
            stage="tile_artifact_generation",
            status_value="completed",
            payload=tile_payload,
        )
        _record_stage_audit_event(
            db,
            upload_session_id=session.upload_session_id,
            actor_id=actor_id,
            stage="tile_artifact_generation",
            status_value="completed",
            payload={
                "render_version": tile_visual_derivation.render_version,
                "resulting_tile_id": session.resulting_tile_id,
            },
        )
    except APIContractError as exc:
        _mark_failed(session, exc.code)
        _update_job(pipeline_attempt, status_value="failed", failure_reason=exc.code)
        failure_payload = {
            **(exc.details or {}),
            "processing_status_at_failure": session.processing_status,
        }
        db.add(
            ProcessingJob(
                processing_job_id=str(uuid4()),
                upload_session_id=session.upload_session_id,
                job_kind="failure",
                status="failed",
                attempt_count=1,
                queued_at=utcnow(),
                started_at=utcnow(),
                completed_at=utcnow(),
                failure_reason=exc.code,
                job_payload=failure_payload,
            )
        )
        _record_audit_event(
            db,
            entity_type="upload_session",
            entity_id=session.upload_session_id,
            event_type="upload_session.failed",
            actor_id=actor_id,
            payload={"code": exc.code, "details": failure_payload},
        )
        logger.exception(
            "upload_pipeline.failed upload_session_id=%s code=%s details=%s",
            session.upload_session_id,
            exc.code,
            exc.details,
        )
        raise
    finally:
        if session.processing_status not in {"failed", "cleanup_failed"}:
            _set_processing_status(session, "cleaning_up")
        cleanup_job = _create_job(
            db,
            upload_session_id=session.upload_session_id,
            job_kind="cleanup",
            status_value="running",
        )
        _record_stage_audit_event(
            db,
            upload_session_id=session.upload_session_id,
            actor_id=actor_id,
            stage="cleanup",
            status_value="started",
        )
        try:
            cleanup_report = workspace.cleanup()
            cleanup_payload = cleanup_report_to_dict(cleanup_report)
            if not cleanup_report.workspace_removed:
                raise RuntimeError("temporary_workspace_still_exists")
            session.raw_upload_retained = False
            session.raw_upload_destroyed_at = utcnow()
            session.completed_at = utcnow()
            if session.failure_reason:
                if session.processing_status != "failed":
                    _set_processing_status(session, "failed")
            else:
                _set_processing_status(session, "completed")
            _update_job(
                cleanup_job,
                status_value="completed",
                payload_updates={
                    **cleanup_payload,
                    "raw_upload_destroyed_at": session.raw_upload_destroyed_at.isoformat(),
                    "raw_upload_retained": False,
                },
            )
            _append_stage_report(
                pipeline_attempt,
                stage="cleanup",
                status_value="completed",
                payload={
                    **cleanup_payload,
                    "raw_upload_destroyed_at": session.raw_upload_destroyed_at.isoformat(),
                    "final_processing_status": session.processing_status,
                },
            )
            _record_stage_audit_event(
                db,
                upload_session_id=session.upload_session_id,
                actor_id=actor_id,
                stage="cleanup",
                status_value="completed",
                payload=cleanup_payload,
            )
            _record_audit_event(
                db,
                entity_type="upload_session",
                entity_id=session.upload_session_id,
                event_type="upload_session.cleaned_up",
                actor_id=actor_id,
                payload={
                    **cleanup_payload,
                    "raw_upload_destroyed_at": session.raw_upload_destroyed_at.isoformat(),
                },
            )
            _record_audit_event(
                db,
                entity_type="upload_session",
                entity_id=session.upload_session_id,
                event_type="upload_session.non_retention_verified",
                actor_id=actor_id,
                payload={
                    **cleanup_payload,
                    "raw_upload_retained": False,
                    "raw_upload_destroyed_at": session.raw_upload_destroyed_at.isoformat(),
                },
            )
            if session.failure_reason is None:
                _update_job(pipeline_attempt, status_value="completed")
                _record_audit_event(
                    db,
                    entity_type="upload_session",
                    entity_id=session.upload_session_id,
                    event_type="upload_session.processed",
                    actor_id=actor_id,
                    payload={"resulting_tile_id": session.resulting_tile_id},
                )
                _log_upload_event(
                    "processed",
                    upload_session_id=session.upload_session_id,
                    resulting_tile_id=session.resulting_tile_id,
                )
        except Exception as cleanup_error:
            previous_failure_reason = session.failure_reason
            _set_processing_status(session, "cleanup_failed")
            session.failure_reason = "cleanup_failed"
            session.completed_at = utcnow()
            cleanup_failure_payload = {
                "error": str(cleanup_error),
                "prior_failure_reason": previous_failure_reason,
            }
            _update_job(
                cleanup_job,
                status_value="failed",
                failure_reason=str(cleanup_error),
                payload_updates=cleanup_failure_payload,
            )
            _append_stage_report(
                pipeline_attempt,
                stage="cleanup",
                status_value="failed",
                payload=cleanup_failure_payload,
            )
            if pipeline_attempt.status != "failed":
                _update_job(
                    pipeline_attempt,
                    status_value="failed",
                    failure_reason="cleanup_failed",
                )
            _record_stage_audit_event(
                db,
                upload_session_id=session.upload_session_id,
                actor_id=actor_id,
                stage="cleanup",
                status_value="failed",
                payload=cleanup_failure_payload,
            )
            _record_audit_event(
                db,
                entity_type="upload_session",
                entity_id=session.upload_session_id,
                event_type="upload_session.cleanup_failed",
                actor_id=actor_id,
                payload=cleanup_failure_payload,
            )
            logger.exception(
                "upload_pipeline.cleanup_failed upload_session_id=%s",
                session.upload_session_id,
            )
        db.flush()


def build_upload_session_response(session: UploadSession) -> dict:
    retryable, status_detail, user_message, recommended_action = STATUS_MESSAGES.get(
        session.processing_status,
        (
            False,
            "Upload session status unavailable.",
            "The upload session is in an unknown state.",
            None,
        ),
    )
    if session.failure_reason:
        retryable, status_detail, user_message, recommended_action = FAILURE_DETAILS.get(
            session.failure_reason,
            (
                True,
                "Upload failed.",
                "The upload failed for an unexpected reason.",
                "Retry the upload or inspect the audit trail.",
            ),
        )

    return {
        "upload_session_id": session.upload_session_id,
        "profile_id": session.profile_id,
        "upload_format": session.upload_format,
        "processing_status": session.processing_status,
        "consent_record_ids": session.consent_record_ids,
        "phi_redaction_applied": session.phi_redaction_applied,
        "raw_upload_retained": False,
        "started_at": session.started_at,
        "completed_at": session.completed_at,
        "resulting_tile_id": session.resulting_tile_id,
        "rhythm_distance_cm": (
            session.mosaic_tile.rhythm_distance_cm
            if getattr(session, "mosaic_tile", None)
            else None
        ),
        "result_tile": _serialize_mosaic_tile(getattr(session, "mosaic_tile", None)),
        "result_contribution": serialize_contribution_summary(
            getattr(session, "rhythm_contribution", None),
            artifact_scope="owned",
        ),
        "contribution_distance": (
            (getattr(session, "anonymization_summary", None) or {}).get("contribution_distance")
            if getattr(session, "anonymization_summary", None)
            else None
        ),
        "failure_reason": session.failure_reason,
        "retryable": retryable,
        "status_detail": status_detail,
        "user_message": user_message,
        "recommended_action": recommended_action,
    }


def reconcile_upload_session_contribution_distance(
    db: Session,
    *,
    session: UploadSession,
) -> bool:
    if session.processing_status != "completed":
        return False
    if session.redaction_summary is None:
        return False
    if getattr(session, "mosaic_tile", None) is None:
        return False

    recalculated = determine_contribution_distance(redaction_summary=session.redaction_summary)
    current_summary = ((session.anonymization_summary or {}).get("contribution_distance") or {})
    current_distance = session.mosaic_tile.rhythm_distance_cm

    if current_summary == recalculated.to_summary() and current_distance == recalculated.distance_cm:
        return False

    session.anonymization_summary = {
        **(session.anonymization_summary or {}),
        "contribution_distance": recalculated.to_summary(),
    }
    session.mosaic_tile.rhythm_distance_cm = recalculated.distance_cm
    db.flush()
    return True
