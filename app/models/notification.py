from app.extensions import db
from datetime import datetime
import enum

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<Notification {self.id} - {self.type}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'userId': str(self.user_id),
            'type': self.type,
            'title': self.title,
            'body': self.body,
            'isRead': self.is_read,
            'createdAt': self.created_at.isoformat()
        }