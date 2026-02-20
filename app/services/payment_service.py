"""
Payment Service - Business logic for payment operations
"""
from app.extensions import db
from app.models import Payment, PaymentStatus, Application
from datetime import datetime
import uuid


class PaymentService:
    """Service class for payment CRUD operations"""
    
    @staticmethod
    def create_payment(application_id, user_id, amount, currency='SGD'):
        """
        Create a new payment for an application
        
        Args:
            application_id: ID of the application
            user_id: ID of the user (for ownership check)
            amount: Payment amount
            currency: Currency code (default SGD)
            
        Returns:
            tuple: (payment, error_message)
        """
        try:
            # Validate application exists and belongs to user
            application = Application.query.get(application_id)
            if not application:
                return None, "Application not found"
            
            if application.user_id != user_id:
                return None, "Unauthorized access to this application"
            
            # Check if payment already exists
            existing_payment = Payment.query.filter_by(
                application_id=application_id,
                status=PaymentStatus.PAID
            ).first()
            
            if existing_payment:
                return None, "Payment already exists for this application"
            
            # Validate amount
            if float(amount) <= 0:
                return None, "Payment amount must be greater than 0"
            
            # Create payment
            payment = Payment(
                application_id=application_id,
                amount=amount,
                currency=currency,
                status=PaymentStatus.PENDING
            )
            
            db.session.add(payment)
            db.session.commit()
            
            return payment, None
            
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def get_payment_by_id(payment_id, user_id=None):
        """
        Get payment by ID
        
        Args:
            payment_id: ID of the payment
            user_id: Optional - if provided, check ownership
            
        Returns:
            tuple: (payment, error_message)
        """
        payment = Payment.query.get(payment_id)
        
        if not payment:
            return None, "Payment not found"
        
        # Check ownership if user_id provided
        if user_id:
            application = Application.query.get(payment.application_id)
            if application and application.user_id != user_id:
                return None, "Unauthorized access to this payment"
        
        return payment, None
    
    @staticmethod
    def get_application_payments(application_id, user_id=None):
        """
        Get all payments for an application
        
        Args:
            application_id: ID of the application
            user_id: Optional - if provided, check ownership
            
        Returns:
            tuple: (payments, error_message)
        """
        # Validate application
        application = Application.query.get(application_id)
        if not application:
            return None, "Application not found"
        
        # Check ownership if user_id provided
        if user_id and application.user_id != user_id:
            return None, "Unauthorized access to this application"
        
        payments = Payment.query.filter_by(
            application_id=application_id
        ).order_by(Payment.created_at.desc()).all()
        
        return payments, None
    
    @staticmethod
    def get_user_payments(user_id):
        """
        Get all payments for a user
        
        Args:
            user_id: ID of the user
            
        Returns:
            list: List of payments
        """
        return db.session.query(Payment).join(Application).filter(
            Application.user_id == user_id
        ).order_by(Payment.created_at.desc()).all()
    
    @staticmethod
    def process_payment(payment_id, payment_method, transaction_id=None):
        """
        Process a payment (simulate payment gateway)
        
        Args:
            payment_id: ID of the payment
            payment_method: Payment method used
            transaction_id: Optional transaction ID from gateway
            
        Returns:
            tuple: (payment, error_message)
        """
        try:
            payment = Payment.query.get(payment_id)
            if not payment:
                return None, "Payment not found"
            
            if payment.status == PaymentStatus.PAID:
                return None, "Payment already processed"
            
            # Generate transaction ID if not provided
            if not transaction_id:
                transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
            
            # Update payment
            payment.status = PaymentStatus.PAID
            payment.payment_method = payment_method
            payment.transaction_id = transaction_id
            payment.updated_at = datetime.utcnow()
            
            # Update application payment status
            application = Application.query.get(payment.application_id)
            if application:
                application.payment_status = PaymentStatus.PAID
                application.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            # TODO: Send payment confirmation notification
            
            return payment, None
            
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def fail_payment(payment_id, reason):
        """
        Mark payment as failed
        
        Args:
            payment_id: ID of the payment
            reason: Reason for failure
            
        Returns:
            tuple: (payment, error_message)
        """
        try:
            payment = Payment.query.get(payment_id)
            if not payment:
                return None, "Payment not found"
            
            payment.status = PaymentStatus.FAILED
            payment.updated_at = datetime.utcnow()
            
            # Update application payment status
            application = Application.query.get(payment.application_id)
            if application:
                application.payment_status = PaymentStatus.FAILED
                application.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            return payment, None
            
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def get_all_payments(status=None, page=1, per_page=20):
        """
        Get all payments with pagination (admin use)
        
        Args:
            status: Optional - filter by status
            page: Page number
            per_page: Items per page
            
        Returns:
            dict: Paginated results
        """
        query = Payment.query
        
        if status:
            try:
                status_enum = PaymentStatus[status.upper()]
                query = query.filter_by(status=status_enum)
            except KeyError:
                pass
        
        pagination = query.order_by(Payment.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return {
            'payments': [p.to_dict() for p in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'pages': pagination.pages,
            'per_page': per_page
        }
    
    @staticmethod
    def get_payment_by_transaction_id(transaction_id):
        """
        Get payment by transaction ID
        
        Args:
            transaction_id: Transaction ID from payment gateway
            
        Returns:
            Payment or None
        """
        return Payment.query.filter_by(transaction_id=transaction_id).first()
