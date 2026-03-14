"""auth foundations

Revision ID: 0004_auth_foundations
Revises: 0003_curated_content_entries
Create Date: 2026-03-12
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0004_auth_foundations"
down_revision: Union[str, None] = "0003_curated_content_entries"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(
            sa.Column("password_hash", sa.String(length=255), nullable=False, server_default="")
        )
        batch_op.add_column(
            sa.Column("role", sa.String(length=24), nullable=False, server_default="user")
        )

    with op.batch_alter_table("upload_sessions") as batch_op:
        batch_op.add_column(
            sa.Column("user_id", sa.String(length=36), nullable=True)
        )

    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            update upload_sessions
            set user_id = (
                select profiles.user_id
                from profiles
                where profiles.profile_id = upload_sessions.profile_id
            )
            where profile_id is not null
            """
        )
    )
    connection.execute(sa.text("delete from upload_sessions where user_id is null"))

    with op.batch_alter_table("upload_sessions") as batch_op:
        batch_op.alter_column("user_id", nullable=False)
        batch_op.create_foreign_key(
            "fk_upload_sessions_user_id_users",
            "users",
            ["user_id"],
            ["user_id"],
            ondelete="CASCADE",
        )

    op.create_table(
        "user_sessions",
        sa.Column("session_id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_user_sessions_user_id_expires_at",
        "user_sessions",
        ["user_id", "expires_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_user_sessions_user_id_expires_at", table_name="user_sessions")
    op.drop_table("user_sessions")

    with op.batch_alter_table("upload_sessions") as batch_op:
        batch_op.drop_constraint("fk_upload_sessions_user_id_users", type_="foreignkey")
        batch_op.drop_column("user_id")

    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("role")
        batch_op.drop_column("password_hash")
