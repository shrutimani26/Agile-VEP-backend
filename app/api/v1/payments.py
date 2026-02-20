from app.services.payment_service import PaymentService
from app.api.v1 import payment_bp
from flask_jwt_extended import jwt_required, get_jwt_identity

@payment_bp.route('/application/<int:application_id>', methods=['POST'])
@jwt_required()
def create_payment(application_id):
    """
    Create payment for application
    
    POST /api/v1/payments/application/{application_id}
    Body: {"amount": 50.00, "currency": "SGD"}
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data or 'amount' not in data:
            return jsonify({'error': 'amount is required'}), 400
        
        payment, error = PaymentService.create_payment(
            application_id,
            user_id,
            data['amount'],
            data.get('currency', 'SGD')
        )
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify({
            'message': 'Payment created successfully',
            'payment': payment.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@payment_bp.route('/<int:payment_id>/process', methods=['POST'])
@jwt_required()
def process_payment(payment_id):
    """
    Process a payment
    
    POST /api/v1/payments/{payment_id}/process
    Body: {"payment_method": "credit_card", "transaction_id": "TXN123"}
    """
    try:
        data = request.get_json()
        
        if not data or 'payment_method' not in data:
            return jsonify({'error': 'payment_method is required'}), 400
        
        payment, error = PaymentService.process_payment(
            payment_id,
            data['payment_method'],
            data.get('transaction_id')
        )
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify({
            'message': 'Payment processed successfully',
            'payment': payment.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@payment_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user_payments():
    """
    Get all payments for current user
    
    GET /api/v1/payments/user
    """
    try:
        user_id = int(get_jwt_identity())
        payments = PaymentService.get_user_payments(user_id)
        
        return jsonify({
            'payments': [p.to_dict() for p in payments],
            'count': len(payments)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500