"""upload session contract fields

Revision ID: 0002_upload_session_contract_fields
Revises: 0001_initial_mvp_schema
Create Date: 2026-03-12
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002_upload_session_contract_fields"
down_revision: Union[str, None] = "0001_initial_mvp_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("upload_sessions") as batch_op:
        batch_op.add_column(
            sa.Column(
                "consent_record_ids",
                sa.JSON(),
                nullable=False,
                server_default="[]",
            )
        )
        batch_op.add_column(sa.Column("resulting_tile_id", sa.String(length=36), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("upload_sessions") as batch_op:
        batch_op.drop_column("resulting_tile_id")
        batch_op.drop_column("consent_record_ids")
