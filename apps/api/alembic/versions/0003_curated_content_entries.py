"""curated content entries

Revision ID: 0003_curated_content_entries
Revises: 0002_upload_session_contract_fields
Create Date: 2026-03-12
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003_curated_content_entries"
down_revision: Union[str, None] = "0002_upload_session_contract_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "curated_content_entries",
        sa.Column("entry_id", sa.String(length=36), primary_key=True),
        sa.Column("content_key", sa.String(length=128), nullable=False, unique=True),
        sa.Column("locale", sa.String(length=16), nullable=False),
        sa.Column("diagnosis_code", sa.String(length=32), nullable=True),
        sa.Column("content_section", sa.String(length=32), nullable=False),
        sa.Column("evidence_kind", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("source_name", sa.String(length=255), nullable=False),
        sa.Column("source_url", sa.String(length=500), nullable=False),
        sa.Column("source_published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reviewer_ref", sa.String(length=120), nullable=False),
        sa.Column("ingestion_run_id", sa.String(length=36), nullable=False),
        sa.Column("source_checksum", sa.String(length=128), nullable=False),
        sa.Column("content_payload", sa.JSON(), nullable=False),
        sa.Column("provenance", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_curated_content_locale_section_diagnosis",
        "curated_content_entries",
        ["locale", "content_section", "diagnosis_code"],
    )


def downgrade() -> None:
    op.drop_index("ix_curated_content_locale_section_diagnosis", table_name="curated_content_entries")
    op.drop_table("curated_content_entries")
