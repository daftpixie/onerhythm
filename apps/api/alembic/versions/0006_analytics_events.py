"""add analytics events

Revision ID: 0006_analytics_events
Revises: 0005_community_stories
Create Date: 2026-03-12 17:45:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0006_analytics_events"
down_revision = "0005_community_stories"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "analytics_events",
        sa.Column("analytics_event_id", sa.String(length=36), primary_key=True),
        sa.Column("event_name", sa.String(length=64), nullable=False),
        sa.Column("path", sa.String(length=255), nullable=False),
        sa.Column("actor_scope", sa.String(length=24), nullable=False),
        sa.Column("visitor_id", sa.String(length=64), nullable=True),
        sa.Column("session_id", sa.String(length=64), nullable=True),
        sa.Column("request_id", sa.String(length=64), nullable=True),
        sa.Column("event_properties", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_analytics_events_event_name_created_at",
        "analytics_events",
        ["event_name", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_analytics_events_event_name_created_at", table_name="analytics_events")
    op.drop_table("analytics_events")
