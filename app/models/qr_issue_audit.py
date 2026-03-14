from app.extensions import db


class QRIssueAudit(db.Model):
    __tablename__ = 'qr_issue_audits'

    audit_id    = db.Column(db.String(50),  primary_key=True)
    qr_id       = db.Column(db.String(50),  db.ForeignKey('qr_codes.qr_id'), nullable=True)  # Null on failed generation
    action      = db.Column(db.String(30),  nullable=False)   # 'generate_success' | 'generate_failed' | 'revoke'
    actor_id    = db.Column(db.String(50),  nullable=False)
    actor_role  = db.Column(db.String(30),  nullable=False)   # 'driver' | 'officer' | 'system'
    request_ip  = db.Column(db.String(45),  nullable=False)
    event_time  = db.Column(db.DateTime,    nullable=False)
    result      = db.Column(db.String(20),  nullable=False)   # 'success' | 'failure'
    reason_code = db.Column(db.String(50),  nullable=False)   # Internal — do not expose to end users

    qr_code = db.relationship('QRCode', backref='issue_audits', foreign_keys=[qr_id])

    def __repr__(self):
        return f'<QRIssueAudit {self.audit_id} {self.action} [{self.result}]>'
