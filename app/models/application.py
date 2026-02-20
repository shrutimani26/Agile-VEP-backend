from app.extensions import db
from datetime import datetime
from app.models.payment import PaymentStatus
import enum

class ApplicationStatus(enum.Enum):
    DRAFT = 'DRAFT'
    SUBMITTED = 'SUBMITTED'
    PENDING_REVIEW = 'PENDING_REVIEW'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'
    EXPIRED = 'EXPIRED'

class Application(db.Model):
    __tablename__ = 'applications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    status = db.Column(db.Enum(ApplicationStatus), nullable=False, default=ApplicationStatus.DRAFT)
    payment_status = db.Column(db.Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    
    submitted_at = db.Column(db.DateTime)
    reviewed_at = db.Column(db.DateTime)
    decision_reason = db.Column(db.Text)
    expiry_date = db.Column(db.Date)
    
    # Relationships
    documents = db.relationship('DocumentMetadata', backref='application', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='application', lazy=True, cascade='all, delete-orphan')
    crossings = db.relationship('Crossing', backref='application', lazy=True)  # application_id references application
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Application {self.id} - {self.status.value}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'userId': str(self.user_id),
            'vehicleId': str(self.vehicle_id),
            'status': self.status.value,
            'paymentStatus': self.payment_status.value,
            'submittedAt': self.submitted_at.isoformat() if self.submitted_at else None,
            'reviewedAt': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'decisionReason': self.decision_reason,
            'expiryDate': self.expiry_date.isoformat() if self.expiry_date else None,
            'createdAt': self.created_at.isoformat(),
            'documents': [doc.to_dict() for doc in self.documents],
            'user': {
            'id': str(self.user.id),
            'name': self.user.full_name,
            'email': self.user.email,
            'phone': self.user.phone_number},
            'vehicle': self.vehicle.to_dict() if self.vehicle else None
        }