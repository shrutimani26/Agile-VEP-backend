"""
Seed script for Vehicle Permit System
Run with: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import hashlib
import hmac
import os
import uuid
from datetime import date, datetime, timedelta
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle
from app.models.application import Application, ApplicationStatus
from app.models.payment import Payment, PaymentStatus
from app.models.notification import Notification
from app.models.qr_code import QRCode, QRStatus
from app.models.qr_issue_audit import QRIssueAudit
from app.models.qr_scan_log import QRScanLog

# ── Helpers ────────────────────────────────────────────────────────────────────

QR_HMAC_SECRET = os.environ.get('QR_HMAC_SECRET', 'change-me-in-production')

def hash_token(raw_token: str) -> str:
    return hmac.new(
        QR_HMAC_SECRET.encode(),
        raw_token.encode(),
        hashlib.sha256
    ).hexdigest()

def make_token() -> str:
    """Generate a random raw token (UUID4). Hash before persisting."""
    return str(uuid.uuid4())


# ── Seed ───────────────────────────────────────────────────────────────────────

def seed():
    app = create_app()
    with app.app_context():
        print("Dropping and recreating all tables...")
        db.session.execute(db.text('DROP SCHEMA public CASCADE'))
        db.session.execute(db.text('CREATE SCHEMA public'))
        db.session.commit()
        db.create_all()

        # ── Users ──────────────────────────────────────────────────────────────
        print("Seeding users...")

        officer1 = User(
            role=UserRole.OFFICER,
            full_name='Officer Wong',
            email='officer1@lta.gov.sg',
            password_hash=bcrypt.generate_password_hash('password 1').decode('utf-8'),
            phone_number='+65 9123 4567',
            nric_passport='SXXXX123A',
            is_active=True,
            is_verified=True
        )
        officer2 = User(
            role=UserRole.OFFICER,
            full_name='Officer Lim',
            email='officer2@lta.gov.sg',
            password_hash=bcrypt.generate_password_hash('password 2').decode('utf-8'),
            phone_number='+65 9876 5432',
            nric_passport='SXXXX456B',
            is_active=True,
            is_verified=True
        )
        officer3 = User(
            role=UserRole.OFFICER,
            full_name='Officer Singh',
            email='officer3@lta.gov.sg',
            password_hash=bcrypt.generate_password_hash('password 3').decode('utf-8'),
            phone_number='+65 8234 5678',
            nric_passport='SXXXX789C',
            is_active=True,
            is_verified=True
        )

        driver1 = User(
            role=UserRole.DRIVER,
            full_name='Ahmad Ismail',
            email='mdriver1@gmail.com',
            password_hash=bcrypt.generate_password_hash('password 1').decode('utf-8'),
            phone_number='+60123456789',
            nric_passport='XXXXXX-XX-5432',
            is_active=True,
            is_verified=True
        )
        driver2 = User(
            role=UserRole.DRIVER,
            full_name='Siti Aminah',
            email='mdriver2@gmail.com',
            password_hash=bcrypt.generate_password_hash('password 2').decode('utf-8'),
            phone_number='+60198765432',
            nric_passport='XXXXXX-XX-1122',
            is_active=True,
            is_verified=True
        )
        driver3 = User(
            role=UserRole.DRIVER,
            full_name='Lee Chong Wei',
            email='mdriver3@gmail.com',
            password_hash=bcrypt.generate_password_hash('password 3').decode('utf-8'),
            phone_number='+60112233445',
            nric_passport='XXXXXX-XX-9988',
            is_active=True,
            is_verified=True
        )

        db.session.add_all([officer1, officer2, officer3, driver1, driver2, driver3])
        db.session.flush()

        # ── Vehicles ───────────────────────────────────────────────────────────
        print("Seeding vehicles...")

        v1_approved = Vehicle(
            user_id=driver1.id,
            plate_no='JRS2024',
            make='Proton',
            model='X50',
            year=2023,
            vin='PROX5000123456789',
            insurance_expiry=date(2027, 6, 15)
        )
        v1_expired = Vehicle(
            user_id=driver1.id,
            plate_no='ABC1234',
            make='Perodua',
            model='Bezza',
            year=2020,
            vin='PERBZ0012345678A0',
            insurance_expiry=date(2023, 1, 1)
        )
        v1_pending = Vehicle(
            user_id=driver1.id,
            plate_no='DEF5678',
            make='Honda',
            model='City',
            year=2022,
            vin='HNDCY0098765432B0',
            insurance_expiry=date(2027, 3, 1)
        )
        v1_rejected = Vehicle(
            user_id=driver1.id,
            plate_no='GHI9012',
            make='Toyota',
            model='Vios',
            year=2021,
            vin='TYOVS0011223344C0',
            insurance_expiry=date(2027, 5, 1)
        )
        v1_expiring_soon = Vehicle(
            user_id=driver1.id,
            plate_no='XHS9999',
            make='Tesla',
            model='Model 3',
            year=2024,
            vin='TYOVS001128765545',
            insurance_expiry=date(2026, 3, 20)
        )
        v2 = Vehicle(
            user_id=driver2.id,
            plate_no='WVV8888',
            make='Perodua',
            model='Myvi',
            year=2021,
            vin='PERMY99887766123',
            insurance_expiry=date(2026, 5, 10)
        )

        db.session.add_all([v1_approved, v1_expired, v1_pending, v1_rejected, v1_expiring_soon, v2])
        db.session.flush()

        # ── Applications ───────────────────────────────────────────────────────
        print("Seeding applications...")

        app1_approved = Application(
            user_id=driver1.id,
            vehicle_id=v1_approved.id,
            status=ApplicationStatus.APPROVED,
            payment_status=PaymentStatus.PAID,
            submitted_at=datetime(2024, 1, 1, 10, 0, 0),
            reviewed_at=datetime(2024, 1, 2, 14, 30, 0),
            expiry_date=date(2027, 1, 1),
            created_at=datetime(2024, 1, 1, 9, 0, 0)
        )
        app1_expired = Application(
            user_id=driver1.id,
            vehicle_id=v1_expired.id,
            status=ApplicationStatus.APPROVED,  # approved but insurance expired
            payment_status=PaymentStatus.PAID,
            submitted_at=datetime(2023, 1, 1, 10, 0, 0),
            reviewed_at=datetime(2023, 1, 2, 14, 30, 0),
            expiry_date=date(2024, 1, 1),
            created_at=datetime(2023, 1, 1, 9, 0, 0)
        )
        app1_pending = Application(
            user_id=driver1.id,
            vehicle_id=v1_pending.id,
            status=ApplicationStatus.PENDING_REVIEW,
            payment_status=PaymentStatus.PAID,
            submitted_at=datetime(2024, 3, 1, 8, 0, 0),
            created_at=datetime(2024, 3, 1, 7, 30, 0)
        )
        app1_rejected = Application(
            user_id=driver1.id,
            vehicle_id=v1_rejected.id,
            status=ApplicationStatus.REJECTED,
            payment_status=PaymentStatus.PAID,
            submitted_at=datetime(2024, 2, 1, 8, 0, 0),
            reviewed_at=datetime(2024, 2, 3, 10, 0, 0),
            decision_reason='Insurance documents could not be verified.',
            created_at=datetime(2024, 2, 1, 7, 0, 0)
        )
        app1_expiring_soon = Application(
            user_id=driver1.id,
            vehicle_id=v1_expiring_soon.id,
            status=ApplicationStatus.APPROVED,
            payment_status=PaymentStatus.PAID,
            submitted_at=datetime(2024, 1, 1, 10, 0, 0),
            reviewed_at=datetime(2024, 1, 2, 14, 30, 0),
            expiry_date=date(2026, 3, 20),
            created_at=datetime(2024, 1, 1, 9, 0, 0)
        )
        app2 = Application(
            user_id=driver2.id,
            vehicle_id=v2.id,
            status=ApplicationStatus.PENDING_REVIEW,
            payment_status=PaymentStatus.PAID,
            submitted_at=datetime(2024, 2, 15, 8, 0, 0),
            created_at=datetime(2024, 2, 15, 7, 30, 0)
        )

        db.session.add_all([
            app1_approved, app1_expired, app1_pending,
            app1_rejected, app1_expiring_soon, app2
        ])
        db.session.flush()

        # ── Notifications ──────────────────────────────────────────────────────
        print("Seeding notifications...")

        notif1 = Notification(
            user_id=driver1.id,
            type='PERMIT_APPROVED',
            title='Application Approved',
            body='Your permit for JRS2024 has been approved. You can now generate your QR code.',
            is_read=False
        )
        notif2 = Notification(
            user_id=driver1.id,
            type='PERMIT_REJECTED',
            title='Application Rejected',
            body='Your application for GHI9012 was rejected. Insurance documents could not be verified.',
            is_read=False
        )

        db.session.add_all([notif1, notif2])
        db.session.flush()

        # ── QR Codes ───────────────────────────────────────────────────────────
        print("Seeding QR codes...")

        raw_001 = make_token()
        raw_002 = make_token()
        raw_003 = make_token()

        qr_001 = QRCode(
            qr_id='QR-2026-000001',
            token_hash=hash_token(raw_001),
            purpose='checkpoint_entry',
            entity_type='vehicle_application',
            entity_id=str(app1_approved.id),
            user_id=str(driver1.id),
            vehicle_id=str(v1_approved.id),
            status=QRStatus.ACTIVE,
            created_at=datetime(2026, 3, 14, 8, 0, 0),
            expires_at=datetime(2026, 3, 14, 23, 59, 59),
            used_at=None,
            revoked_at=None,
            created_by='portal_user',
            generation_channel='web_portal'
        )

        qr_002 = QRCode(
            qr_id='QR-2026-000002',
            token_hash=hash_token(raw_002),
            purpose='checkpoint_entry',
            entity_type='vehicle_application',
            entity_id=str(app1_expiring_soon.id),
            user_id=str(driver1.id),
            vehicle_id=str(v1_expiring_soon.id),
            status=QRStatus.ACTIVE,
            created_at=datetime(2026, 3, 14, 8, 5, 0),
            expires_at=datetime(2026, 3, 14, 23, 59, 59),
            used_at=None,
            revoked_at=None,
            created_by='portal_user',
            generation_channel='mobile_app'
        )

        qr_003 = QRCode(
            qr_id='QR-2026-000003',
            token_hash=hash_token(raw_003),
            purpose='checkpoint_entry',
            entity_type='vehicle_application',
            entity_id=str(app1_expiring_soon.id),
            user_id=str(driver1.id),
            vehicle_id=str(v1_expiring_soon.id),
            status=QRStatus.EXPIRED,
            created_at=datetime(2026, 3, 13, 8, 0, 0),
            expires_at=datetime(2026, 3, 13, 23, 59, 59),
            used_at=None,
            revoked_at=None,
            created_by='portal_user',
            generation_channel='web_portal'
        )

        db.session.add_all([qr_001, qr_002, qr_003])
        db.session.flush()

        # ── QR Issue Audits ────────────────────────────────────────────────────
        print("Seeding QR issue audits...")

        audit_001 = QRIssueAudit(
            audit_id='AUD-2026-000001',
            qr_id='QR-2026-000001',
            action='generate_success',
            actor_id=str(driver1.id),
            actor_role='driver',
            request_ip='203.0.113.10',
            event_time=datetime(2026, 3, 14, 8, 0, 1),
            result='success',
            reason_code='ELIGIBLE_APPROVED'
        )
        audit_002 = QRIssueAudit(
            audit_id='AUD-2026-000002',
            qr_id='QR-2026-000002',
            action='generate_success',
            actor_id=str(driver1.id),
            actor_role='driver',
            request_ip='203.0.113.11',
            event_time=datetime(2026, 3, 14, 8, 5, 1),
            result='success',
            reason_code='ELIGIBLE_APPROVED'
        )
        audit_003 = QRIssueAudit(
            audit_id='AUD-2026-000003',
            qr_id='QR-2026-000003',
            action='generate_success',
            actor_id=str(driver1.id),
            actor_role='driver',
            request_ip='203.0.113.10',
            event_time=datetime(2026, 3, 13, 8, 0, 1),
            result='success',
            reason_code='ELIGIBLE_APPROVED'
        )

        db.session.add_all([audit_001, audit_002, audit_003])
        db.session.flush()

        # ── QR Scan Logs ───────────────────────────────────────────────────────
        print("Seeding QR scan logs...")

        scan_001 = QRScanLog(
            scan_id='SCAN-2026-000001',
            qr_id='QR-2026-000001',
            scan_timestamp=datetime(2026, 3, 14, 9, 45, 22),
            scanner_user_id=str(officer1.id),
            scanner_role='checkpoint_officer',
            scanner_device_id='DEV-WD-01',
            scanner_location='Woodlands Gate A',
            source_ip='10.0.1.10',
            result='success',
            reason_code='VALID_ACTIVE_QR',
            offline_flag=False,
            latency_ms=112,
            request_id='REQ-2026-770001'
        )
        scan_002 = QRScanLog(
            scan_id='SCAN-2026-000002',
            qr_id='QR-2026-000003',
            scan_timestamp=datetime(2026, 3, 14, 7, 55, 10),
            scanner_user_id=str(officer3.id),
            scanner_role='checkpoint_officer',
            scanner_device_id='DEV-TU-01',
            scanner_location='Tuas Gate 1',
            source_ip='10.0.2.10',
            result='denied',
            reason_code='QR_EXPIRED',
            offline_flag=False,
            latency_ms=95,
            request_id='REQ-2026-770002'
        )

        db.session.add_all([scan_001, scan_002])
        db.session.commit()

        print("\n✅ Seeding complete!")
        print("----------------------------")
        print("Demo credentials:")
        print("  Driver 1:  mdriver1@gmail.com / password 1")
        print("             Vehicles: ACTIVE, EXPIRED insurance, PENDING REVIEW, REJECTED, EXPIRING SOON")
        print("  Driver 2:  mdriver2@gmail.com / password 2")
        print("  Driver 3:  mdriver3@gmail.com / password 3")
        print("  Officer 1: officer1@lta.gov.sg / password 1")
        print("  Officer 2: officer2@lta.gov.sg / password 2")
        print("  Officer 3: officer3@lta.gov.sg / password 3")
        print("QR codes seeded:")
        print("  QR-2026-000001  driver1 / JRS2024   ACTIVE   (web portal)")
        print("  QR-2026-000002  driver1 / XHS9999   ACTIVE   (mobile app)")
        print("  QR-2026-000003  driver1 / XHS9999   EXPIRED  (yesterday's QR)")

if __name__ == '__main__':
    seed()