from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.application_service import ApplicationService
from app.services.vehicle_service import VehicleService
from app.models import UserRole, User
from app.api.v1 import application_bp

# ── Dynamic QR Generation (commented out – not wired up in this demo) ──────────
#
# In a production build, drivers would hit this endpoint to get a fresh QR pass
# instead of relying on the static rows seeded in seed.py.
#
# @application_bp.route('/<int:application_id>/generate-qr', methods=['POST'])
# @jwt_required()
# def generate_qr(application_id):
#     """
#     Generate a single-use, time-limited QR pass for an approved application.
#     POST /api/v1/applications/<id>/generate-qr
#
#     Flow:
#       1. Confirm the caller owns the application.
#       2. Confirm ApplicationStatus == APPROVED and permit has not expired.
#       3. Revoke any still-ACTIVE QR for this application (one pass at a time).
#       4. Mint a new raw token (UUID4) and its HMAC-SHA256 hash.
#       5. Persist QRCode row (stores hash only – raw token is never saved).
#       6. Write a QRIssueAudit row for traceability / audit trail.
#       7. Return the raw token to the frontend so it can render the QR image.
#          The frontend encodes the token into a QR code client-side; the raw
#          token travels only over HTTPS and is never stored server-side.
#     """
#     import hashlib, hmac, os, uuid
#     from datetime import datetime, timedelta
#     from app.extensions import db
#     from app.models.application import Application, ApplicationStatus
#     from app.models.qr_code import QRCode, QRStatus
#     from app.models.qr_issue_audit import QRIssueAudit
#
#     QR_HMAC_SECRET = os.environ.get('QR_HMAC_SECRET', 'change-me-in-production')
#
#     try:
#         user_id = int(get_jwt_identity())
#         application = Application.query.get_or_404(application_id)
#
#         # 1. Ownership check
#         if application.user_id != user_id:
#             return jsonify({'error': 'Forbidden'}), 403
#
#         # 2. Eligibility checks
#         if application.status != ApplicationStatus.APPROVED:
#             return jsonify({'error': 'Application is not approved'}), 400
#         if application.permit_expiry and application.permit_expiry < datetime.utcnow().date():
#             return jsonify({'error': 'Permit has expired'}), 400
#
#         # 3. Revoke any existing active QR for this application
#         existing = QRCode.query.filter_by(
#             entity_id=str(application_id),
#             status=QRStatus.ACTIVE
#         ).first()
#         if existing:
#             existing.status = QRStatus.REVOKED
#             existing.revoked_at = datetime.utcnow()
#
#         # 4. Mint new token
#         raw_token = str(uuid.uuid4())
#         token_hash = hmac.new(
#             QR_HMAC_SECRET.encode(),
#             raw_token.encode(),
#             hashlib.sha256
#         ).hexdigest()
#
#         now = datetime.utcnow()
#         expires_at = now.replace(hour=23, minute=59, second=59, microsecond=0)
#
#         # Sequential QR ID (simplified – use a proper sequence in production)
#         count = QRCode.query.count()
#         qr_id = f'QR-{now.year}-{count + 1:06d}'
#
#         # 5. Persist QRCode (hash only – raw_token is NOT stored)
#         qr = QRCode(
#             qr_id=qr_id,
#             token_hash=token_hash,
#             purpose='checkpoint_entry',
#             entity_type='vehicle_application',
#             entity_id=str(application_id),
#             user_id=str(user_id),
#             vehicle_id=str(application.vehicle_id),
#             status=QRStatus.ACTIVE,
#             created_at=now,
#             expires_at=expires_at,
#             created_by='portal_user',
#             generation_channel=request.headers.get('X-Channel', 'web_portal')
#         )
#         db.session.add(qr)
#
#         # 6. Audit trail
#         audit_count = QRIssueAudit.query.count()
#         audit = QRIssueAudit(
#             audit_id=f'AUD-{now.year}-{audit_count + 1:06d}',
#             qr_id=qr_id,
#             action='generate_success',
#             actor_id=str(user_id),
#             actor_role='driver',
#             request_ip=request.remote_addr,
#             event_time=now,
#             result='success',
#             reason_code='ELIGIBLE_APPROVED'
#         )
#         db.session.add(audit)
#         db.session.commit()
#
#         # 7. Return raw token to frontend (encode into QR image client-side)
#         return jsonify({
#             'qr_id': qr_id,
#             'raw_token': raw_token,   # frontend uses this to render the QR
#             'expires_at': expires_at.isoformat()
#         }), 201
#
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({'error': str(e)}), 500
#
# ────────────────────────────────────────────────────────────────────────────────

