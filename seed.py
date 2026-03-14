"""
Seed script for Vehicle Permit System
Run with: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import date, datetime
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle
from app.models.application import Application, ApplicationStatus
from app.models.payment import Payment, PaymentStatus
from app.models.notification import Notification


def seed():
    app = create_app()
    with app.app_context():
        print("Dropping and recreating all tables...")
        db.drop_all()
        db.create_all()

        print("Seeding users...")

        # Officers
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

        # Drivers
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

        print("Seeding vehicles...")

        # Driver 1 - 4 vehicles to cover all statuses
        # 1. APPROVED + valid insurance → shows as ACTIVE
        v1_approved = Vehicle(
            user_id=driver1.id,
            plate_no='JRS2024',
            make='Proton',
            model='X50',
            year=2023,
            vin='PROX5000123456789',
            insurance_expiry=date(2027, 6, 15)
        )
        # 2. APPROVED + expired insurance → shows as EXPIRED
        v1_expired = Vehicle(
            user_id=driver1.id,
            plate_no='ABC1234',
            make='Perodua',
            model='Bezza',
            year=2020,
            vin='PERBZ0012345678A0',
            insurance_expiry=date(2023, 1, 1)
        )
        # 3. PENDING REVIEW
        v1_pending = Vehicle(
            user_id=driver1.id,
            plate_no='DEF5678',
            make='Honda',
            model='City',
            year=2022,
            vin='HNDCY0098765432B0',
            insurance_expiry=date(2027, 3, 1)
        )
        # 4. REJECTED
        v1_rejected = Vehicle(
            user_id=driver1.id,
            plate_no='GHI9012',
            make='Toyota',
            model='Vios',
            year=2021,
            vin='TYOVS0011223344C0',
            insurance_expiry=date(2027, 5, 1)
        )
        # 5. APPROVED + expiring soon
        v1_expiring_soon = Vehicle(
            user_id=driver1.id,
            plate_no='XHS9999',
            make='Tesla',
            model='Model 3',
            year=2024,
            vin='TYOVS001128765545',
            insurance_expiry=date(2026, 3, 20)
        )

        # Driver 2 vehicle
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

        print("Seeding applications...")

        # Driver 1 - one application per vehicle status
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

        # Driver 2
        app2 = Application(
            user_id=driver2.id,
            vehicle_id=v2.id,
            status=ApplicationStatus.PENDING_REVIEW,
            payment_status=PaymentStatus.PAID,
            submitted_at=datetime(2024, 2, 15, 8, 0, 0),
            created_at=datetime(2024, 2, 15, 7, 30, 0)
        )

        db.session.add_all([app1_approved, app1_expired, app1_pending, app1_rejected, app1_expiring_soon,app2])
        db.session.flush()

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


if __name__ == '__main__':
    seed()