"""
Crossing Service - Business logic for border crossing operations
"""
from app.extensions import db
from app.models import Crossing, CrossingDirection, CrossingResult, Application, ApplicationStatus, Vehicle, User
from datetime import datetime, timedelta


class CrossingService:
    """Service class for crossing CRUD operations"""
    
    @staticmethod
    def create_crossing(application_id, vehicle_id, user_id, direction, checkpoint, officer_id=None):
        """
        Record a new border crossing
        
        Args:
            application_id: ID of the application (permit)
            vehicle_id: ID of the vehicle
            user_id: ID of the user
            direction: ENTRY or EXIT
            checkpoint: Name of the checkpoint
            officer_id: Optional - ID of the officer processing
            
        Returns:
            tuple: (crossing, error_message)
        """
        try:
            # Validate application
            application = Application.query.get(application_id)
            if not application:
                return None, "Application not found"
            
            # Check if application is approved and not expired
            if application.status != ApplicationStatus.APPROVED:
                crossing = Crossing(
                    application_id=application_id,
                    vehicle_id=vehicle_id,
                    user_id=user_id,
                    direction=CrossingDirection[direction.upper()],
                    checkpoint=checkpoint,
                    result=CrossingResult.FAIL,
                    fail_reason="Application not approved"
                )
                db.session.add(crossing)
                db.session.commit()
                return crossing, "Application not approved"
            
            if application.expiry_date and application.expiry_date < datetime.utcnow().date():
                crossing = Crossing(
                    application_id=application_id,
                    vehicle_id=vehicle_id,
                    user_id=user_id,
                    direction=CrossingDirection[direction.upper()],
                    checkpoint=checkpoint,
                    result=CrossingResult.FAIL,
                    fail_reason="Application expired"
                )
                db.session.add(crossing)
                db.session.commit()
                return crossing, "Application expired"
            
            # Validate vehicle
            vehicle = Vehicle.query.get(vehicle_id)
            if not vehicle:
                return None, "Vehicle not found"
            
            if vehicle.is_blacklisted:
                crossing = Crossing(
                    application_id=application_id,
                    vehicle_id=vehicle_id,
                    user_id=user_id,
                    direction=CrossingDirection[direction.upper()],
                    checkpoint=checkpoint,
                    result=CrossingResult.FAIL,
                    fail_reason="Vehicle blacklisted"
                )
                db.session.add(crossing)
                db.session.commit()
                return crossing, "Vehicle blacklisted"

            if vehicle.id != application.vehicle_id:
                crossing = Crossing(
                    application_id=application_id,
                    vehicle_id=vehicle_id,
                    user_id=user_id,
                    direction=CrossingDirection[direction.upper()],
                    checkpoint=checkpoint,
                    result=CrossingResult.FAIL,
                    fail_reason="Vehicle does not match application"
                )
                db.session.add(crossing)
                db.session.commit()
                return crossing, "Vehicle does not match application"
            
            # Check insurance validity
            if vehicle.insurance_expiry < datetime.utcnow().date():
                crossing = Crossing(
                    application_id=application_id,
                    vehicle_id=vehicle_id,
                    user_id=user_id,
                    direction=CrossingDirection[direction.upper()],
                    checkpoint=checkpoint,
                    result=CrossingResult.FAIL,
                    fail_reason="Vehicle insurance expired"
                )
                db.session.add(crossing)
                db.session.commit()
                return crossing, "Vehicle insurance expired"
            
            # Validate direction
            try:
                direction_enum = CrossingDirection[direction.upper()]
            except KeyError:
                return None, f"Invalid direction. Must be ENTRY or EXIT"
            
            # Create successful crossing
            crossing = Crossing(
                application_id=application_id,
                vehicle_id=vehicle_id,
                user_id=user_id,
                direction=direction_enum,
                checkpoint=checkpoint,
                result=CrossingResult.SUCCESS
            )
            
            db.session.add(crossing)
            db.session.commit()
            
            return crossing, None
            
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def get_crossing_by_id(crossing_id):
        """
        Get crossing by ID
        
        Args:
            crossing_id: ID of the crossing
            
        Returns:
            tuple: (crossing, error_message)
        """
        crossing = Crossing.query.get(crossing_id)
        
        if not crossing:
            return None, "Crossing record not found"
        
        return crossing, None
    
    @staticmethod
    def get_user_crossings(user_id, days=30):
        """
        Get crossing history for a user
        
        Args:
            user_id: ID of the user
            days: Number of days to look back (default 30)
            
        Returns:
            list: List of crossings
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        return Crossing.query.filter_by(user_id=user_id).filter(
            Crossing.timestamp >= cutoff_date
        ).order_by(Crossing.timestamp.desc()).all()
    
    @staticmethod
    def get_vehicle_crossings(vehicle_id, days=30):
        """
        Get crossing history for a vehicle
        
        Args:
            vehicle_id: ID of the vehicle
            days: Number of days to look back (default 30)
            
        Returns:
            list: List of crossings
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        return Crossing.query.filter_by(vehicle_id=vehicle_id).filter(
            Crossing.timestamp >= cutoff_date
        ).order_by(Crossing.timestamp.desc()).all()
    
    @staticmethod
    def get_checkpoint_crossings(checkpoint, date=None):
        """
        Get crossings at a specific checkpoint
        
        Args:
            checkpoint: Name of the checkpoint
            date: Optional - specific date (default today)
            
        Returns:
            list: List of crossings
        """
        if not date:
            date = datetime.utcnow().date()
        
        start_of_day = datetime.combine(date, datetime.min.time())
        end_of_day = datetime.combine(date, datetime.max.time())
        
        return Crossing.query.filter_by(checkpoint=checkpoint).filter(
            Crossing.timestamp >= start_of_day,
            Crossing.timestamp <= end_of_day
        ).order_by(Crossing.timestamp.desc()).all()
    
    @staticmethod
    def get_all_crossings(result=None, page=1, per_page=50):
        """
        Get all crossings with pagination (admin/officer use)
        
        Args:
            result: Optional - filter by result (SUCCESS/FAIL)
            page: Page number
            per_page: Items per page
            
        Returns:
            dict: Paginated results
        """
        query = Crossing.query
        
        if result:
            try:
                result_enum = CrossingResult[result.upper()]
                query = query.filter_by(result=result_enum)
            except KeyError:
                pass
        
        pagination = query.order_by(Crossing.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return {
            'crossings': [c.to_dict() for c in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'pages': pagination.pages,
            'per_page': per_page
        }
    
    @staticmethod
    def get_crossing_stats(checkpoint=None, start_date=None, end_date=None):
        """
        Get crossing statistics
        
        Args:
            checkpoint: Optional - filter by checkpoint
            start_date: Optional - start date
            end_date: Optional - end date
            
        Returns:
            dict: Statistics
        """
        query = Crossing.query
        
        if checkpoint:
            query = query.filter_by(checkpoint=checkpoint)
        
        if start_date:
            query = query.filter(Crossing.timestamp >= start_date)
        
        if end_date:
            query = query.filter(Crossing.timestamp <= end_date)
        
        total_crossings = query.count()
        successful_crossings = query.filter_by(result=CrossingResult.SUCCESS).count()
        failed_crossings = query.filter_by(result=CrossingResult.FAIL).count()
        entry_crossings = query.filter_by(direction=CrossingDirection.ENTRY).count()
        exit_crossings = query.filter_by(direction=CrossingDirection.EXIT).count()
        
        return {
            'total': total_crossings,
            'successful': successful_crossings,
            'failed': failed_crossings,
            'entries': entry_crossings,
            'exits': exit_crossings,
            'success_rate': round((successful_crossings / total_crossings * 100) if total_crossings > 0 else 0, 2)
        }
