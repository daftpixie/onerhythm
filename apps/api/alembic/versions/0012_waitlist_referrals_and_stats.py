"""add waitlist referral codes and public stats support

Revision ID: 0012_waitlist_referrals_and_stats
Revises: 0011_beta_access_waitlist
Create Date: 2026-03-15 00:30:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0012_waitlist_referrals_and_stats"
down_revision = "0011_beta_access_waitlist"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("beta_waitlist_signups") as batch_op:
        batch_op.add_column(sa.Column("referral_code", sa.String(length=32), nullable=True))
        batch_op.add_column(
            sa.Column(
                "referred_by_signup_id",
                sa.String(length=36),
                sa.ForeignKey("beta_waitlist_signups.id", ondelete="SET NULL"),
                nullable=True,
            )
        )

    op.execute(
        """
        UPDATE beta_waitlist_signups
        SET referral_code = lower(substr(replace(id, '-', ''), 1, 12))
        WHERE referral_code IS NULL
        """
    )

    with op.batch_alter_table("beta_waitlist_signups") as batch_op:
        batch_op.alter_column("referral_code", existing_type=sa.String(length=32), nullable=False)
        batch_op.create_index(
            "ix_beta_waitlist_signups_referral_code",
            ["referral_code"],
            unique=True,
        )
        batch_op.create_index(
            "ix_beta_waitlist_signups_referred_by_signup_id",
            ["referred_by_signup_id"],
            unique=False,
        )


def downgrade() -> None:
    with op.batch_alter_table("beta_waitlist_signups") as batch_op:
        batch_op.drop_index("ix_beta_waitlist_signups_referred_by_signup_id")
        batch_op.drop_index("ix_beta_waitlist_signups_referral_code")
        batch_op.drop_column("referred_by_signup_id")
        batch_op.drop_column("referral_code")
