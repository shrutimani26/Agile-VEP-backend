"""Add vehicle application system models

Revision ID: 356b9e912fd6
Revises: 
Create Date: 2026-02-15 12:37:31.965776

"""
from alembic import op
import sqlalchemy as sa


revision = '356b9e912fd6'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    existing = conn.execute(sa.text(
        "SELECT tablename FROM pg_tables WHERE schemaname='public'"
    )).fetchall()
    existing_tables = {row[0] for row in existing}

    if 'users' in existing_tables:
        print("Tables already exist — skipping migration, stamping version only.")
        return

    # Create all enum types safely
    enums = [
        ("userrole",          "'DRIVER', 'OFFICER'"),
        ("paymentstatus",     "'PENDING', 'PAID', 'FAILED'"),
        ("documenttype",      "'LOG_CARD', 'INSURANCE', 'ID'"),
        ("crossingdirection", "'ENTRY', 'EXIT'"),
        ("crossingresult",    "'SUCCESS', 'FAIL'"),
        ("applicationstatus", "'DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED'"),
        ("qrstatus",          "'ACTIVE', 'USED', 'EXPIRED', 'REVOKED'"),
    ]
    for name, values in enums:
        op.execute(f"""
            DO $$ BEGIN
                CREATE TYPE {name} AS ENUM ({values});
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """)

    # users — use VARCHAR then ALTER to enum
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('phone_number', sa.String(length=20), nullable=False),
        sa.Column('nric_passport', sa.String(length=20), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nric_passport')
    )
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole")
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_users_email'), ['email'], unique=True)

    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('refresh_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(length=500), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('is_revoked', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token')
    )

    op.create_table('vehicles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('plate_no', sa.String(length=20), nullable=False),
        sa.Column('make', sa.String(length=50), nullable=False),
        sa.Column('model', sa.String(length=50), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('vin', sa.String(length=17), nullable=False),
        sa.Column('insurance_expiry', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('vin')
    )
    with op.batch_alter_table('vehicles', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_vehicles_plate_no'), ['plate_no'], unique=True)

    # applications — use VARCHAR then ALTER for both enum columns
    op.create_table('applications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('vehicle_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('payment_status', sa.String(length=20), nullable=False),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('decision_reason', sa.Text(), nullable=True),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.execute("ALTER TABLE applications ALTER COLUMN status TYPE applicationstatus USING status::applicationstatus")
    op.execute("ALTER TABLE applications ALTER COLUMN payment_status TYPE paymentstatus USING payment_status::paymentstatus")

    # crossings — use VARCHAR then ALTER for enum columns
    op.create_table('crossings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('application_id', sa.Integer(), nullable=False),
        sa.Column('vehicle_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('direction', sa.String(length=20), nullable=False),
        sa.Column('checkpoint', sa.String(length=100), nullable=False),
        sa.Column('result', sa.String(length=20), nullable=False),
        sa.Column('fail_reason', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['application_id'], ['applications.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.execute("ALTER TABLE crossings ALTER COLUMN direction TYPE crossingdirection USING direction::crossingdirection")
    op.execute("ALTER TABLE crossings ALTER COLUMN result TYPE crossingresult USING result::crossingresult")

    # document_metadata — use VARCHAR then ALTER for enum column
    op.create_table('document_metadata',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('application_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('size', sa.Integer(), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['application_id'], ['applications.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.execute("ALTER TABLE document_metadata ALTER COLUMN type TYPE documenttype USING type::documenttype")

    # payments — use VARCHAR then ALTER for enum column
    op.create_table('payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('application_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('transaction_id', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['application_id'], ['applications.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('transaction_id')
    )
    op.execute("ALTER TABLE payments ALTER COLUMN status TYPE paymentstatus USING status::paymentstatus")


def downgrade():
    op.drop_table('payments')
    op.drop_table('document_metadata')
    op.drop_table('crossings')
    op.drop_table('applications')
    with op.batch_alter_table('vehicles', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_vehicles_plate_no'))
    op.drop_table('vehicles')
    op.drop_table('refresh_tokens')
    op.drop_table('notifications')
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_email'))
    op.drop_table('users')

    op.execute("DROP TYPE IF EXISTS userrole CASCADE")
    op.execute("DROP TYPE IF EXISTS paymentstatus CASCADE")
    op.execute("DROP TYPE IF EXISTS documenttype CASCADE")
    op.execute("DROP TYPE IF EXISTS crossingdirection CASCADE")
    op.execute("DROP TYPE IF EXISTS crossingresult CASCADE")
    op.execute("DROP TYPE IF EXISTS applicationstatus CASCADE")
    op.execute("DROP TYPE IF EXISTS qrstatus CASCADE")