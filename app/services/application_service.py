"""
Application Service - Business logic for permit application operations
"""
from app.extensions import db
from app.models import Application, ApplicationStatus, Vehicle, User, PaymentStatus
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta


class ApplicationService:
    """Service class for application CRUD operations"""
    
    @staticmethod
    def create_vehicle_and_application(user_id, vehicle_data):
        try:
            user = User.query.get(user_id)
            if not user:
                return None, None, "User not found"

            vehicle = Vehicle(
                user_id=user_id,
                plate_no=vehicle_data["plate_no"],
                make=vehicle_data["make"],
                model=vehicle_data["model"],
                year=vehicle_data["year"],
                vin=vehicle_data["vin"],
                insurance_expiry=vehicle_data["insurance_expiry"]
            )
            db.session.add(vehicle)
            db.session.flush()  # assigns vehicle.id without committing

            application = Application(
                user_id=user_id,
                vehicle_id=vehicle.id,
                status=ApplicationStatus.SUBMITTED,
                payment_status=PaymentStatus.PENDING
            )
            db.session.add(application)
            db.session.commit()

            return vehicle, application, None

        except Exception as e:
            db.session.rollback()
            return None, None, str(e)
    
    @staticmethod
    def get_application_by_id(application_id, user_id=None):
        """
        Get application by ID
        
        Args:
            application_id: ID of the application
            user_id: Optional - if provided, check ownership
            
        Returns:
            tuple: (application, error_message)
        """
        application = Application.query.get(application_id)
        
        if not application:
            return None, "Application not found"
        
        # Check ownership if user_id provided
        if user_id and application.user_id != user_id:
            return None, "Unauthorized access to this application"
        
        return application, None
    
    @staticmethod
    def get_user_applications(user_id, status=None):
        """
        Get all applications for a user
        
        Args:
            user_id: ID of the user
            status: Optional - filter by status
            
        Returns:
            list: List of applications
        """
        query = Application.query.filter_by(user_id=user_id)
        
        if status:
            try:
                status_enum = ApplicationStatus[status.upper()]
                query = query.filter_by(status=status_enum)
            except KeyError:
                pass
        
        return query.order_by(Application.created_at.desc()).all()
    
    @staticmethod
    def get_all_applications(status=None, page=1, per_page=20):
        """
        Get all applications with pagination (admin/officer use)
        
        Args:
            status: Optional - filter by status
            page: Page number
            per_page: Items per page
            
        Returns:
            dict: Paginated results
        """
        query = Application.query
        
        if status:
            try:
                status_enum = ApplicationStatus[status.upper()]
                query = query.filter_by(status=status_enum)
            except KeyError:
                pass
        
        pagination = query.order_by(Application.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return {
            'applications': [a.to_dict() for a in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'pages': pagination.pages,
            'per_page': per_page
        }
    
    @staticmethod
    def submit_application(application_id, user_id):
        """
        Submit application for review
        
        Args:
            application_id: ID of the application
            user_id: ID of the user (for ownership check)
            
        Returns:
            tuple: (application, error_message)
        """
        try:
            application, error = ApplicationService.get_application_by_id(application_id, user_id)
            if error:
                return None, error
            
            # # Check if application can be submitted
            if application.status != ApplicationStatus.SUBMITTED:
                return None, f"Cannot submit application with status: {application.status.value}"
            
            # Check if there are documents
            # if len(application.documents) == 0:
            #     return None, "Cannot submit application without documents"
            
            # Update status
            application.status = ApplicationStatus.SUBMITTED
            application.submitted_at = datetime.utcnow()
            
            db.session.commit()
            
            # TODO: Send notification to user
            
            return application, None
            
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def review_application(application_id, officer_id, approved, decision_reason=None):
        """
        Review application (officer only)
        
        Args:
            application_id: ID of the application
            officer_id: ID of the officer reviewing
            approved: Boolean - approve or reject
            decision_reason: Optional reason for decision
            
        Returns:
            tuple: (application, error_message)
        """
        try:
            application = Application.query.get(application_id)
            if not application:
                return None, "Application not found"
            
            # Check if application can be reviewed
            if application.status not in [ApplicationStatus.SUBMITTED, ApplicationStatus.PENDING_REVIEW]:
                return None, f"Cannot review application with status: {application.status.value}"
            
            # Validate officer
            officer = User.query.get(officer_id)
            if not officer or officer.role.value != 'OFFICER':
                return None, "Only officers can review applications"
            
            # Update application
            if approved:
                application.status = ApplicationStatus.APPROVED
                # Set expiry date (e.g., 1 year from now)
                application.expiry_date = (datetime.utcnow() + timedelta(days=365)).date()
            else:
                application.status = ApplicationStatus.REJECTED
            
            application.reviewed_at = datetime.utcnow()
            application.decision_reason = decision_reason
            
            db.session.commit()
            
            # TODO: Send notification to user
            
            return application, None
            
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def update_application_status(application_id, status):
        """
        Update application status (admin use)
        
        Args:
            application_id: ID of the application
            status: New status
            
        Returns:
            tuple: (application, error_message)
        """
        try:
            application = Application.query.get(application_id)
            if not application:
                return None, "Application not found"
            
            # Validate status
            try:
                status_enum = ApplicationStatus[status.upper()]
            except KeyError:
                valid_statuses = [s.value for s in ApplicationStatus]
                return None, f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            
            application.status = status_enum
            application.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            return application, None
            
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def delete_application(application_id, user_id):
        """
        Delete an application (only if DRAFT or REJECTED)
        
        Args:
            application_id: ID of the application
            user_id: ID of the user (for ownership check)
            
        Returns:
            tuple: (success, error_message)
        """
        try:
            application, error = ApplicationService.get_application_by_id(application_id, user_id)
            if error:
                return False, error
            
            if application.status not in [ApplicationStatus.SUBMITTED, ApplicationStatus.REJECTED]:
                return False, f"Cannot delete application with status: {application.status.value}"
            
            db.session.delete(application)
            db.session.commit()
            
            return True, None
            
        except Exception as e:
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def get_pending_applications():
        """
        Get applications pending review (officer use)
        
        Returns:
            list: Applications pending review
        """
        return Application.query.filter_by(
            status=ApplicationStatus.PENDING_REVIEW
        ).order_by(Application.submitted_at.asc()).all()
