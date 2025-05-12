import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../utils/firebaseConfig';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import './Admin.css';

export default function AccommodationList() {
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAccommodations();
  }, []);

  async function fetchAccommodations() {
    setLoading(true);
    try {
      const accommodationsCollection = collection(db, 'accommodations');
      const snapshot = await getDocs(accommodationsCollection);
      
      const accommodationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAccommodations(accommodationsList);
    } catch (err) {
      console.error("Error fetching accommodations:", err);
      setError("Failed to load accommodations. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'accommodations', id));
        // Remove from state
        setAccommodations(accommodations.filter(accommodation => accommodation.id !== id));
      } catch (error) {
        console.error("Error deleting accommodation:", error);
        alert("Failed to delete accommodation. Please try again.");
      }
    }
  }

  // Filter accommodations based on search term
  const filteredAccommodations = accommodations.filter(accommodation => 
    accommodation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (accommodation.location && accommodation.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Accommodations</h1>
        <Link to="/admin/accommodations/new" className="admin-action-btn">
          + Add Accommodation
        </Link>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search accommodations by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="user-count">
          {filteredAccommodations.length} {filteredAccommodations.length === 1 ? 'accommodation' : 'accommodations'} found
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-spinner"></div>
      ) : (
        <div className="admin-table-container">
          {filteredAccommodations.length === 0 ? (
            <div className="no-data">
              {searchTerm ? 'No accommodations match your search.' : 'No accommodations found. Add one to get started!'}
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Image</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccommodations.map(accommodation => (
                  <tr key={accommodation.id}>
                    <td>{accommodation.name}</td>
                    <td>
                      {accommodation.imageUrl ? (
                        <img 
                          src={accommodation.imageUrl} 
                          alt={accommodation.name} 
                          style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/80x50?text=No+Image';
                          }}
                        />
                      ) : (
                        <span>No image</span>
                      )}
                    </td>
                    <td>{accommodation.address || 'Not specified'}</td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="action-btn edit" 
                          onClick={() => navigate(`/admin/accommodations/edit/${accommodation.id}`)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn delete" 
                          onClick={() => handleDelete(accommodation.id, accommodation.name)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
} 