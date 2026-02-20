from app.extensions import db
from datetime import datetime
import enum

class CrossingDirection(enum.Enum):
    ENTRY = 'ENTRY'
    EXIT = 'EXIT'

class CrossingResult(enum.Enum):
    SUCCESS = 'SUCCESS'
    FAIL = 'FAIL'
    
class Crossing(db.Model):
    __tablename__ = 'crossings'
    
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)  # References application
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    direction = db.Column(db.Enum(CrossingDirection), nullable=False)
    checkpoint = db.Column(db.String(100), nullable=False)
    result = db.Column(db.Enum(CrossingResult), nullable=False, default=CrossingResult.SUCCESS)
    fail_reason = db.Column(db.Text)
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<Crossing {self.id} - {self.direction.value}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'applicationId': str(self.application_id),
            'vehicleId': str(self.vehicle_id),
            'userId': str(self.user_id),
            'direction': self.direction.value,
            'checkpoint': self.checkpoint,
            'timestamp': self.timestamp.isoformat(),
            'result': self.result.value,
            'failReason': self.fail_reason
        }