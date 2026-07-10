"""device reachability fields

Revision ID: 20260710_ds1
Revises:
Create Date: 2026-07-10
"""

from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy import inspect
from sqlmodel import SQLModel

import powerbeacon.models  # noqa: F401
from alembic import op

# revision identifiers, used by Alembic.
revision = "20260710_ds1"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = set(inspector.get_table_names())

    SQLModel.metadata.create_all(bind)

    if "devices" not in existing_tables:
        return

    existing_columns = {column["name"] for column in inspector.get_columns("devices")}

    if "is_online" not in existing_columns:
        op.add_column(
            "devices",
            sa.Column(
                "is_online",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            ),
        )

    if "last_reachability_check_at" not in existing_columns:
        op.add_column(
            "devices",
            sa.Column(
                "last_reachability_check_at",
                sa.DateTime(timezone=True),
                nullable=True,
            ),
        )

    if "last_online_at" not in existing_columns:
        op.add_column(
            "devices",
            sa.Column(
                "last_online_at",
                sa.DateTime(timezone=True),
                nullable=True,
            ),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if "devices" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("devices")}

    if "last_online_at" in existing_columns:
        op.drop_column("devices", "last_online_at")

    if "last_reachability_check_at" in existing_columns:
        op.drop_column("devices", "last_reachability_check_at")

    if "is_online" in existing_columns:
        op.drop_column("devices", "is_online")
