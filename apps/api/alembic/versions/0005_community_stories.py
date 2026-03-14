"""community stories

Revision ID: 0005_community_stories
Revises: 0004_auth_foundations
Create Date: 2026-03-12 20:40:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0005_community_stories"
down_revision = "0004_auth_foundations"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "community_stories",
        sa.Column("story_id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("profile_id", sa.String(length=36), nullable=False),
        sa.Column("consent_record_id", sa.String(length=36), nullable=True),
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("visibility_status", sa.String(length=24), nullable=False),
        sa.Column("review_status", sa.String(length=32), nullable=False),
        sa.Column("author_display_mode", sa.String(length=24), nullable=False),
        sa.Column("pseudonym", sa.String(length=120), nullable=True),
        sa.Column("moderator_note", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.profile_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["consent_record_id"],
            ["consent_records.consent_record_id"],
            ondelete="SET NULL",
        ),
        sa.UniqueConstraint("slug"),
    )


def downgrade() -> None:
    op.drop_table("community_stories")
