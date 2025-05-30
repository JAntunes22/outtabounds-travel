import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocale } from '../../contexts/LocaleContext';
import { db } from '../../utils/firebaseConfig';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import './Admin.css';

export default function ExperienceList() {
  const { getLocalizedPath } = useLocale();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchExperiences();
  }, []);

  async function fetchExperiences() {
    setLoading(true);
    try {
      const experiencesCollection = collection(db, 'experiences');
      const snapshot = await getDocs(experiencesCollection);
      
      const experiencesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setExperiences(experiencesList);
    } catch (err) {
      console.error("Error fetching experiences:", err);
      setError("Failed to load experiences. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'experiences', id));
        // Remove from state
        setExperiences(experiences.filter(experience => experience.id !== id));
      } catch (error) {
        console.error("Error deleting experience:", error);
        alert("Failed to delete experience. Please try again.");
      }
    }
  }

  // Filter experiences based on search term
  const filteredExperiences = experiences.filter(experience => 
    experience.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (experience.category && experience.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (experience.location && experience.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Experiences</h1>
        <Link to={getLocalizedPath('/admin/experiences/new')} className="admin-action-btn">
          <span>+</span> Add New Experience
        </Link>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search experiences by name, category, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="user-count">
          {filteredExperiences.length} {filteredExperiences.length === 1 ? 'experience' : 'experiences'} found
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-spinner"></div>
      ) : (
        <div className="admin-table-container">
          {filteredExperiences.length === 0 ? (
            <div className="no-data">
              {searchTerm ? 'No experiences match your search.' : 'No experiences found. Add one to get started!'}
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Image</th>
                  <th>Category</th>
                  <th>Rating</th>
                  <th>Duration</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExperiences.map(experience => (
                  <tr key={experience.id}>
                    <td>{experience.name}</td>
                    <td>
                      {experience.url ? (
                        <img 
                          src={experience.url} 
                          alt={experience.name} 
                          style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/80x50?text=No+Image';
                          }}
                        />
                      ) : experience.imageUrl ? (
                        <img 
                          src={experience.imageUrl} 
                          alt={experience.name} 
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
                    <td>
                      <span className={`category-badge category-${experience.category?.toLowerCase().replace(/\s+/g, '-') || 'other'}`}>
                        {experience.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td>
                      {experience.rating ? (
                        <div className="admin-rating">
                          <span className="rating-value">{parseFloat(experience.rating).toFixed(1)}</span>
                          <span className="rating-stars">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < Math.round(parseFloat(experience.rating)) ? "admin-star filled" : "admin-star"}>
                                ★
                              </span>
                            ))}
                          </span>
                        </div>
                      ) : (
                        <span className="no-rating">Not rated</span>
                      )}
                    </td>
                    <td>{experience.duration || 'Not specified'}</td>
                    <td>{experience.location || 'Not specified'}</td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="action-btn edit" 
                          onClick={() => navigate(getLocalizedPath(`/admin/experiences/edit/${experience.id}`))}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn delete" 
                          onClick={() => handleDelete(experience.id, experience.name)}
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