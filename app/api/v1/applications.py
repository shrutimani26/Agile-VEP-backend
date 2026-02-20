from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.application_service import ApplicationService
from app.models import UserRole, User
from app.api.v1 import application_bp

@application_bp.route('', methods=['POST'])
@jwt_required()
def create_application():
    """
    Create a new application
    
    POST /api/v1/applications
    Body: {"vehicle_id": 1}
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data or 'vehicle_id' not in data:
            return jsonify({'error': 'vehicle_id is required'}), 400
        
        application, error = ApplicationService.create_application(
            user_id, data['vehicle_id']
        )
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify({
            'message': 'Application created successfully',
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