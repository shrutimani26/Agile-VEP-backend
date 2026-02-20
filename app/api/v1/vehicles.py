from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.vehicle_service import VehicleService
from app.models import UserRole, User
from app.api.v1 import vehicle_bp
from flask_jwt_extended import jwt_required, get_jwt_identity

@vehicle_bp.route('', methods=['POST'])
@jwt_required()
def create_vehicle():
    """
    Create a new vehicle
    
    POST /api/v1/vehicles
    
    Body:
    {
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
        
        vehicle, error = VehicleService.create_vehicle(user_id, data)
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify({
            'message': 'Vehicle created successfully',
            'vehicle': vehicle.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@vehicle_bp.route('', methods=['GET'])
@jwt_required()
def get_user_vehicles():
    """
    Get all vehicles for the current user
    
    GET /api/v1/vehicles
    """
    try:
        user_id = int(get_jwt_identity())
        vehicles = VehicleService.get_user_vehicles(user_id)
        
        return jsonify({
            'vehicles': [v.to_dict() for v in vehicles],
            'count': len(vehicles)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@vehicle_bp.route('/<int:vehicle_id>', methods=['GET'])
@jwt_required()
def get_vehicle(vehicle_id):
    """
    Get a specific vehicle by ID
    
    GET /api/v1/vehicles/{vehicle_id}
    """
    try:
        user_id = int(get_jwt_identity())
        vehicle, error = VehicleService.get_vehicle_by_id(vehicle_id, user_id)
        
        if error:
            return jsonify({'error': error}), 404 if 'not found' in error else 403
        
        return jsonify({'vehicle': vehicle.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@vehicle_bp.route('/<int:vehicle_id>', methods=['PUT'])
@jwt_required()
def update_vehicle(vehicle_id):
    """
    Update a vehicle
    
    PUT /api/v1/vehicles/{vehicle_id}
    
    Body:
    {
        "make": "Toyota",
        "model": "Camry",
        "year": 2021,
        "insurance_expiry": "2026-12-31"
    }
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        vehicle, error = VehicleService.update_vehicle(vehicle_id, user_id, data)
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify({
            'message': 'Vehicle updated successfully',
            'vehicle': vehicle.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@vehicle_bp.route('/<int:vehicle_id>', methods=['DELETE'])
@jwt_required()
def delete_vehicle(vehicle_id):
    """
    Delete a vehicle
    
    DELETE /api/v1/vehicles/{vehicle_id}
    """
    try:
        user_id = int(get_jwt_identity())
        success, error = VehicleService.delete_vehicle(vehicle_id, user_id)
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify({'message': 'Vehicle deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@vehicle_bp.route('/search', methods=['GET'])
@jwt_required()
def search_vehicles():
    """
    Search vehicles
    
    GET /api/v1/vehicles/search?q=toyota
    """
    try:
        user_id = int(get_jwt_identity())
        query = request.args.get('q', '')
        
        if not query:
            return jsonify({'error': 'Search query required'}), 400
        
        vehicles = VehicleService.search_vehicles(query, user_id)
        
        return jsonify({
            'vehicles': [v.to_dict() for v in vehicles],
            'count': len(vehicles)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@vehicle_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_vehicles():
    """
    Get all vehicles (admin/officer only)
    
    GET /api/v1/vehicles/all?page=1&per_page=20
    """
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        # Check if user is officer
        if user.role != UserRole.OFFICER:
            return jsonify({'error': 'Unauthorized. Officer access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        result = VehicleService.get_all_vehicles(page, per_page)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500