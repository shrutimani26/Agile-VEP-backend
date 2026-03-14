from app.extensions import db


class QRScanLog(db.Model):
    __tablename__ = 'qr_scan_logs'

    scan_id           = db.Column(db.String(50),  primary_key=True)
    qr_id             = db.Column(db.String(50),  db.ForeignKey('qr_codes.qr_id'), nullable=True)  # Null if token unrecognised
    scan_timestamp    = db.Column(db.DateTime,    nullable=False)
    scanner_user_id   = db.Column(db.String(50),  nullable=False)
    scanner_role      = db.Column(db.String(30),  nullable=False)   # e.g. 'checkpoint_officer'
    scanner_device_id = db.Column(db.String(50),  nullable=False)   # Managed device id
    scanner_location  = db.Column(db.String(100), nullable=False)   # e.g. 'Woodlands Gate A'
    source_ip         = db.Column(db.String(45),  nullable=False)
    result            = db.Column(db.String(20),  nullable=False)   # 'success' | 'denied' | 'invalid' | 'expired'
    reason_code       = db.Column(db.String(50),  nullable=False)   # Internal — do not return full detail to end user
    offline_flag      = db.Column(db.Boolean,     nullable=False, default=False)
    latency_ms        = db.Column(db.Integer,     nullable=False, default=0)
    request_id        = db.Column(db.String(50),  nullable=False)   # Trace / correlation id for SIEM

    qr_code = db.relationship('QRCode', backref='scan_logs', foreign_keys=[qr_id])

    def __repr__(self):
        return f'<QRScanLog {self.scan_id} {self.result} @ {self.scanner_location}>'
