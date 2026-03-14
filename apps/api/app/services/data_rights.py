from __future__ import annotations

import json
import os
from datetime import timedelta
from pathlib import Path
from uuid import uuid4

from sqlalchemy.orm import Session

from app.audit import append_audit_event
from app.auth import hash_password, utcnow
from app.db.models import (
    CommunityStory,
    DeleteRequest,
    ExportRequest,
    Profile,
    UploadSession,
    User,
    UserSession,
)
from app.services.consent_state import append_consent_audit_event

EXPORT_TTL_DAYS = int(os.getenv("EXPORT_TTL_DAYS", "7"))
EXPORT_ARTIFACT_DIR = Path(
    os.getenv(
        "EXPORT_ARTIFACT_DIR",
        str(Path(__file__).resolve().parents[2] / "data_exports"),
    )
)
DELETION_SEMANTICS_VERSION = "launch-v1"


def export_response(record: ExportRequest) -> dict[str, object]:
    return {
        "export_request_id": record.export_request_id,
        "profile_id": record.profile_id,
        "status": record.status,
        "requested_at": record.requested_at.isoformat(),
        "completed_at": record.completed_at.isoformat() if record.completed_at else None,
        "download_expires_at": record.download_expires_at.isoformat()
        if record.download_expires_at
        else None,
        "failure_reason": record.failure_reason,
        "artifact_available": bool(record.artifact_path and record.status == "completed"),
    }


def delete_response(record: DeleteRequest) -> dict[str, object]:
    return {
        "delete_request_id": record.delete_request_id,
        "profile_id": record.profile_id,
        "status": record.status,
        "requested_at": record.requested_at.isoformat(),
        "completed_at": record.completed_at.isoformat() if record.completed_at else None,
        "audit_retention_reason": record.audit_retention_reason,
        "failure_reason": record.failure_reason,
    }


def _add_audit(
    db: Session,
    *,
    event_type: str,
    entity_type: str,
    entity_id: str,
    actor_id: str | None,
    payload: dict[str, object] | None = None,
) -> None:
    append_audit_event(
        db,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        actor_type="user" if actor_id else "system",
        actor_id=actor_id,
        payload=payload,
    )


