"""add rhythm distance tracking to mosaic tiles and aggregate table

Revision ID: 0009_rhythm_distance
Revises: 0008_research_pulse_summary_fields
Create Date: 2026-03-14 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0009_rhythm_distance"
down_revision = "0008_research_pulse_summary_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("mosaic_tiles") as batch_op:
        batch_op.add_column(
            sa.Column("rhythm_distance_cm", sa.Float(), nullable=True)
        )

    op.create_table(
        "rhythm_distance_aggregate",
        sa.Column("aggregate_id", sa.String(36), primary_key=True),
        sa.Column(
            "total_distance_cm",
            sa.Float(),
            nullable=False,
            server_default="0.0",
        ),
        sa.Column(
            "total_contributions",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "last_contribution_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("rhythm_distance_aggregate")
    with op.batch_alter_table("mosaic_tiles") as batch_op:
        batch_op.drop_column("rhythm_distance_cm")
