"""
Vehicle Service - Business logic for vehicle operations
"""
from app.extensions import db
from app.models import Vehicle, User
from sqlalchemy.exc import IntegrityError
from datetime import datetime, date


class VehicleService:
    """Service class for vehicle CRUD operations"""
    
    @staticmethod
    def create_vehicle(user_id, data):
        """
        Create a new vehicle
        
        Args:
            user_id: ID of the user who owns the vehicle
            data: dict with vehicle information
            
        Returns:
            tuple: (vehicle, error_message)
        """
        try:
            # Validate user exists
            user = User.query.get(user_id)
            if not user:
                return None, "User not found"
            
            # Validate required fields
            required_fields = ['plate_no', 'make', 'model', 'year', 'vin', 'insurance_expiry']
            for field in required_fields:
                if field not in data or not data[field]:
                    return None, f"Missing required field: {field}"
            
            # Parse insurance expiry date
            try:
                if isinstance(data['insurance_expiry'], str):
                    insurance_expiry = datetime.strptime(data['insurance_expiry'], '%Y-%m-%d').date()
                else:
                    insurance_expiry = data['insurance_expiry']
            except ValueError:
                return None, "Invalid date format for insurance_expiry. Use YYYY-MM-DD"
            
            # Validate insurance is not expired
            if insurance_expiry < date.today():
                return None, "Insurance expiry date cannot be in the past"
            
            # Create vehicle
            vehicle = Vehicle(
                user_id=user_id,
                plate_no=data['plate_no'].strip().upper(),
                make=data['make'].strip(),
                model=data['model'].strip(),
                year=int(data['year']),
                vin=data['vin'].strip().upper(),
                insurance_expiry=insurance_expiry
            )
            
            db.session.add(vehicle)
            db.session.commit()
            
            return vehicle, None
            
        except IntegrityError as e:
            db.session.rollback()
            if 'plate_no' in str(e.orig):
                return None, "Vehicle with this plate number already exists"
            elif 'vin' in str(e.orig):
                return None, "Vehicle with this VIN already exists"
            return None, "Database integrity error"
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def get_vehicle_by_id(vehicle_id, user_id=None):
        """
        Get vehicle by ID
        
        Args:
            vehicle_id: ID of the vehicle
            user_id: Optional - if provided, check ownership
            
        Returns:
            tuple: (vehicle, error_message)
        """
        vehicle = Vehicle.query.get(vehicle_id)
        
        if not vehicle:
            return None, "Vehicle not found"
        
        # Check ownership if user_id provided
        if user_id and vehicle.user_id != user_id:
            return None, "Unauthorized access to this vehicle"
        
        return vehicle, None
    
    @staticmethod
    def get_user_vehicles(user_id):
        """
        Get all vehicles for a user
        
        Args:
            user_id: ID of the user
            
        Returns:
            list: List of vehicles
        """
        return Vehicle.query.filter_by(user_id=user_id).all()
    
    @staticmethod
    def get_all_vehicles(page=1, per_page=20):
        """
        Get all vehicles with pagination (admin/officer use)
        
        Args:
            page: Page number
            per_page: Items per page
            
        Returns:
            dict: Paginated results
        """
        pagination = Vehicle.query.paginate(page=page, per_page=per_page, error_out=False)
        
        return {
            'vehicles': [v.to_dict() for v in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'pages': pagination.pages,
            'per_page': per_page
        }
    
    @staticmethod
    def update_vehicle(vehicle_id, user_id, data):
        """
        Update vehicle information
        
        Args:
            vehicle_id: ID of the vehicle
            user_id: ID of the user (for ownership check)
            data: dict with fields to update
            
        Returns:
            tuple: (vehicle, error_message)
        """
        try:
            vehicle, error = VehicleService.get_vehicle_by_id(vehicle_id, user_id)
            if error:
                return None, error
            
            # Update allowed fields
            updatable_fields = ['make', 'model', 'year', 'insurance_expiry']
            
            for field in updatable_fields:
                if field in data:
                    if field == 'insurance_expiry':
                        try:
                            if isinstance(data[field], str):
                                value = datetime.strptime(data[field], '%Y-%m-%d').date()
                            else:
                                value = data[field]
                            
                            if value < date.today():
                                return None, "Insurance expiry date cannot be in the past"
                            
                            setattr(vehicle, field, value)
                        except ValueError:
                            return None, "Invalid date format for insurance_expiry. Use YYYY-MM-DD"
                    else:
                        setattr(vehicle, field, data[field])
            
            vehicle.updated_at = datetime.utcnow()
            db.session.commit()
            
            return vehicle, None
            
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def delete_vehicle(vehicle_id, user_id):
        """
        Delete a vehicle
        
        Args:
            vehicle_id: ID of the vehicle
            user_id: ID of the user (for ownership check)
            
        Returns:
            tuple: (success, error_message)
        """
        try:
            vehicle, error = VehicleService.get_vehicle_by_id(vehicle_id, user_id)
            if error:
                return False, error
            
            # Check if vehicle has active applications
            from app.models import Application, ApplicationStatus
            active_applications = Application.query.filter_by(
                vehicle_id=vehicle_id
            ).filter(
                Application.status.in_([
                    ApplicationStatus.SUBMITTED,
                    ApplicationStatus.PENDING_REVIEW,
                    ApplicationStatus.APPROVED
                ])
            ).first()
            
            if active_applications:
                return False, "Cannot delete vehicle with active applications"
            
            db.session.delete(vehicle)
            db.session.commit()
            
            return True, None
            
        except Exception as e:
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def search_vehicles(query, user_id=None):
        """
        Search vehicles by plate number, make, or model
        
        Args:
            query: Search query string
            user_id: Optional - filter by user
            
        Returns:
            list: Matching vehicles
        """
        search = f"%{query}%"
        vehicle_query = Vehicle.query.filter(
            db.or_(
                Vehicle.plate_no.ilike(search),
                Vehicle.make.ilike(search),
                Vehicle.model.ilike(search),
                Vehicle.vin.ilike(search)
            )
        )
        
        if user_id:
            vehicle_query = vehicle_query.filter_by(user_id=user_id)
        
        return vehicle_query.all()
