import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserInquiries, getUserDocument } from '../utils/firebaseUtils';
import './Profile.css';

export default function Profile() {
  const { currentUser, updateUserProfile, userFullname } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    title: '',
    phoneNumber: '',
    receiveOffers: false
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [userData, setUserData] = useState(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(3);

  // Load user data on component mount and when currentUser changes
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Get complete user document from Firestore
        const userDoc = await getUserDocument(currentUser.uid);
        console.log("Retrieved user document:", userDoc);
        
        if (userDoc) {
          setUserData(userDoc);
          
          // Set initial profile data from fetched user document
          setProfileData({
            title: userDoc.title || '',
            phoneNumber: userDoc.phoneNumber || '',
            receiveOffers: userDoc.receiveOffers || false
          });
          
          console.log("Set profile data from user document:", {
            title: userDoc.title || '',
            phoneNumber: userDoc.phoneNumber || '',
            receiveOffers: userDoc.receiveOffers || false
          });
        } else {
          console.warn("No user document found in Firestore");
        }
        
        // Load user inquiries
        const userInquiries = await fetchUserInquiries(currentUser.uid);
        setInquiries(userInquiries);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData({
      ...profileData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Only update the allowed fields (not email or name)
      const updatedFields = {
        title: profileData.title,
        phoneNumber: profileData.phoneNumber,
        receiveOffers: profileData.receiveOffers
      };
      
      console.log("Updating profile with:", updatedFields);
      
      await updateUserProfile(updatedFields);
      
      // Update local user data to reflect changes
      if (userData) {
        setUserData({
          ...userData,
          ...updatedFields
        });
      }
      
      setUpdateSuccess(true);
      setShowUpdateForm(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
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

  // Function to format date for display
  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to get title display
  const getTitleDisplay = (title) => {
    if (!title) return 'Not specified';
    return title;
  };

  // Pagination logic for inquiries
  const indexOfLastInquiry = page * itemsPerPage;
  const indexOfFirstInquiry = indexOfLastInquiry - itemsPerPage;
  const currentInquiries = inquiries
    .filter(inquiry => inquiry.status !== 'finished')
    .slice(indexOfFirstInquiry, indexOfLastInquiry);
  
  const totalPages = Math.ceil(inquiries.filter(inquiry => inquiry.status !== 'finished').length / itemsPerPage);
  
  const paginate = (pageNumber) => setPage(pageNumber);

  if (!currentUser) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <h1>You must be logged in to view this page</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>My Account</h1>
        
        <div className="profile-tabs">
          <button 
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="fas fa-user"></i> Profile Details
          </button>
          <button 
            className={`tab-button ${activeTab === 'inquiries' ? 'active' : ''}`}
            onClick={() => setActiveTab('inquiries')}
          >
            <i className="fas fa-clipboard-list"></i> My Inquiries
          </button>
          <button 
            className={`tab-button ${activeTab === 'trips' ? 'active' : ''}`}
            onClick={() => setActiveTab('trips')}
          >
            <i className="fas fa-plane"></i> Past Trips
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'profile' && (
            <div className="profile-details">
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  {/* Current Profile Data Display */}
                  <div className="current-data">
                    <h3>Current Profile Information</h3>
                    <div className="current-data-item">
                      <strong>Full Name:</strong>
                      <span>{userFullname || `${userData?.firstName || ''} ${userData?.lastName || ''}`}</span>
                    </div>
                    <div className="current-data-item">
                      <strong>Email:</strong>
                      <span>{userData?.email || currentUser.email || 'Not specified'}</span>
                    </div>
                    <div className="current-data-item">
                      <strong>Title:</strong>
                      <span>{getTitleDisplay(userData?.title || profileData.title)}</span>
                    </div>
                    <div className="current-data-item">
                      <strong>Phone Number:</strong>
                      <span>{userData?.phoneNumber || profileData.phoneNumber || 'Not specified'}</span>
                    </div>
                    <div className="current-data-item">
                      <strong>Marketing Preferences:</strong>
                      <span>{(userData?.receiveOffers || profileData.receiveOffers) ? 'Subscribed to offers' : 'Not subscribed to offers'}</span>
                    </div>
                  </div>
                  
                  {updateSuccess && (
                    <div className="success-message">
                      Profile updated successfully!
                    </div>
                  )}
                  
                  {!showUpdateForm ? (
                    <button 
                      type="button" 
                      className="update-profile-button"
                      onClick={() => setShowUpdateForm(true)}
                    >
                      Update Profile
                    </button>
                  ) : (
                    <form onSubmit={handleProfileUpdate}>
                      <div className="form-group">
                        <label>Full Name</label>
                        <input 
                          type="text" 
                          value={userFullname || `${userData?.firstName || ''} ${userData?.lastName || ''}`}
                          disabled
                          className="disabled-input"
                        />
                        <small>Name cannot be changed. Please contact support for assistance.</small>
                      </div>
                      
                      <div className="form-group">
                        <label>Email</label>
                        <input 
                          type="email" 
                          value={userData?.email || currentUser.email || ''}
                          disabled
                          className="disabled-input"
                        />
                        <small>Email cannot be changed. Please contact support for assistance.</small>
                      </div>
                      
                      <div className="form-group">
                        <label>Title</label>
                        <select 
                          name="title"
                          value={profileData.title}
                          onChange={handleInputChange}
                        >
                          <option value="">Select a title</option>
                          <option value="Mr">Mr</option>
                          <option value="Mrs">Mrs</option>
                          <option value="Miss">Miss</option>
                          <option value="Ms">Ms</option>
                          <option value="Dr">Dr</option>
                          <option value="Prof">Prof</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input 
                          type="tel" 
                          name="phoneNumber"
                          value={profileData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      
                      <div className="form-group checkbox-group">
                        <input 
                          type="checkbox" 
                          id="receiveOffers"
                          name="receiveOffers"
                          checked={profileData.receiveOffers}
                          onChange={handleInputChange}
                        />
                        <label htmlFor="receiveOffers">
                          Receive offers and updates via email
                        </label>
                      </div>
                      
                      <div className="form-actions">
                        <button 
                          type="button" 
                          className="cancel-button"
                          onClick={() => setShowUpdateForm(false)}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="update-profile-button"
                          disabled={loading}
                        >
                          {loading ? 'Updating...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
          
          {activeTab === 'inquiries' && (
            <div className="user-inquiries">
              <h2>My Inquiries</h2>
              
              {loading ? (
                <div className="loading-spinner"></div>
              ) : inquiries.filter(inquiry => inquiry.status !== 'finished').length === 0 ? (
                <div className="no-data-message">
                  <p>You haven't submitted any inquiries yet.</p>
                </div>
              ) : (
                <>
                  <div className="inquiries-list">
                    {currentInquiries.map(inquiry => (
                      <div key={inquiry.id} className="inquiry-card">
                        <div className="inquiry-header">
                          <div className="inquiry-date">
                            <strong>Submitted:</strong> {formatDate(inquiry.createdAt)}
                          </div>
                          <div className={`status-badge ${getStatusBadgeClass(inquiry.status)}`}>
                            {formatStatus(inquiry.status)}
                          </div>
                        </div>
                        
                        <div className="inquiry-details">
                          <div className="inquiry-destinations">
                            <h3>Destinations</h3>
                            <ul>
                              {inquiry.packItems.map((item, index) => (
                                <li key={index}>{item.name}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="inquiry-dates">
                            <h3>Travel Dates</h3>
                            <p>
                              <strong>From:</strong> {formatDate(inquiry.bookingDetails.travelDates.startDate)}
                            </p>
                            <p>
                              <strong>To:</strong> {formatDate(inquiry.bookingDetails.travelDates.endDate)}
                            </p>
                          </div>
                          
                          <div className="inquiry-travelers">
                            <h3>Travelers</h3>
                            <p>{inquiry.bookingDetails.travelers.length} traveler(s)</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button 
                        onClick={() => paginate(page > 1 ? page - 1 : 1)}
                        disabled={page === 1}
                        className="pagination-button"
                      >
                        &laquo; Previous
                      </button>
                      
                      <span className="page-info">
                        Page {page} of {totalPages}
                      </span>
                      
                      <button 
                        onClick={() => paginate(page < totalPages ? page + 1 : totalPages)}
                        disabled={page === totalPages}
                        className="pagination-button"
                      >
                        Next &raquo;
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {activeTab === 'trips' && (
            <div className="past-trips">
              <h2>Past Trips</h2>
              
              {loading ? (
                <div className="loading-spinner"></div>
              ) : inquiries.filter(inquiry => inquiry.status === 'finished').length === 0 ? (
                <div className="no-data-message">
                  <p>You haven't completed any trips yet.</p>
                </div>
              ) : (
                <div className="inquiries-list past-trips-list">
                  {inquiries.filter(inquiry => inquiry.status === 'finished').map(inquiry => (
                    <div key={inquiry.id} className="inquiry-card trip-card">
                      <div className="inquiry-header">
                        <div className="inquiry-date">
                          <strong>Completed:</strong> {formatDate(inquiry.updatedAt || inquiry.createdAt)}
                        </div>
                        <div className={`status-badge ${getStatusBadgeClass(inquiry.status)}`}>
                          {formatStatus(inquiry.status)}
                        </div>
                      </div>
                      
                      <div className="inquiry-details">
                        <div className="inquiry-destinations">
                          <h3>Destinations</h3>
                          <ul>
                            {inquiry.packItems.map((item, index) => (
                              <li key={index}>{item.name}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="inquiry-dates">
                          <h3>Travel Dates</h3>
                          <p>
                            <strong>From:</strong> {formatDate(inquiry.bookingDetails.travelDates.startDate)}
                          </p>
                          <p>
                            <strong>To:</strong> {formatDate(inquiry.bookingDetails.travelDates.endDate)}
                          </p>
                        </div>
                        
                        <div className="inquiry-travelers">
                          <h3>Travelers</h3>
                          <p>{inquiry.bookingDetails.travelers.length} traveler(s)</p>
                        </div>
                        
                        {inquiry.tripNotes && (
                          <div className="trip-notes">
                            <h3>Trip Notes</h3>
                            <p>{inquiry.tripNotes}</p>
                          </div>
                        )}
                        
                        <div className="trip-actions">
                          <button className="trip-action-button">
                            <i className="fas fa-download"></i> Download Itinerary
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 