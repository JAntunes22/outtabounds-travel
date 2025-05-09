import React, { useState, useEffect } from 'react';
import { fetchAllInquiries, updateInquiryStatus } from '../../utils/firebaseUtils';
import './Admin.css';

export default function InquiriesList() {
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'descending'
  });
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadInquiries();
  }, []);

  useEffect(() => {
    let filtered = [...inquiries];
    
    // Filter based on status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inquiry => inquiry.status === statusFilter);
    }
    
    // Filter based on search term
    if (searchTerm.trim() !== '') {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(inquiry => 
        (inquiry.userEmail && inquiry.userEmail.toLowerCase().includes(lowercasedSearch)) ||
        (inquiry.bookingDetails?.travelers && 
         inquiry.bookingDetails.travelers.some(traveler => 
           (traveler.firstName && traveler.firstName.toLowerCase().includes(lowercasedSearch)) ||
           (traveler.lastName && traveler.lastName.toLowerCase().includes(lowercasedSearch))
         ))
      );
    }
    
    // Sort the filtered inquiries
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        // Handle null or undefined values
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Special case for createdAt which is a date
        if (sortConfig.key === 'createdAt') {
          aValue = aValue ? new Date(aValue) : new Date(0);
          bValue = bValue ? new Date(bValue) : new Date(0);
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredInquiries(filtered);
  }, [searchTerm, inquiries, sortConfig, statusFilter]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const inquiriesList = await fetchAllInquiries();
      setInquiries(inquiriesList);
    } catch (err) {
      console.error('Error loading inquiries:', err);
      setError('Failed to load inquiries. Please try again.');
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

  const handleStatusChange = (inquiry) => {
    setSelectedInquiry(inquiry);
    setShowStatusModal(true);
  };

  const closeModal = () => {
    setShowStatusModal(false);
    setSelectedInquiry(null);
  };

  const updateStatus = async (status) => {
    if (!selectedInquiry) return;
    
    try {
      setLoading(true);
      await updateInquiryStatus(selectedInquiry.id, status);
      closeModal();
      
      // Update inquiry in local state
      const updatedInquiries = inquiries.map(inquiry => {
        if (inquiry.id === selectedInquiry.id) {
          return {
            ...inquiry,
            status: status,
            updatedAt: new Date()
          };
        }
        return inquiry;
      });
      
      setInquiries(updatedInquiries);
    } catch (err) {
      console.error('Error updating inquiry status:', err);
      setError('Failed to update inquiry status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to format date for display
  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to get appropriate status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'proposed':
        return 'status-proposed';
      case 'accepted':
        return 'status-accepted';
      case 'finished':
        return 'status-finished';
      default:
        return 'status-new';
    }
  };

  // Function to format the status for display
  const formatStatus = (status) => {
    switch (status) {
      case 'proposed':
        return 'Proposed';
      case 'accepted':
        return 'Accepted';
      case 'finished':
        return 'Completed';
      default:
        return 'New';
    }
  };

  if (loading && inquiries.length === 0) {
    return (
      <div className="admin-page">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Inquiry Management</h1>
        <div className="admin-controls">
          <button className="refresh-btn" onClick={loadInquiries}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        <div className="filter-container">
          <label htmlFor="status-filter">Filter by status:</label>
          <select 
            id="status-filter" 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Inquiries</option>
            <option value="new">New</option>
            <option value="proposed">Proposed</option>
            <option value="accepted">Accepted</option>
            <option value="finished">Completed</option>
          </select>
        </div>
      </div>
      
      <div className="inquiry-count">
        {filteredInquiries.length} {filteredInquiries.length === 1 ? 'inquiry' : 'inquiries'}
        {searchTerm && ` found for "${searchTerm}"`}
        {statusFilter !== 'all' && ` with status "${formatStatus(statusFilter)}"`}
      </div>

      {filteredInquiries.length === 0 ? (
        <div className="no-data-message">
          <p>No inquiries found matching your criteria.</p>
        </div>
      ) : (
        <div className="inquiries-table-wrapper">
          <table className="inquiries-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('createdAt')}>
                  Date {getSortIndicator('createdAt')}
                </th>
                <th onClick={() => requestSort('userEmail')}>
                  Customer {getSortIndicator('userEmail')}
                </th>
                <th>Destinations</th>
                <th>Travel Dates</th>
                <th>Travelers</th>
                <th onClick={() => requestSort('status')}>
                  Status {getSortIndicator('status')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.map(inquiry => (
                <tr key={inquiry.id}>
                  <td>{formatDate(inquiry.createdAt)}</td>
                  <td>{inquiry.userEmail}</td>
                  <td>
                    <ul className="destinations-list">
                      {inquiry.packItems.map((item, index) => (
                        <li key={index}>{item.name}</li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    {inquiry.bookingDetails?.travelDates ? (
                      <>
                        <div>{formatDate(inquiry.bookingDetails.travelDates.startDate)}</div>
                        <div>to</div>
                        <div>{formatDate(inquiry.bookingDetails.travelDates.endDate)}</div>
                      </>
                    ) : (
                      'No dates specified'
                    )}
                  </td>
                  <td>{inquiry.bookingDetails?.travelers?.length || 0}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(inquiry.status)}`}>
                      {formatStatus(inquiry.status)}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="change-status-btn"
                      onClick={() => handleStatusChange(inquiry)}
                    >
                      Change Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedInquiry && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Update Inquiry Status</h2>
              <button className="close-modal" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Current Status:</strong>{' '}
                <span className={`status-badge ${getStatusBadgeClass(selectedInquiry.status)}`}>
                  {formatStatus(selectedInquiry.status)}
                </span>
              </p>
              <p>Select the new status for this inquiry:</p>
              
              <div className="status-buttons">
                <button 
                  className={`status-btn ${getStatusBadgeClass('new')}`}
                  onClick={() => updateStatus('new')}
                  disabled={selectedInquiry.status === 'new'}
                >
                  New
                </button>
                <button 
                  className={`status-btn ${getStatusBadgeClass('proposed')}`}
                  onClick={() => updateStatus('proposed')}
                  disabled={selectedInquiry.status === 'proposed'}
                >
                  Proposed
                </button>
                <button 
                  className={`status-btn ${getStatusBadgeClass('accepted')}`}
                  onClick={() => updateStatus('accepted')}
                  disabled={selectedInquiry.status === 'accepted'}
                >
                  Accepted
                </button>
                <button 
                  className={`status-btn ${getStatusBadgeClass('finished')}`}
                  onClick={() => updateStatus('finished')}
                  disabled={selectedInquiry.status === 'finished'}
                >
                  Completed
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 