# @application_bp.route('', methods=['POST'])
# @jwt_required()
# def create_application():
#     """
#     Create a new application
    
#     POST /api/v1/applications
#     Body: {"vehicle_id": 1}
#     """
#     try:
#         user_id = int(get_jwt_identity())
#         data = request.get_json()
        
#         if not data or 'vehicle_id' not in data:
#             return jsonify({'error': 'vehicle_id is required'}), 400
        
#         application, error = ApplicationService.create_application(
#             user_id, data['vehicle_id']
#         )
        
#         if error:
#             return jsonify({'error': error}), 400
        
#         return jsonify({
#             'message': 'Application created successfully',
#             'application': application.to_dict()
#         }), 201
        
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500
@application_bp.route('', methods=['POST'])
@jwt_required()
def create_application():
    """
    Create a new application, creating the vehicle first if vehicle data is provided.
    POST /api/v1/applications
    Body: {
        "plate_no": "SGX1234A",
        "make": "Toyota",
        "model": "Camry",
        "year": 2020,
        "vin": "1HGBH41JXMN109186",
        "insurance_expiry": "2025-12-31"
    }
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required_vehicle_fields = ['plate_no', 'make', 'model', 'year', 'vin', 'insurance_expiry']
        missing = [f for f in required_vehicle_fields if f not in data]
        if missing:
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400

        vehicle, application, error = ApplicationService.create_vehicle_and_application(user_id, data)
        if error:
            return jsonify({'error': error}), 400

        return jsonify({
            'message': 'Vehicle and application created successfully',
            'vehicle': vehicle.to_dict(),
            'application': application.to_dict()
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@application_bp.route('', methods=['GET'])
@jwt_required()
def get_user_applications():
    """
    Get all applications for current user
    
    GET /api/v1/applications?status=APPROVED
    """
    try:
        user_id = int(get_jwt_identity())
        status = request.args.get('status')
        
        applications = ApplicationService.get_user_applications(user_id, status)
        
        return jsonify({
            'applications': [a.to_dict() for a in applications],
            'count': len(applications)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@application_bp.route('/<int:application_id>', methods=['GET'])
@jwt_required()
def get_application(application_id):
    """
    Get specific application
    
    GET /api/v1/applications/{application_id}
    """
    try:
        user_id = int(get_jwt_identity())
        application, error = ApplicationService.get_application_by_id(application_id, user_id)
        
        if error:
            return jsonify({'error': error}), 404 if 'not found' in error else 403
        
        return jsonify({'application': application.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@application_bp.route('/<int:application_id>/submit', methods=['POST'])
@jwt_required()
def submit_application(application_id):
    """
    Submit application for review
    
    POST /api/v1/applications/{application_id}/submit
    """
    try:
        user_id = int(get_jwt_identity())
        application, error = ApplicationService.submit_application(application_id, user_id)
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify({
            'message': 'Application submitted successfully',
            'application': application.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@application_bp.route('/<int:application_id>/review', methods=['POST'])
@jwt_required()
def review_application(application_id):
    """
    Review application (officer only)
    
    POST /api/v1/applications/{application_id}/review
    Body: {"approved": true, "decision_reason": "Approved"}
    """
    try:
        officer_id = int(get_jwt_identity())
        officer = User.query.get(officer_id)
        
        if officer.role != UserRole.OFFICER:
            return jsonify({'error': 'Unauthorized. Officer access required'}), 403
        
        data = request.get_json()
        if not data or 'approved' not in data:
            return jsonify({'error': 'approved field is required'}), 400
        
        application, error = ApplicationService.review_application(
            application_id,
            officer_id,
            data['approved'],
            data.get('decision_reason')
        )
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify({
            'message': 'Application reviewed successfully',
            'application': application.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@application_bp.route('/<int:application_id>', methods=['DELETE'])
@jwt_required()
def delete_application(application_id):
    """
    Delete application
    
    DELETE /api/v1/applications/{application_id}
    """
    try:
        user_id = int(get_jwt_identity())
        success, error = ApplicationService.delete_application(application_id, user_id)
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify({'message': 'Application deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@application_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_applications():
    """
    Get all applications (officer only)
    
    GET /api/v1/applications/all?status=PENDING_REVIEW&page=1&per_page=20
    """
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if user.role != UserRole.OFFICER:
            return jsonify({'error': 'Unauthorized. Officer access required'}), 403
        
        status = request.args.get('status')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        result = ApplicationService.get_all_applications(status, page, per_page)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500