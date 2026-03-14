import enum
from app.extensions import db


class QRStatus(str, enum.Enum):
    ACTIVE  = 'active'
    USED    = 'used'
    EXPIRED = 'expired'
    REVOKED = 'revoked'


class QRCode(db.Model):
    __tablename__ = 'qr_codes'

    qr_id              = db.Column(db.String(50),  primary_key=True)
    token_hash         = db.Column(db.String(64),  nullable=False, unique=True)  # SHA-256 — never store raw token
    purpose            = db.Column(db.String(50),  nullable=False)               # e.g. 'checkpoint_entry'
    entity_type        = db.Column(db.String(50),  nullable=False)               # e.g. 'vehicle_application'
    entity_id          = db.Column(db.String(50),  nullable=False)
    user_id            = db.Column(db.String(50),  nullable=False)
    vehicle_id         = db.Column(db.String(50),  nullable=False)
    status             = db.Column(db.Enum(QRStatus), nullable=False, default=QRStatus.ACTIVE)
    created_at         = db.Column(db.DateTime,    nullable=False)
    expires_at         = db.Column(db.DateTime,    nullable=False)
    used_at            = db.Column(db.DateTime,    nullable=True)
    revoked_at         = db.Column(db.DateTime,    nullable=True)
    created_by         = db.Column(db.String(50),  nullable=False)               # 'portal_user' | officer id | 'system'
    generation_channel = db.Column(db.String(30),  nullable=False)               # 'web_portal' | 'mobile_app'

    def __repr__(self):
        return f'<QRCode {self.qr_id} [{self.status}]>'
