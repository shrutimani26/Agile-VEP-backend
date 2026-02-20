from app.extensions import db
from datetime import datetime
import enum

class PaymentStatus(enum.Enum):
    PENDING = 'PENDING'
    PAID = 'PAID'
    FAILED = 'FAILED'

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default='SGD')
    status = db.Column(db.Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    
    payment_method = db.Column(db.String(50))
    transaction_id = db.Column(db.String(100), unique=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Payment {self.id} - {self.status.value}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'applicationId': str(self.application_id),
            'amount': float(self.amount),
            'currency': self.currency,
            'status': self.status.value,
            'createdAt': self.created_at.isoformat()
        }