"""Add credit_limit column to customers table

Revision ID: 0003_customer_credit_limit
Revises: 0002_order_dispatch_tracking
Create Date: 2026-11-26
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0003_customer_credit_limit"
down_revision: Union[str, Sequence[str], None] = "0002_order_dispatch_tracking"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    cols = {c["name"] for c in inspector.get_columns("customers")}
    if "credit_limit" not in cols:
        op.add_column("customers", sa.Column("credit_limit", sa.Float(), nullable=True, server_default="250000.0"))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    cols = {c["name"] for c in inspector.get_columns("customers")}
    if "credit_limit" in cols:
        op.drop_column("customers", "credit_limit")
