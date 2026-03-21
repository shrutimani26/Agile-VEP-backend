"""
Models package for Vehicle Permit System
"""
from app.models.user import User, RefreshToken, UserRole
from app.models.vehicle import Vehicle
from app.models.payment import Payment, PaymentStatus
from app.models.document import DocumentMetadata, DocumentType
from app.models.crossing import Crossing, CrossingDirection, CrossingResult
from app.models.application import Application, ApplicationStatus
from app.models.notification import Notification
from app.models.qr_code import QRCode, QRStatus
from app.models.qr_issue_audit import QRIssueAudit
from app.models.qr_scan_log import QRScanLog

__all__ = [
    # User models
    'User',
    'RefreshToken',
    'UserRole',
    # Vehicle model
    'Vehicle',
    # Payment models
    'Payment',
    'PaymentStatus',
    # Application models
    'Application',
    'ApplicationStatus',
    # Document models
    'DocumentMetadata',
    'DocumentType',
    # Crossing models
    'Crossing',
    'CrossingDirection',
    'CrossingResult',
    # Notification model
    'Notification',
    # QR models
    'QRCode',
    'QRStatus',
    'QRIssueAudit',
    'QRScanLog',
]