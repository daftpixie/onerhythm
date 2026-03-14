"""extend research pulse summaries with structured translation fields

Revision ID: 0008_research_pulse_summary_fields
Revises: 0007_research_pulse
Create Date: 2026-03-13 01:10:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0008_research_pulse_summary_fields"
down_revision = "0007_research_pulse"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("publication_summary") as batch_op:
        batch_op.add_column(sa.Column("short_summary", sa.Text(), nullable=False, server_default=""))
        batch_op.add_column(sa.Column("plain_language_explanation", sa.Text(), nullable=False, server_default=""))
        batch_op.add_column(sa.Column("what_this_does_not_prove", sa.Text(), nullable=False, server_default=""))
        batch_op.add_column(sa.Column("study_type", sa.String(length=120), nullable=False, server_default="Study"))
        batch_op.add_column(sa.Column("population_sample_size", sa.String(length=255), nullable=True))
        batch_op.add_column(
            sa.Column("questions_to_ask_your_doctor_json", sa.JSON(), nullable=False, server_default="[]")
        )


def downgrade() -> None:
    with op.batch_alter_table("publication_summary") as batch_op:
        batch_op.drop_column("questions_to_ask_your_doctor_json")
        batch_op.drop_column("population_sample_size")
        batch_op.drop_column("study_type")
        batch_op.drop_column("what_this_does_not_prove")
        batch_op.drop_column("plain_language_explanation")
        batch_op.drop_column("short_summary")
