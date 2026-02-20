"""
API v1 Blueprint Package
"""
from flask import Blueprint

# Create blueprints
auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')
vehicle_bp = Blueprint('vehicles', __name__, url_prefix='/api/v1/vehicles')
application_bp = Blueprint('applications', __name__, url_prefix='/api/v1/applications')
document_bp = Blueprint('documents', __name__, url_prefix='/api/v1/documents')
payment_bp = Blueprint('payments', __name__, url_prefix='/api/v1/payments')
crossing_bp = Blueprint('crossings', __name__, url_prefix='/api/v1/crossings')
notification_bp = Blueprint('notifications', __name__, url_prefix='/api/v1/notifications')

# Import routes (do this after blueprint creation to avoid circular imports)
from app.api.v1 import auth, vehicles, applications, documents, payments, crossings, notifications

__all__ = [
    'auth_bp',
    'vehicle_bp',
    'application_bp',
    'document_bp',
    'payment_bp',
    'crossing_bp',
    'notification_bp'
]