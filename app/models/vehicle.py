from app.extensions import db
from datetime import datetime
import enum

class Vehicle(db.Model):
    __tablename__ = 'vehicles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    plate_no = db.Column(db.String(20), unique=True, nullable=False, index=True)
    make = db.Column(db.String(50), nullable=False)
    model = db.Column(db.String(50), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    vin = db.Column(db.String(17), unique=True, nullable=False)
    insurance_expiry = db.Column(db.Date, nullable=False)
    is_blacklisted = db.Column(db.Boolean, default=False, nullable=False)
    
    # Relationships
    applications = db.relationship('Application', backref='vehicle', lazy=True, cascade='all, delete-orphan')
    crossings = db.relationship('Crossing', backref='vehicle', lazy=True, cascade='all, delete-orphan')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Vehicle {self.plate_no}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'userId': str(self.user_id),
            'plateNo': self.plate_no,
            'make': self.make,
            'model': self.model,
            'year': self.year,
            'vin': self.vin,
            'insuranceExpiry': self.insurance_expiry.isoformat(),
            'isBlacklisted': self.is_blacklisted,
            'createdAt': self.created_at.isoformat()
        }