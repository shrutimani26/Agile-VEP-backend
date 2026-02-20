"""
Notification Service - Business logic for notification operations
"""
from app.extensions import db
from app.models import Notification, User
from datetime import datetime


class NotificationService:
    """Service class for notification CRUD operations"""
    
    @staticmethod
    def create_notification(user_id, notification_type, title, body):
        """
        Create a new notification
        
        Args:
            user_id: ID of the user
            notification_type: Type of notification
            title: Notification title
            body: Notification body
            
        Returns:
            tuple: (notification, error_message)
        """
        try:
            # Validate user exists
            user = User.query.get(user_id)
            if not user:
                return None, "User not found"
            
            # Create notification
            notification = Notification(
                user_id=user_id,
                type=notification_type,
                title=title,
                body=body,
                is_read=False
            )
            
            db.session.add(notification)
            db.session.commit()
            
            return notification, None
            
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def get_notification_by_id(notification_id, user_id=None):
        """
        Get notification by ID
        
        Args:
            notification_id: ID of the notification
            user_id: Optional - if provided, check ownership
            
        Returns:
            tuple: (notification, error_message)
        """
        notification = Notification.query.get(notification_id)
        
        if not notification:
            return None, "Notification not found"
        
        # Check ownership if user_id provided
        if user_id and notification.user_id != user_id:
            return None, "Unauthorized access to this notification"
        
        return notification, None
    
    @staticmethod
    def get_user_notifications(user_id, unread_only=False, limit=50):
        """
        Get notifications for a user
        
        Args:
            user_id: ID of the user
            unread_only: If True, return only unread notifications
            limit: Maximum number of notifications to return
            
        Returns:
            list: List of notifications
        """
        query = Notification.query.filter_by(user_id=user_id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        return query.order_by(Notification.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def mark_as_read(notification_id, user_id):
        """
        Mark a notification as read
        
        Args:
            notification_id: ID of the notification
            user_id: ID of the user (for ownership check)
            
        Returns:
            tuple: (notification, error_message)
        """
        try:
            notification, error = NotificationService.get_notification_by_id(notification_id, user_id)
            if error:
                return None, error
            
            if not notification.is_read:
                notification.is_read = True
                db.session.commit()
            
            return notification, None
            
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def mark_all_as_read(user_id):
        """
        Mark all notifications as read for a user
        
        Args:
            user_id: ID of the user
            
        Returns:
            tuple: (count, error_message)
        """
        try:
            updated = Notification.query.filter_by(
                user_id=user_id,
                is_read=False
            ).update({'is_read': True})
            
            db.session.commit()
            
            return updated, None
            
        except Exception as e:
            db.session.rollback()
            return 0, str(e)
    
    @staticmethod
    def delete_notification(notification_id, user_id):
        """
        Delete a notification
        
        Args:
            notification_id: ID of the notification
            user_id: ID of the user (for ownership check)
            
        Returns:
            tuple: (success, error_message)
        """
        try:
            notification, error = NotificationService.get_notification_by_id(notification_id, user_id)
            if error:
                return False, error
            
            db.session.delete(notification)
            db.session.commit()
            
            return True, None
            
        except Exception as e:
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def get_unread_count(user_id):
        """
        Get count of unread notifications for a user
        
        Args:
            user_id: ID of the user
            
        Returns:
            int: Count of unread notifications
        """
        return Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).count()
    
    @staticmethod
    def send_application_notification(user_id, application_id, notification_type, status):
        """
        Helper to send application-related notifications
        
        Args:
            user_id: ID of the user
            application_id: ID of the application
            notification_type: Type of notification
            status: Application status
            
        Returns:
            tuple: (notification, error_message)
        """
        title_map = {
            'submitted': 'Application Submitted',
            'approved': 'Application Approved',
            'rejected': 'Application Rejected',
            'expired': 'Application Expired'
        }
        
        body_map = {
            'submitted': f'Your application #{application_id} has been submitted and is under review.',
            'approved': f'Congratulations! Your application #{application_id} has been approved.',
            'rejected': f'Your application #{application_id} has been rejected. Please check the application for details.',
            'expired': f'Your application #{application_id} has expired. Please submit a new application.'
        }
        
        title = title_map.get(status, 'Application Update')
        body = body_map.get(status, f'Your application #{application_id} has been updated.')
        
        return NotificationService.create_notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            body=body
        )
    
    @staticmethod
    def send_payment_notification(user_id, payment_id, status):
        """
        Helper to send payment-related notifications
        
        Args:
            user_id: ID of the user
            payment_id: ID of the payment
            status: Payment status
            
        Returns:
            tuple: (notification, error_message)
        """
        title_map = {
            'paid': 'Payment Successful',
            'failed': 'Payment Failed'
        }
        
        body_map = {
            'paid': f'Your payment has been successfully processed.',
            'failed': f'Your payment failed. Please try again.'
        }
        
        title = title_map.get(status, 'Payment Update')
        body = body_map.get(status, f'Your payment status has been updated.')
        
        return NotificationService.create_notification(
            user_id=user_id,
            notification_type=f'payment_{status}',
            title=title,
            body=body
        )
