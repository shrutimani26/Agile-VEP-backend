"""
Document Service - Business logic for document operations
"""
from app.extensions import db
from app.models import DocumentMetadata, DocumentType, Application
from datetime import datetime
import os


class DocumentService:
    """Service class for document CRUD operations"""
    
    @staticmethod
    def create_document(application_id, user_id, file_data):
        """
        Create a new document metadata entry
        
        Args:
            application_id: ID of the application
            user_id: ID of the user (for ownership check)
            file_data: dict with file information (name, size, type, path)
            
        Returns:
            tuple: (document, error_message)
        """
        try:
            # Validate application exists and belongs to user
            application = Application.query.get(application_id)
            if not application:
                return None, "Application not found"
            
            if application.user_id != user_id:
                return None, "Unauthorized access to this application"
            
            # Validate required fields
            required_fields = ['name', 'size', 'type', 'file_path']
            for field in required_fields:
                if field not in file_data:
                    return None, f"Missing required field: {field}"
            
            # Validate document type
            try:
                doc_type = DocumentType[file_data['type'].upper()]
            except KeyError:
                valid_types = [t.value for t in DocumentType]
                return None, f"Invalid document type. Must be one of: {', '.join(valid_types)}"
            
            # Check if document type already exists for this application
            existing_doc = DocumentMetadata.query.filter_by(
                application_id=application_id,
                type=doc_type
            ).first()
            
            if existing_doc:
                return None, f"Document of type {doc_type.value} already exists for this application"
            
            # Create document metadata
            document = DocumentMetadata(
                application_id=application_id,
                type=doc_type,
                name=file_data['name'],
                size=int(file_data['size']),
                file_path=file_data['file_path']
            )
            
            db.session.add(document)
            db.session.commit()
            
            return document, None
            
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def get_document_by_id(document_id, user_id=None):
        """
        Get document by ID
        
        Args:
            document_id: ID of the document
            user_id: Optional - if provided, check ownership
            
        Returns:
            tuple: (document, error_message)
        """
        document = DocumentMetadata.query.get(document_id)
        
        if not document:
            return None, "Document not found"
        
        # Check ownership if user_id provided
        if user_id:
            application = Application.query.get(document.application_id)
            if application and application.user_id != user_id:
                return None, "Unauthorized access to this document"
        
        return document, None
    
    @staticmethod
    def get_application_documents(application_id, user_id=None):
        """
        Get all documents for an application
        
        Args:
            application_id: ID of the application
            user_id: Optional - if provided, check ownership
            
        Returns:
            tuple: (documents, error_message)
        """
        # Validate application
        application = Application.query.get(application_id)
        if not application:
            return None, "Application not found"
        
        # Check ownership if user_id provided
        if user_id and application.user_id != user_id:
            return None, "Unauthorized access to this application"
        
        documents = DocumentMetadata.query.filter_by(
            application_id=application_id
        ).all()
        
        return documents, None
    
    @staticmethod
    def update_document(document_id, user_id, data):
        """
        Update document metadata
        
        Args:
            document_id: ID of the document
            user_id: ID of the user (for ownership check)
            data: dict with fields to update
            
        Returns:
            tuple: (document, error_message)
        """
        try:
            document, error = DocumentService.get_document_by_id(document_id, user_id)
            if error:
                return None, error
            
            # Update allowed fields
            updatable_fields = ['name']
            
            for field in updatable_fields:
                if field in data:
                    setattr(document, field, data[field])
            
            db.session.commit()
            
            return document, None
            
        except Exception as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def delete_document(document_id, user_id):
        """
        Delete a document
        
        Args:
            document_id: ID of the document
            user_id: ID of the user (for ownership check)
            
        Returns:
            tuple: (success, error_message, file_path)
        """
        try:
            document, error = DocumentService.get_document_by_id(document_id, user_id)
            if error:
                return False, error, None
            
            application = Application.query.get(document.application_id)
            from app.models import ApplicationStatus
            if application.status != ApplicationStatus.SUBMITTED:
                return False, "Cannot delete documents from submitted applications", None
            
            file_path = document.file_path
            
            db.session.delete(document)
            db.session.commit()
            
            # Return file_path so caller can delete the actual file
            return True, None, file_path
            
        except Exception as e:
            db.session.rollback()
            return False, str(e), None
    
    @staticmethod
    def get_required_document_types():
        """
        Get list of required document types
        
        Returns:
            list: Document types
        """
        return [t.value for t in DocumentType]
    
    @staticmethod
    def check_application_documents_complete(application_id):
        """
        Check if application has all required documents
        
        Args:
            application_id: ID of the application
            
        Returns:
            tuple: (is_complete, missing_types)
        """
        documents = DocumentMetadata.query.filter_by(
            application_id=application_id
        ).all()
        
        uploaded_types = {doc.type for doc in documents}
        required_types = set(DocumentType)
        
        missing_types = required_types - uploaded_types
        
        is_complete = len(missing_types) == 0
        missing_type_values = [t.value for t in missing_types]
        
        return is_complete, missing_type_values
