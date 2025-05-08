import React, { useState, useEffect } from 'react';
import { fetchAllUsers, deleteUser, updateUser } from '../../utils/firebaseUtils';
import './Admin.css';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: 'fullname',
    direction: 'ascending'
  });
  const [formData, setFormData] = useState({
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    receiveOffers: false,
    isAdmin: false
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let sortedFilteredUsers = [...users];
    
    // Filter based on search term
    if (searchTerm.trim() !== '') {
      const lowercasedSearch = searchTerm.toLowerCase();
      sortedFilteredUsers = sortedFilteredUsers.filter(user => 
        (user.fullname && user.fullname.toLowerCase().includes(lowercasedSearch)) ||
        (user.email && user.email.toLowerCase().includes(lowercasedSearch)) ||
        (user.phoneNumber && user.phoneNumber.includes(searchTerm))
      );
    }
    
    // Sort the filtered users
    if (sortConfig.key) {
      sortedFilteredUsers.sort((a, b) => {
        // Handle null or undefined values
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredUsers(sortedFilteredUsers);
  }, [searchTerm, users, sortConfig]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userList = await fetchAllUsers();
      setUsers(userList);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (columnName) => {
    if (sortConfig.key !== columnName) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      title: user.title || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || user.id,
      phoneNumber: user.phoneNumber || '',
      receiveOffers: user.receiveOffers || false,
      isAdmin: user.isAdmin || false
    });
    setShowEditModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      const updatedUser = {
        ...selectedUser,
        title: formData.title,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        receiveOffers: formData.receiveOffers,
        isAdmin: formData.isAdmin,
        fullname: `${formData.firstName} ${formData.lastName}`
      };
      
      await updateUser(updatedUser);
      setShowEditModal(false);
      loadUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      await deleteUser(selectedUser.id);
      setShowDeleteModal(false);
      loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  // New function to export users as CSV
  const exportUsersToCSV = () => {
    // Define fields to include in the CSV
    const fields = ['fullname', 'email', 'phoneNumber', 'isAdmin', 'title', 'receiveOffers'];
    
    // Create CSV header row
    const header = ['Name', 'Email', 'Phone Number', 'Admin Status', 'Title', 'Marketing Opt-in'].join(',');
    
    // Create CSV rows from user data
    const csvRows = filteredUsers.map(user => {
      return fields.map(field => {
        // Format special fields
        if (field === 'isAdmin') {
          return user[field] ? 'Yes' : 'No';
        }
        if (field === 'receiveOffers') {
          return user[field] ? 'Yes' : 'No';
        }
        // Handle missing values
        return user[field] ? `"${user[field]}"` : '""';
      }).join(',');
    });
    
    // Combine header and rows
    const csvContent = [header, ...csvRows].join('\n');
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && users.length === 0) {
    return (
      <div className="admin-page">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>User Management</h1>
        <div className="admin-controls">
          <button className="export-btn" onClick={exportUsersToCSV}>
            Export CSV
          </button>
          <button className="refresh-btn" onClick={loadUsers}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-container">
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <div className="user-count">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          {searchTerm && ` found for "${searchTerm}"`}
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('fullname')} className="sortable-header">
                Name {getSortIndicator('fullname')}
              </th>
              <th onClick={() => requestSort('email')} className="sortable-header">
                Email {getSortIndicator('email')}
              </th>
              <th onClick={() => requestSort('phoneNumber')} className="sortable-header">
                Phone {getSortIndicator('phoneNumber')}
              </th>
              <th onClick={() => requestSort('isAdmin')} className="sortable-header">
                Admin Status {getSortIndicator('isAdmin')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  {loading ? 'Loading users...' : searchTerm ? 'No users match your search' : 'No users found'}
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.fullname || 'Not specified'}</td>
                  <td>{user.email || user.id}</td>
                  <td>{user.phoneNumber || 'Not specified'}</td>
                  <td>
                    <span className={`status ${user.isAdmin ? 'active' : 'inactive'}`}>
                      {user.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(user)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(user)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit User</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <select
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                />
                <small>Email cannot be changed</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="receiveOffers"
                    checked={formData.receiveOffers}
                    onChange={handleChange}
                  />
                  Receive Marketing Emails
                </label>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isAdmin"
                    checked={formData.isAdmin}
                    onChange={handleChange}
                  />
                  Admin Status
                </label>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              <p>
                Are you sure you want to delete user <strong>{selectedUser?.fullname || selectedUser?.email || selectedUser?.id}</strong>?
              </p>
              <p className="warning">
                This action will permanently delete the user from both the Firestore database and Firebase Authentication.
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={closeModal}>
                Cancel
              </button>
              <button 
                type="button"
                className="delete-btn"
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 