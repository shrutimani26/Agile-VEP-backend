from app.services.document_service import DocumentService
from app.api.v1 import document_bp
from flask_jwt_extended import jwt_required, get_jwt_identity

@document_bp.route('/application/<int:application_id>', methods=['POST'])
@jwt_required()
def upload_document(application_id):
    """
    Upload document for application
    
    POST /api/v1/documents/application/{application_id}
    Body: {
        "name": "insurance.pdf",
        "size": 524288,
        "type": "INSURANCE",
        "file_path": "/uploads/insurance_123.pdf"
    }
    
    Note: Actual file upload handling should be done separately
    This endpoint just stores metadata
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        document, error = DocumentService.create_document(application_id, user_id, data)
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify({
            'message': 'Document uploaded successfully',
            'document': document.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@document_bp.route('/application/<int:application_id>', methods=['GET'])
@jwt_required()
def get_application_documents(application_id):
    """
    Get all documents for an application
    
    GET /api/v1/documents/application/{application_id}
    """
    try:
        user_id = int(get_jwt_identity())
        documents, error = DocumentService.get_application_documents(application_id, user_id)
        
        if error:
            return jsonify({'error': error}), 404 if 'not found' in error else 403
        
        return jsonify({
            'documents': [d.to_dict() for d in documents],
            'count': len(documents)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@document_bp.route('/<int:document_id>', methods=['DELETE'])
@jwt_required()
def delete_document(document_id):
    """
    Delete a document
    
    DELETE /api/v1/documents/{document_id}
    """
    try:
        user_id = int(get_jwt_identity())
        success, error, file_path = DocumentService.delete_document(document_id, user_id)
        
        if error:
            return jsonify({'error': error}), 400
        
        # TODO: Delete actual file at file_path
        
        return jsonify({'message': 'Document deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@document_bp.route('/types', methods=['GET'])
def get_document_types():
    """
    Get required document types
    
    GET /api/v1/documents/types
    """
    try:
        types = DocumentService.get_required_document_types()
        return jsonify({'types': types}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500