"""add milestone events tracking table

Revision ID: 0010_milestone_events
Revises: 0009_rhythm_distance
Create Date: 2026-03-14 00:01:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0010_milestone_events"
down_revision = "0009_rhythm_distance"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "milestone_events",
        sa.Column("milestone_event_id", sa.String(36), primary_key=True),
        sa.Column("milestone_key", sa.String(32), nullable=False, unique=True),
        sa.Column("reached_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("distance_at_crossing_km", sa.Float(), nullable=False),
        sa.Column("contribution_count", sa.Integer(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("milestone_events")
