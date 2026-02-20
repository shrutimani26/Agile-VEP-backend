from flask import Flask, jsonify
from app.config import config_by_name
from app.extensions import db, migrate, bcrypt, jwt, cors

def create_app(config_name='development'):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config_by_name[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})
    
    from app.api.v1 import (
        auth_bp, 
        vehicle_bp, 
        application_bp, 
        document_bp,
        payment_bp,
        crossing_bp,
        notification_bp
    )
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(vehicle_bp)
    app.register_blueprint(application_bp)
    app.register_blueprint(document_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(crossing_bp)
    app.register_blueprint(notification_bp)
    
    # Health check endpoint
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'service': 'vehicle-passport-api'}, 200
    
    # Root endpoint
    @app.route('/')
    def index():
        return {
            'message': 'Vehicle Passport API',
            'version': '1.0.0',
            'endpoints': {
                'health': '/health',
                'auth': '/api/v1/auth'
            }
        }, 200
    
    return app

