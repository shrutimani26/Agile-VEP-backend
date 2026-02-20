from app.services.crossing_service import CrossingService
from app.api.v1 import crossing_bp
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request, jsonify, make_response
from app.models import User, UserRole

@crossing_bp.route('', methods=['POST'])
@jwt_required()
def create_crossing():
    """
    Record a border crossing (officer use)
    
    POST /api/v1/crossings
    Body: {
        "application_id": 1,
        "vehicle_id": 1,
        "user_id": 1,
        "direction": "ENTRY",
        "checkpoint": "Woodlands"
    }
    """
    try:
        officer_id = int(get_jwt_identity())
        officer = User.query.get(officer_id)
        
        if officer.role != UserRole.OFFICER:
            return jsonify({'error': 'Unauthorized. Officer access required'}), 403
        
        data = request.get_json()
        
        required_fields = ['application_id', 'vehicle_id', 'user_id', 'direction', 'checkpoint']
        if not all(field in data for field in required_fields):
            return jsonify({'error': f'Missing required fields: {", ".join(required_fields)}'}), 400
        
        crossing, error = CrossingService.create_crossing(
            data['application_id'],
            data['vehicle_id'],
            data['user_id'],
            data['direction'],
            data['checkpoint'],
            officer_id
        )
        
        if error:
            # Crossing was created but failed validation
            return jsonify({
                'message': error,
                'crossing': crossing.to_dict() if crossing else None,
                'success': False
            }), 200
        
        return jsonify({
            'message': 'Crossing recorded successfully',
            'crossing': crossing.to_dict(),
            'success': True
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@crossing_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user_crossings():
    """
    Get crossing history for current user
    
    GET /api/v1/crossings/user?days=30
    """
    try:
        user_id = int(get_jwt_identity())
        days = request.args.get('days', 30, type=int)
        
        crossings = CrossingService.get_user_crossings(user_id, days)
        
        return jsonify({
            'crossings': [c.to_dict() for c in crossings],
            'count': len(crossings)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@crossing_bp.route('/vehicle/<int:vehicle_id>', methods=['GET'])
@jwt_required()
def get_vehicle_crossings(vehicle_id):
    """
    Get crossing history for a vehicle
    
    GET /api/v1/crossings/vehicle/{vehicle_id}?days=30
    """
    try:
        days = request.args.get('days', 30, type=int)
        crossings = CrossingService.get_vehicle_crossings(vehicle_id, days)
        
        return jsonify({
            'crossings': [c.to_dict() for c in crossings],
            'count': len(crossings)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@crossing_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_crossing_stats():
    """
    Get crossing statistics (officer only)
    
    GET /api/v1/crossings/stats?checkpoint=Woodlands
    """
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if user.role != UserRole.OFFICER:
            return jsonify({'error': 'Unauthorized. Officer access required'}), 403
        
        checkpoint = request.args.get('checkpoint')
        stats = CrossingService.get_crossing_stats(checkpoint=checkpoint)
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500