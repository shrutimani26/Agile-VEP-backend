from app.services.notification_service import NotificationService
from app.api.v1 import notification_bp
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request, jsonify, make_response

@notification_bp.route('', methods=['GET'])
@jwt_required()
def get_user_notifications():
    """
    Get notifications for current user
    
    GET /api/v1/notifications?unread_only=true&limit=50
    """
    try:
        user_id = int(get_jwt_identity())
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        limit = request.args.get('limit', 50, type=int)
        
        notifications = NotificationService.get_user_notifications(user_id, unread_only, limit)
        
        return jsonify({
            'notifications': [n.to_dict() for n in notifications],
            'count': len(notifications)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@notification_bp.route('/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    """
    Mark notification as read
    
    POST /api/v1/notifications/{notification_id}/read
    """
    try:
        user_id = int(get_jwt_identity())
        notification, error = NotificationService.mark_as_read(notification_id, user_id)
        
        if error:
            return jsonify({'error': error}), 404 if 'not found' in error else 403
        
        return jsonify({
            'message': 'Notification marked as read',
            'notification': notification.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@notification_bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_read():
    """
    Mark all notifications as read
    
    POST /api/v1/notifications/read-all
    """
    try:
        user_id = int(get_jwt_identity())
        count, error = NotificationService.mark_all_as_read(user_id)
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify({
            'message': f'{count} notifications marked as read',
            'count': count
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@notification_bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """
    Delete a notification
    
    DELETE /api/v1/notifications/{notification_id}
    """
    try:
        user_id = int(get_jwt_identity())
        success, error = NotificationService.delete_notification(notification_id, user_id)
        
        if error:
            return jsonify({'error': error}), 404 if 'not found' in error else 403
        
        return jsonify({'message': 'Notification deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@notification_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """
    Get count of unread notifications
    
    GET /api/v1/notifications/unread-count
    """
    try:
        user_id = int(get_jwt_identity())
        count = NotificationService.get_unread_count(user_id)
        
        return jsonify({'unread_count': count}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500