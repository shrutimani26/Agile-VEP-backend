from app.extensions import db
from datetime import datetime
import enum

class DocumentType(enum.Enum):
    LOG_CARD = 'LOG_CARD'
    INSURANCE = 'INSURANCE'
    ID = 'ID'

class DocumentMetadata(db.Model):
    __tablename__ = 'document_metadata'
    
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    type = db.Column(db.Enum(DocumentType), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    size = db.Column(db.Integer, nullable=False)  # Size in bytes
    file_path = db.Column(db.String(500))  # Path to stored file
    
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<Document {self.name} - {self.type.value}>'
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'applicationId': str(self.application_id),
            'type': self.type.value,
            'name': self.name,
            'size': self.size,
            'uploadedAt': self.uploaded_at.isoformat()
        }