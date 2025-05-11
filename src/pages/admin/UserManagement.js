import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cleanupEmailDocuments, deleteEmailDocument } from '../../utils/adminUtils';
import './Admin.css';

export default function UserManagement() {
  const { currentUser, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [emailToDelete, setEmailToDelete] = useState('');
  const [deleteResult, setDeleteResult] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Check if user is admin
  if (!currentUser || !isAdmin) {
    return (
      <div className="admin-container">
        <h2>Access Denied</h2>
        <p>You must be an admin to access this page.</p>
      </div>
    );
  }

  const handleCleanup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResults(null);

      const cleanupResults = await cleanupEmailDocuments();
      setResults(cleanupResults);
    } catch (error) {
      console.error("Error during cleanup:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmailDocument = async (e) => {
    e.preventDefault();
    if (!emailToDelete || !emailToDelete.includes('@')) {
      setDeleteError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      setDeleteError(null);
      setDeleteResult(null);

      const result = await deleteEmailDocument(emailToDelete);
      setDeleteResult(result);
      setEmailToDelete('');
    } catch (error) {
      console.error("Error deleting document:", error);
      setDeleteError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <h2>User Database Management</h2>
      
      <div className="admin-section">
        <h3>Clean Up Email-Based Documents</h3>
        <p>
          This will scan the database for documents created with email as the document ID, 
          and migrate any data to the proper UID-based documents. After migration, the 
          email-based documents will be deleted.
        </p>
        <button 
          onClick={handleCleanup} 
          disabled={isLoading}
          className="admin-button"
        >
          {isLoading ? 'Processing...' : 'Run Cleanup'}
        </button>

        {error && (
          <div className="admin-error">
            <h4>Error</h4>
            <p>{error}</p>
          </div>
        )}

        {results && (
          <div className="admin-results">
            <h4>Results</h4>
            <p>Processed: {results.processed} users</p>
            <p>Cleaned: {results.cleaned} documents</p>
            <p>Errors: {results.errors}</p>
            
            <h5>Details:</h5>
            <ul className="admin-details-list">
              {results.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="admin-section">
        <h3>Delete Single Email Document</h3>
        <p>
          Use this to manually delete a document that uses an email address as its ID.
          Be careful as this operation cannot be undone.
        </p>
        
        <form onSubmit={handleDeleteEmailDocument} className="admin-form">
          <div className="form-group">
            <label htmlFor="emailToDelete">Email Document ID:</label>
            <input 
              type="email" 
              id="emailToDelete"
              value={emailToDelete}
              onChange={(e) => setEmailToDelete(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="admin-button admin-button-danger"
          >
            {isLoading ? 'Processing...' : 'Delete Document'}
          </button>
        </form>

        {deleteError && (
          <div className="admin-error">
            <p>{deleteError}</p>
          </div>
        )}

        {deleteResult && (
          <div className="admin-success">
            <p>{deleteResult.message}</p>
          </div>
        )}
      </div>
    </div>
  );
} 