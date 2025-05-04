import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { addAdminRole, removeAdminRole } from '../../utils/firebaseUtils';
import './Admin.css';

export default function AdminSettings() {
  const { currentUser, refreshAdminStatus, userFullname } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const emailRef = useRef();
  const [adminToRemove, setAdminToRemove] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    // Force refresh admin status when component mounts
    const checkAdmin = async () => {
      await refreshAdminStatus();
    };
    
    checkAdmin();
  }, [refreshAdminStatus]);
  
  async function handleAddAdmin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const email = emailRef.current.value;
      
      if (!email) {
        throw new Error('Email is required');
      }
      
      const result = await addAdminRole(email);
      setMessage({
        text: result.message || `Success! ${email} has been made an admin.`,
        type: 'success'
      });
      
      // Clear the form
      emailRef.current.value = '';
    } catch (error) {
      setMessage({
        text: error.message || 'Failed to add admin role',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }
  
  function confirmRemoveAdmin(email) {
    setAdminToRemove(email);
    setShowModal(true);
  }
  
  async function handleRemoveAdmin() {
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const result = await removeAdminRole(adminToRemove);
      setMessage({
        text: result.message || `Admin privileges removed from ${adminToRemove}.`,
        type: 'success'
      });
      
      setShowModal(false);
      setAdminToRemove('');
    } catch (error) {
      setMessage({
        text: error.message || 'Failed to remove admin role',
        type: 'error'
      });
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleRefreshAdminStatus() {
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const isAdmin = await refreshAdminStatus();
      setMessage({
        text: isAdmin 
          ? 'Admin status confirmed successfully!' 
          : 'You do not have admin privileges.',
        type: isAdmin ? 'success' : 'error'
      });
    } catch (error) {
      setMessage({
        text: 'Failed to refresh admin status',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Admin Settings</h1>
        <p>Welcome, {(userFullname || currentUser?.displayName || currentUser?.email).split(' ')[0]}</p>
      </div>
      
      {message.text && (
        <div className={`auth-${message.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '20px' }}>
          {message.text}
        </div>
      )}
      
      <div className="admin-settings-container">
        <div className="admin-section">
          <h2>User Management</h2>
          
          {/* Admin user form */}
          <div className="admin-form-container">
            <h3>Add Admin User</h3>
            <p>Grant admin privileges to an existing user. The user must already have an account.</p>
            
            <form onSubmit={handleAddAdmin}>
              <div className="admin-form-group">
                <label>User Email</label>
                <input
                  type="email"
                  ref={emailRef}
                  placeholder="email@example.com"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="admin-action-btn"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Add Admin'}
              </button>
            </form>
          </div>
          
          <div className="admin-form-container" style={{ marginTop: '20px' }}>
            <h3>Remove Admin User</h3>
            <p>Remove admin privileges from a user. You cannot remove your own admin privileges.</p>
            
            <div className="admin-form-group">
              <label>Your Admin Email</label>
              <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
                {currentUser?.email}
                <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                  You cannot remove your own admin privileges.
                </small>
              </div>
            </div>
            
            <div className="admin-form-group">
              <button
                type="button"
                className="admin-action-btn"
                onClick={() => confirmRemoveAdmin(prompt('Enter the email of the admin to remove:'))}
              >
                Remove Another Admin
              </button>
            </div>
          </div>
        </div>
        
        <div className="admin-section">
          <h2>Session Management</h2>
          
          <div className="admin-form-container">
            <h3>Refresh Admin Status</h3>
            <p>If you've just been granted admin privileges or are having issues accessing admin features, you may need to refresh your admin status.</p>
            
            <button
              className="admin-action-btn"
              onClick={handleRefreshAdminStatus}
              disabled={loading}
            >
              Refresh Admin Status
            </button>
          </div>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h3>Confirm Admin Removal</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to remove admin privileges from <strong>{adminToRemove}</strong>?</p>
              <p>This action can be undone later if needed.</p>
            </div>
            <div className="modal-actions">
              <button 
                className="admin-action-btn cancel-btn" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="admin-action-btn" 
                style={{ backgroundColor: '#f44336' }}
                onClick={handleRemoveAdmin}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Remove Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 