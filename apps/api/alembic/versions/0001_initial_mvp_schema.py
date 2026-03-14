"""initial mvp schema

Revision ID: 0001_initial_mvp_schema
Revises: None
Create Date: 2026-03-12
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001_initial_mvp_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("user_id", sa.String(length=36), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False, unique=True),
        sa.Column("preferred_language", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "profiles",
        sa.Column("profile_id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), nullable=False, unique=True),
        sa.Column("display_name", sa.String(length=120), nullable=True),
        sa.Column("diagnosis_code", sa.String(length=32), nullable=False),
        sa.Column("diagnosis_source", sa.String(length=32), nullable=False),
        sa.Column("free_text_condition", sa.Text(), nullable=True),
        sa.Column("physical_symptoms", sa.JSON(), nullable=False),
        sa.Column("emotional_context", sa.JSON(), nullable=False),
        sa.Column("ablation_count", sa.Integer(), nullable=False),
        sa.Column("has_implantable_device", sa.Boolean(), nullable=True),
        sa.Column("current_medications", sa.JSON(), nullable=False),
        sa.Column("prior_procedures", sa.JSON(), nullable=False),
        sa.Column("personal_narrative", sa.Text(), nullable=True),
        sa.Column("profile_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
    )

    op.create_table(
        "consent_records",
        sa.Column("consent_record_id", sa.String(length=36), primary_key=True),
        sa.Column("profile_id", sa.String(length=36), nullable=False),
        sa.Column("consent_type", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("policy_version", sa.String(length=32), nullable=False),
        sa.Column("locale", sa.String(length=16), nullable=False),
        sa.Column("source", sa.String(length=16), nullable=False),
        sa.Column("effective_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("granted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revocation_reason", sa.String(length=120), nullable=True),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.profile_id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_consent_records_profile_id_effective_at",
        "consent_records",
        ["profile_id", "effective_at"],
    )

    op.create_table(
        "export_requests",
        sa.Column("export_request_id", sa.String(length=36), primary_key=True),
        sa.Column("profile_id", sa.String(length=36), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("download_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("artifact_path", sa.String(length=255), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.profile_id"], ondelete="CASCADE"),
    )

    op.create_table(
        "delete_requests",
        sa.Column("delete_request_id", sa.String(length=36), primary_key=True),
        sa.Column("profile_id", sa.String(length=36), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("audit_retention_reason", sa.String(length=255), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.profile_id"], ondelete="CASCADE"),
    )

    op.create_table(
        "upload_sessions",
        sa.Column("upload_session_id", sa.String(length=36), primary_key=True),
        sa.Column("profile_id", sa.String(length=36), nullable=True),
        sa.Column("upload_format", sa.String(length=16), nullable=False),
        sa.Column("processing_status", sa.String(length=24), nullable=False),
        sa.Column("phi_redaction_applied", sa.Boolean(), nullable=False),
        sa.Column("raw_upload_retained", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("processing_pipeline_version", sa.String(length=32), nullable=False),
        sa.Column("raw_upload_destroyed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("redaction_summary", sa.JSON(), nullable=True),
        sa.Column("anonymization_summary", sa.JSON(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.profile_id"], ondelete="SET NULL"),
    )

    op.create_table(
        "processing_jobs",
        sa.Column("processing_job_id", sa.String(length=36), primary_key=True),
        sa.Column("upload_session_id", sa.String(length=36), nullable=False),
        sa.Column("job_kind", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("queued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("job_payload", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(
            ["upload_session_id"], ["upload_sessions.upload_session_id"], ondelete="CASCADE"
        ),
    )

    op.create_table(
        "mosaic_tiles",
        sa.Column("tile_id", sa.String(length=36), primary_key=True),
        sa.Column("source_upload_session_id", sa.String(length=36), nullable=False, unique=True),
        sa.Column("condition_category", sa.String(length=32), nullable=False),
        sa.Column("display_date", sa.String(length=32), nullable=False),
        sa.Column("is_public", sa.Boolean(), nullable=False),
        sa.Column("visibility_status", sa.String(length=24), nullable=False),
        sa.Column("tile_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("render_version", sa.String(length=32), nullable=False),
        sa.Column("visual_style", sa.JSON(), nullable=False),
        sa.Column("contributed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ledger_adapter_ref", sa.String(length=128), nullable=True),
        sa.ForeignKeyConstraint(
            ["source_upload_session_id"],
            ["upload_sessions.upload_session_id"],
            ondelete="CASCADE",
        ),
    )

    op.create_table(
        "audit_events",
        sa.Column("audit_event_id", sa.String(length=36), primary_key=True),
        sa.Column("event_type", sa.String(length=48), nullable=False),
        sa.Column("entity_type", sa.String(length=48), nullable=False),
        sa.Column("entity_id", sa.String(length=36), nullable=False),
        sa.Column("actor_type", sa.String(length=24), nullable=False),
        sa.Column("actor_id", sa.String(length=36), nullable=True),
        sa.Column("event_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_audit_events_entity_type_entity_id_created_at",
        "audit_events",
        ["entity_type", "entity_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_audit_events_entity_type_entity_id_created_at", table_name="audit_events")
    op.drop_table("audit_events")
    op.drop_table("mosaic_tiles")
    op.drop_table("processing_jobs")
    op.drop_table("upload_sessions")
    op.drop_table("delete_requests")
    op.drop_table("export_requests")
    op.drop_index("ix_consent_records_profile_id_effective_at", table_name="consent_records")
    op.drop_table("consent_records")
    op.drop_table("profiles")
    op.drop_table("users")