def _export_bundle_for_profile(profile: Profile) -> dict[str, object]:
    user = profile.user
    upload_sessions = list(profile.upload_sessions)
    upload_session_ids = [session.upload_session_id for session in upload_sessions]
    processing_jobs = [
        job
        for session in upload_sessions
        for job in session.processing_jobs
    ]
    mosaic_tiles = [
        session.mosaic_tile
        for session in upload_sessions
        if session.mosaic_tile is not None
    ]
    stories = list(profile.stories)

    return {
        "bundle_version": "launch-v1",
        "generated_at": utcnow().isoformat(),
        "summary": {
            "user_id": user.user_id,
            "profile_id": profile.profile_id,
            "consent_record_count": len(profile.consent_records),
            "upload_session_count": len(upload_sessions),
            "processing_job_count": len(processing_jobs),
            "mosaic_tile_count": len(mosaic_tiles),
            "community_story_count": len(stories),
            "export_request_count": len(profile.export_requests),
            "delete_request_count": len(profile.delete_requests),
        },
        "user": {
            "user_id": user.user_id,
            "email": user.email,
            "preferred_language": user.preferred_language,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
        },
        "profile": {
            "profile_id": profile.profile_id,
            "display_name": profile.display_name,
            "diagnosis_code": profile.diagnosis_code,
            "diagnosis_source": profile.diagnosis_source,
            "free_text_condition": profile.free_text_condition,
            "physical_symptoms": profile.physical_symptoms,
            "emotional_context": profile.emotional_context,
            "ablation_count": profile.ablation_count,
            "has_implantable_device": profile.has_implantable_device,
            "current_medications": profile.current_medications,
            "prior_procedures": profile.prior_procedures,
            "personal_narrative": profile.personal_narrative,
            "profile_version": profile.profile_version,
            "created_at": profile.created_at.isoformat(),
            "updated_at": profile.updated_at.isoformat(),
        },
        "consent_records": [
            {
                "consent_record_id": record.consent_record_id,
                "consent_type": record.consent_type,
                "status": record.status,
                "policy_version": record.policy_version,
                "locale": record.locale,
                "source": record.source,
                "effective_at": record.effective_at.isoformat(),
                "granted_at": record.granted_at.isoformat() if record.granted_at else None,
                "revoked_at": record.revoked_at.isoformat() if record.revoked_at else None,
                "revocation_reason": record.revocation_reason,
            }
            for record in profile.consent_records
        ],
        "upload_sessions": [
            {
                "upload_session_id": session.upload_session_id,
                "upload_format": session.upload_format,
                "processing_status": session.processing_status,
                "consent_record_ids": session.consent_record_ids,
                "phi_redaction_applied": session.phi_redaction_applied,
                "raw_upload_retained": session.raw_upload_retained,
                "processing_pipeline_version": session.processing_pipeline_version,
                "raw_upload_destroyed_at": session.raw_upload_destroyed_at.isoformat()
                if session.raw_upload_destroyed_at
                else None,
                "redaction_summary": session.redaction_summary,
                "anonymization_summary": session.anonymization_summary,
                "started_at": session.started_at.isoformat(),
                "completed_at": session.completed_at.isoformat() if session.completed_at else None,
                "resulting_tile_id": session.resulting_tile_id,
                "failure_reason": session.failure_reason,
            }
            for session in upload_sessions
        ],
        "processing_jobs": [
            {
                "processing_job_id": job.processing_job_id,
                "upload_session_id": job.upload_session_id,
                "job_kind": job.job_kind,
                "status": job.status,
                "attempt_count": job.attempt_count,
                "queued_at": job.queued_at.isoformat(),
                "started_at": job.started_at.isoformat() if job.started_at else None,
                "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                "failure_reason": job.failure_reason,
                "job_payload": job.job_payload,
            }
            for job in processing_jobs
        ],
        "mosaic_tiles": [
            {
                "tile_id": tile.tile_id,
                "condition_category": tile.condition_category,
                "display_date": tile.display_date,
                "is_public": tile.is_public,
                "visibility_status": tile.visibility_status,
                "tile_version": tile.tile_version,
                "render_version": tile.render_version,
                "visual_style": tile.visual_style,
                "contributed_at": tile.contributed_at.isoformat(),
                "ledger_adapter_ref": tile.ledger_adapter_ref,
            }
            for tile in mosaic_tiles
        ],
        "community_stories": [
            {
                "story_id": story.story_id,
                "slug": story.slug,
                "title": story.title,
                "summary": story.summary,
                "body": story.body,
                "visibility_status": story.visibility_status,
                "review_status": story.review_status,
                "author_display_mode": story.author_display_mode,
                "pseudonym": story.pseudonym,
                "consent_record_id": story.consent_record_id,
                "moderator_note": story.moderator_note,
                "submitted_at": story.submitted_at.isoformat() if story.submitted_at else None,
                "reviewed_at": story.reviewed_at.isoformat() if story.reviewed_at else None,
                "published_at": story.published_at.isoformat() if story.published_at else None,
                "created_at": story.created_at.isoformat(),
                "updated_at": story.updated_at.isoformat(),
            }
            for story in stories
        ],
        "export_requests": [
            export_response(record)
            for record in profile.export_requests
            if record.export_request_id
        ],
        "delete_requests": [
            delete_response(record)
            for record in profile.delete_requests
            if record.delete_request_id
        ],
        "retained_because_not_stored": {
            "educational_responses": "Educational response history is not persisted in the current MVP.",
            "raw_uploads": "Original uploads are destroyed during processing and are never retained for export.",
        },
        "related_upload_session_ids": upload_session_ids,
    }


def fulfill_export_request(
    db: Session,
    *,
    request_record: ExportRequest,
    actor_id: str,
) -> ExportRequest:
    request_record.status = "processing"
    request_record.failure_reason = None
    _add_audit(
        db,
        event_type="export_request.processing",
        entity_type="export_request",
        entity_id=request_record.export_request_id,
        actor_id=actor_id,
        payload={"profile_id": request_record.profile_id},
    )
    db.flush()

    try:
        profile = request_record.profile
        bundle = _export_bundle_for_profile(profile)
        EXPORT_ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
        artifact_path = EXPORT_ARTIFACT_DIR / f"{request_record.export_request_id}.json"
        artifact_path.write_text(json.dumps(bundle, indent=2, sort_keys=True), encoding="utf-8")
        request_record.artifact_path = str(artifact_path)
        request_record.status = "completed"
        request_record.completed_at = utcnow()
        request_record.download_expires_at = request_record.completed_at + timedelta(
            days=EXPORT_TTL_DAYS
        )
        _add_audit(
            db,
            event_type="export_request.completed",
            entity_type="export_request",
            entity_id=request_record.export_request_id,
            actor_id=actor_id,
            payload={"artifact_path": str(artifact_path)},
        )
    except Exception as exc:
        request_record.status = "failed"
        request_record.failure_reason = str(exc)
        _add_audit(
            db,
            event_type="export_request.failed",
            entity_type="export_request",
            entity_id=request_record.export_request_id,
            actor_id=actor_id,
            payload={"failure_reason": str(exc)},
        )
        raise

    return request_record


