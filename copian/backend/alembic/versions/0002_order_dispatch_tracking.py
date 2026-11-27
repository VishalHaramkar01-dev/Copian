"""Add courier_name and tracking_number to orders table

Revision ID: 0002_order_dispatch_tracking
Revises: 0001_baseline
Create Date: 2026-11-26
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002_order_dispatch_tracking"
down_revision: Union[str, Sequence[str], None] = "0001_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    cols = {c["name"] for c in inspector.get_columns("orders")}
    if "courier_name" not in cols:
        op.add_column("orders", sa.Column("courier_name", sa.String(length=120), nullable=True, server_default=""))
    if "tracking_number" not in cols:
        op.add_column("orders", sa.Column("tracking_number", sa.String(length=120), nullable=True, server_default=""))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    cols = {c["name"] for c in inspector.get_columns("orders")}
    if "tracking_number" in cols:
        op.drop_column("orders", "tracking_number")
    if "courier_name" in cols:
        op.drop_column("orders", "courier_name")
