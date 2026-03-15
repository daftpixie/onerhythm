"""add beta waitlist and allowlist tables

Revision ID: 0011_beta_access_waitlist
Revises: 0010_milestone_events
Create Date: 2026-03-15 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0011_beta_access_waitlist"
down_revision = "0010_milestone_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    if bind.dialect.name == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS citext")
        op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
        email_type = postgresql.CITEXT()
        id_type = postgresql.UUID(as_uuid=False)
        metadata_type = postgresql.JSONB(astext_type=sa.Text())
        metadata_default = sa.text("'{}'::jsonb")
        id_default = sa.text("gen_random_uuid()")
    else:
        email_type = sa.String(length=320)
        id_type = sa.String(length=36)
        metadata_type = sa.JSON()
        metadata_default = sa.text("'{}'")
        id_default = None

    op.create_table(
        "beta_waitlist_signups",
        sa.Column("id", id_type, primary_key=True, nullable=False, server_default=id_default),
        sa.Column("email", email_type, nullable=False, unique=True),
        sa.Column("source", sa.Text(), nullable=False, server_default=sa.text("'landing-page'")),
        sa.Column("status", sa.Text(), nullable=False, server_default=sa.text("'pending'")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("metadata", metadata_type, nullable=False, server_default=metadata_default),
    )
    op.create_index(
        "ix_beta_waitlist_signups_status_created_at",
        "beta_waitlist_signups",
        ["status", "created_at"],
    )

    op.create_table(
        "beta_allowlist",
        sa.Column("email", email_type, primary_key=True, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("note", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("beta_allowlist")
    op.drop_index("ix_beta_waitlist_signups_status_created_at", table_name="beta_waitlist_signups")
    op.drop_table("beta_waitlist_signups")
