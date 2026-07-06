"""expand user roles to admin coordenacao analista

Revision ID: 32ecf08e4472
Revises: ee29fa296419
Create Date: 2026-07-06 10:19:24.498497

"""
from alembic import op
import sqlalchemy as sa


revision = '32ecf08e4472'
down_revision = 'ee29fa296419'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Perfil generico "USER" foi substituido por ADMIN / COORDENACAO / ANALISTA.
    # Contas antigas com o perfil generico passam a ser ANALISTA (visualizacao).
    op.execute("UPDATE users SET role = 'ANALISTA' WHERE role = 'USER'")
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column(
            'role',
            existing_type=sa.VARCHAR(length=5),
            type_=sa.Enum('ADMIN', 'COORDENACAO', 'ANALISTA', name='userrole'),
            existing_nullable=False,
        )


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column(
            'role',
            existing_type=sa.Enum('ADMIN', 'COORDENACAO', 'ANALISTA', name='userrole'),
            type_=sa.VARCHAR(length=5),
            existing_nullable=False,
        )
    op.execute("UPDATE users SET role = 'USER' WHERE role = 'ANALISTA'")
