import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { addAdminRole, removeAdminRole } from '../../utils/firebaseUtils';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import './Admin.css';

export default function AdminSettings() {
  const { currentUser, refreshAdminStatus, userFullname } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const emailRef = useRef();
  const [adminToRemove, setAdminToRemove] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setError(null);
      setLoading(true);
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddAdmin = async (email) => {
    try {
      setError(null);
      setSuccess(null);
      console.log("Adding admin role to:", email);
      
      const result = await addAdminRole(email);
      console.log("Admin role added result:", result);
      
      setSuccess(`Successfully added admin role to ${email}`);
      
      // Force refresh the current user's admin status as well
      try {
        await refreshAdminStatus();
      } catch (refreshError) {
        console.error("Error refreshing admin status:", refreshError);
      }
      
      await fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error adding admin role:', error);
      setError(error.message || 'Failed to add admin role');
    }
  };
  
  const handleRemoveAdmin = async (email) => {
    try {
      setError(null);
      setSuccess(null);
      console.log("Removing admin role from:", email);
      
      const result = await removeAdminRole(email);
      console.log("Admin role removed result:", result);
      
      setSuccess(`Successfully removed admin role from ${email}`);
      
      // Force refresh the current user's admin status as well
      try {
        await refreshAdminStatus();
      } catch (refreshError) {
        console.error("Error refreshing admin status:", refreshError);
      }
      
      await fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error removing admin role:', error);
      setError(error.message || 'Failed to remove admin role');
    }
  };
  
  function confirmRemoveAdmin(email) {
    setAdminToRemove(email);
    setShowModal(true);
  }
  
  async function handleRefreshAdminStatus() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const isAdmin = await refreshAdminStatus();
      if (isAdmin) {
        setSuccess('Admin status confirmed successfully!');
      } else {
        setError('You do not have admin privileges.');
      }
    } catch (error) {
      setError('Failed to refresh admin status: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Admin Settings</h1>
        <p>Welcome, {(userFullname || currentUser?.displayName || currentUser?.email).split(' ')[0]}</p>
      </div>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{success}</span>
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
                onClick={() => handleRemoveAdmin(adminToRemove)}
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