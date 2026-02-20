from flask import request, jsonify, make_response
from app.api.v1 import auth_bp
from app.extensions import db, bcrypt
from app.models import User, RefreshToken, UserRole
from app.services import TokenProvider
from flask_jwt_extended import jwt_required, get_jwt_identity

# Initialize token provider
token_provider = TokenProvider(access_token_expires_minutes=60, refresh_token_expires_days=7)


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    
    POST /api/v1/auth/register
    
    Example Postman Body (raw JSON):
    {
        "email": "user@example.com",
        "password": "securepass123",
        "full_name": "John Doe",
        "phone_number": "+6591234567",
        "nric_passport": "S1234567A",
        "role": "DRIVER"
    }
    
    Required: email, password, full_name, phone_number, nric_passport
    Optional: role (defaults to DRIVER)
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields (updated to include phone and nric as required)
        required_fields = ['email', 'password', 'full_name', 'phone_number', 'nric_passport']
        if not all(k in data for k in required_fields):
            return jsonify({
                'error': f'Missing required fields: {", ".join(required_fields)}'
            }), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        full_name = data['full_name'].strip()
        phone_number = data['phone_number'].strip()
        nric_passport = data['nric_passport'].strip().upper()
        
        # Validate role if provided
        role = UserRole.DRIVER  # Default role
        if 'role' in data:
            try:
                role = UserRole[data['role'].upper()]
            except KeyError:
                return jsonify({'error': f'Invalid role. Must be one of: {", ".join([r.value for r in UserRole])}'}), 400
        
        # Validate inputs
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Invalid email format'}), 400
        if len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        if not phone_number:
            return jsonify({'error': 'Phone number is required'}), 400
        if not nric_passport:
            return jsonify({'error': 'NRIC/Passport is required'}), 400
        
        # Check if email exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 409
        
        # Check if NRIC/Passport exists
        if User.query.filter_by(nric_passport=nric_passport).first():
            return jsonify({'error': 'NRIC/Passport already registered'}), 409
        
        # Create new user
        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            phone_number=phone_number,
            nric_passport=nric_passport,
            role=role
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'Registration successful',
            'user': new_user.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Registration failed',
            'details': str(e)
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user and receive access token + refresh token cookie
    
    POST /api/v1/auth/login
    
    Example Postman Body (raw JSON):
    {
        "email": "user@example.com",
        "password": "securepass123"
    }
    
    Response includes:
    - token: JWT access token (use in Authorization header for /me requests)
    - user: User profile object
    - refreshToken: HTTP-only cookie (auto-set by server)
    
    Required: email, password
    """
    data = request.get_json()
    
    if not data or not all(k in data for k in ['email', 'password']):
        return jsonify({'error': 'Missing email or password'}), 400
    
    email = data['email'].strip().lower()
    password = data['password']
    
    # Find user by email
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Check password
    if not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is disabled'}), 403
    
    # Create access token
    access_token = token_provider.create_access_token(user)
    
    # Create and store refresh token
    refresh_token_data = token_provider.create_refresh_token_async(user)
    
    # Create response with access token
    response = make_response(jsonify({
        'message': 'Login successful',
        'token': access_token,
        'user': user.to_dict()
    }), 200)
    
    # Set refresh token cookie (HTTP-only, secure, strict SameSite)
    response.set_cookie(
        'refreshToken',
        refresh_token_data['token'],
        httponly=True,
        secure=False,  # Set to True in production (HTTPS)
        samesite='Strict',
        expires=refresh_token_data['expires_at']
    )
    
    return response


@auth_bp.route('/refresh-token', methods=['POST'])
def refresh_token():
    """
    Refresh access token using refresh token from cookie
    
    POST /api/v1/auth/refresh-token
    
    Example Postman:
    - No body needed
    - Refresh token is automatically sent in cookies
    - Response includes new 'token' (access token)
    
    Note: Postman will auto-manage cookies if you have 'Send cookies with requests' enabled
    """
    try:
        # Get refresh token from cookie
        old_refresh_token = request.cookies.get('refreshToken')
        
        if not old_refresh_token:
            return jsonify({'error': 'Refresh token is missing'}), 401
        
        # Update refresh token and get new access token
        token_data = token_provider.update_refresh_token_async(old_refresh_token)
        
        # Create response
        response = make_response(jsonify({
            'message': 'Token refreshed successfully',
            'token': token_data['access_token']
        }), 200)
        
        # Set new refresh token cookie
        response.set_cookie(
            'refreshToken',
            token_data['refresh_token'],
            httponly=True,
            secure=False,  # Set to True in production
            samesite='Strict',
            expires=token_data['expires_at']
        )
        
        return response
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        return jsonify({'error': 'Token refresh failed', 'details': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current user profile
    
    GET /api/v1/auth/me
    
    Headers needed:
    Authorization: Bearer <token>
    
    Example in Postman:
    - Copy the 'token' from login response
    - Go to Authorization tab
    - Type: Bearer Token
    - Token: <paste_token_here>
    
    No body needed
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout user - revoke all refresh tokens
    
    POST /api/v1/auth/logout
    
    Headers needed:
    Authorization: Bearer <token>
    
    Example Postman:
    - Set Authorization: Bearer Token (same as /me)
    - No body needed
    - Refresh token cookie will be deleted
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Revoke all refresh tokens for user
        token_provider.revoke_user_refresh_tokens_async(user.id)
        
        # Create response
        response = make_response(jsonify({
            'message': 'Logged out successfully'
        }), 200)
        
        # Delete refresh token cookie
        response.delete_cookie('refreshToken')
        
        return response
    
    except Exception as e:
        return jsonify({'error': 'Logout failed', 'details': str(e)}), 500