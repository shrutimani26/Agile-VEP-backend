from flask_jwt_extended import create_access_token, create_refresh_token, decode_token
from app.extensions import db
from app.models import User, RefreshToken
from datetime import datetime, timedelta
import secrets

class TokenProvider:
    """Token management service - equivalent to .NET TokenProvider"""
    
    def __init__(self, access_token_expires_minutes=60, refresh_token_expires_days=7):
        self.access_token_expires = timedelta(minutes=access_token_expires_minutes)
        self.refresh_token_expires = timedelta(days=refresh_token_expires_days)
    
    def create_access_token(self, user):
        """Create JWT access token (equivalent to _tokenService.Create(user))"""
        return create_access_token(identity=str(user.id))
    
    def create_refresh_token_async(self, user):
        """Create refresh token and store in database (equivalent to CreateRefreshTokenAsync)"""
        # Generate unique refresh token
        token_string = secrets.token_urlsafe(64)
        expires_at = datetime.utcnow() + self.refresh_token_expires
        
        # Store in database
        refresh_token = RefreshToken(
            user_id=user.id,
            token=token_string,
            expires_at=expires_at
        )
        
        db.session.add(refresh_token)
        db.session.commit()
        
        return {
            'token': token_string,
            'expires_at': expires_at
        }
    
    def update_refresh_token_async(self, old_refresh_token):
        """Update refresh token (equivalent to UpdateRefreshTokenAsync)"""
        # Find the old refresh token
        token_record = RefreshToken.query.filter_by(
            token=old_refresh_token,
            is_revoked=False
        ).first()
        
        if not token_record:
            raise ValueError("Refresh token not found or has been revoked.")
        
        if token_record.expires_at < datetime.utcnow():
            raise ValueError("Refresh token has expired.")
        
        # Get user
        user = User.query.get(token_record.user_id)
        if not user:
            raise ValueError("User not found.")
        
        # Revoke old token
        token_record.is_revoked = True
        
        # Create new tokens
        access_token = self.create_access_token(user)
        
        # Create new refresh token
        new_token_string = secrets.token_urlsafe(64)
        new_expires_at = datetime.utcnow() + self.refresh_token_expires
        
        new_refresh_token = RefreshToken(
            user_id=user.id,
            token=new_token_string,
            expires_at=new_expires_at
        )
        
        db.session.add(new_refresh_token)
        db.session.commit()
        
        return {
            'access_token': access_token,
            'refresh_token': new_token_string,
            'expires_at': new_expires_at
        }
    
    def revoke_user_refresh_tokens_async(self, user_id):
        """Revoke all refresh tokens for a user (equivalent to RevokeUserRefreshTokensAsync)"""
        RefreshToken.query.filter_by(user_id=user_id, is_revoked=False).update(
            {'is_revoked': True}
        )
        db.session.commit()
    
    def validate_refresh_token(self, token):
        """Validate refresh token"""
        token_record = RefreshToken.query.filter_by(
            token=token,
            is_revoked=False
        ).first()
        
        if not token_record:
            return False
        
        if token_record.expires_at < datetime.utcnow():
            return False
        
        return True