def _scrub_profile(profile: Profile) -> None:
    profile.display_name = None
    profile.diagnosis_code = "other"
    profile.diagnosis_source = "self_reported"
    profile.free_text_condition = None
    profile.physical_symptoms = []
    profile.emotional_context = []
    profile.ablation_count = 0
    profile.has_implantable_device = None
    profile.current_medications = []
    profile.prior_procedures = []
    profile.personal_narrative = None
    profile.profile_version += 1
    profile.updated_at = utcnow()
    profile.deleted_at = utcnow()


def _scrub_user(user: User) -> None:
    user.email = f"deleted+{user.user_id}@onerhythm.local"
    user.password_hash = hash_password(str(uuid4()))
    user.preferred_language = "und"
    user.updated_at = utcnow()
    user.deleted_at = utcnow()


def _destroy_export_artifacts(profile: Profile) -> int:
    destroyed_count = 0
    for export_request in profile.export_requests:
        if export_request.artifact_path:
            artifact_path = Path(export_request.artifact_path)
            if artifact_path.exists():
                artifact_path.unlink()
                destroyed_count += 1
            export_request.artifact_path = None
            export_request.download_expires_at = None
    return destroyed_count


def fulfill_delete_request(
    db: Session,
    *,
    request_record: DeleteRequest,
    actor_id: str,
) -> DeleteRequest:
    profile = request_record.profile
    user = profile.user
    request_record.status = "processing"
    request_record.failure_reason = None
    request_record.audit_retention_reason = (
        "Minimal request and audit metadata retained after off-chain deletion."
    )
    _add_audit(
        db,
        event_type="delete_request.processing",
        entity_type="delete_request",
        entity_id=request_record.delete_request_id,
        actor_id=actor_id,
        payload={"profile_id": profile.profile_id},
    )
    db.flush()

    revoked_consent_count = 0
    for consent_record in profile.consent_records:
        if consent_record.status != "revoked":
            consent_record.status = "revoked"
            consent_record.revoked_at = utcnow()
            consent_record.revocation_reason = "delete_request"
            append_consent_audit_event(
                db,
                event_type="consent.revoked",
                consent_record_id=consent_record.consent_record_id,
                actor_id=actor_id,
                payload={"revocation_reason": "delete_request"},
            )
            revoked_consent_count += 1

    destroyed_artifact_count = _destroy_export_artifacts(profile)
    upload_sessions = list(
        db.query(UploadSession)
        .filter(UploadSession.user_id == user.user_id)
        .all()
    )
    ledger_refs = [
        session.mosaic_tile.ledger_adapter_ref
        for session in upload_sessions
        if session.mosaic_tile and session.mosaic_tile.ledger_adapter_ref
    ]
    removed_tile_count = sum(1 for session in upload_sessions if session.mosaic_tile is not None)
    removed_upload_session_count = len(upload_sessions)
    removed_story_count = db.query(CommunityStory).filter(CommunityStory.profile_id == profile.profile_id).count()

    for ledger_ref in ledger_refs:
        _add_audit(
            db,
            event_type="delete_request.ledger_reference_noted",
            entity_type="delete_request",
            entity_id=request_record.delete_request_id,
            actor_id=actor_id,
            payload={"ledger_adapter_ref": ledger_ref, "handled_by": "adapter_if_present"},
        )

    for session in upload_sessions:
        db.delete(session)

    db.query(CommunityStory).filter(CommunityStory.profile_id == profile.profile_id).delete()

    db.query(UserSession).filter(UserSession.user_id == user.user_id).delete()
    _scrub_profile(profile)
    _scrub_user(user)

    request_record.status = "completed"
    request_record.completed_at = utcnow()
    _add_audit(
        db,
        event_type="delete_request.completed",
        entity_type="delete_request",
        entity_id=request_record.delete_request_id,
        actor_id=actor_id,
        payload={
            "deletion_semantics_version": DELETION_SEMANTICS_VERSION,
            "revoked_consent_count": revoked_consent_count,
            "destroyed_export_artifact_count": destroyed_artifact_count,
            "removed_upload_session_count": removed_upload_session_count,
            "removed_mosaic_tile_count": removed_tile_count,
            "removed_story_count": removed_story_count,
            "ledger_reference_count": len(ledger_refs),
        },
    )
    return request_record
