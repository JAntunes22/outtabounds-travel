import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../utils/firebaseConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc
} from 'firebase/firestore';
import './Admin.css';

export default function ExperienceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    duration: '',
    location: '',
    position: '',
    inclusions: [],
    exclusions: [],
    highlights: [],
    features: [],
    rating: '',
    category: 'Activity'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fetchExperience = useCallback(async () => {
    setLoading(true);
    try {
      const experienceDoc = await getDoc(doc(db, 'experiences', id));
      
      if (experienceDoc.exists()) {
        const experienceData = experienceDoc.data();
        
        // Initialize form data with existing values
        setFormData({
          ...experienceData
        });
      } else {
        setError('Experience not found');
      }
    } catch (error) {
      console.error("Error fetching experience:", error);
      setError('Error fetching experience data');
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    // If editing, fetch the experience data
    if (isEditing) {
      fetchExperience();
    }
  }, [isEditing, fetchExperience]);
  
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  }
  
  function handleArrayChange(e, field) {
    const value = e.target.value;
    
    // Split the comma-separated string into an array
    const itemsArray = value.split(',')
      .map(item => item.trim())
      .filter(item => item !== '');
    
    setFormData({
      ...formData,
      [field]: itemsArray
    });
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate required fields
      if (!formData.name) {
        throw new Error('Experience name is required');
      }
      
      // Prepare data for Firestore
      const experienceData = {
        ...formData,
        updatedAt: new Date()
      };
      
      if (!isEditing) {
        // Add created timestamp for new experiences
        experienceData.createdAt = new Date();
      }
      
      // Add or update the experience
      if (isEditing) {
        // Update existing experience
        await updateDoc(doc(db, 'experiences', id), experienceData);
      } else {
        // Add new experience
        await addDoc(collection(db, 'experiences'), experienceData);
      }
      
      // Navigate back to experiences list
      navigate('/admin/experiences');
    } catch (error) {
      console.error("Error saving experience:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">{isEditing ? 'Edit Experience' : 'Add New Experience'}</h1>
      </div>
      
      <div className="admin-form-container">
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Name *</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              placeholder="e.g., Wine Tasting Tour"
            />
          </div>
          
          <div className="admin-form-group">
            <label>Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows="4"
              placeholder="Describe the experience, what guests can expect, etc."
            />
          </div>
          
          <div className="admin-form-group">
            <label>Image URL</label>
            <input 
              type="url" 
              name="url" 
              value={formData.url} 
              onChange={handleChange} 
              placeholder="https://example.com/image.jpg" 
            />
            {formData.url && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={formData.url} 
                  alt="Experience Preview" 
                  style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'cover', borderRadius: '4px' }} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/200x100?text=Invalid+Image+URL';
                  }}
                />
              </div>
            )}
          </div>
          
          <div className="admin-form-group">
            <label>Category</label>
            <select 
              name="category" 
              value={formData.category} 
              onChange={handleChange}
            >
              <option value="Activity">Activity</option>
              <option value="Tour">Tour</option>
              <option value="Adventure">Adventure</option>
              <option value="Cultural">Cultural</option>
              <option value="Food & Drink">Food & Drink</option>
              <option value="Wellness">Wellness</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="admin-form-group">
            <label>Duration</label>
            <input 
              type="text" 
              name="duration" 
              value={formData.duration} 
              onChange={handleChange} 
              placeholder="e.g., 2 hours, Half-day, Full-day" 
            />
          </div>
          
          <div className="admin-form-group">
            <label>Location</label>
            <input 
              type="text" 
              name="location" 
              value={formData.location} 
              onChange={handleChange} 
              placeholder="e.g., Napa Valley, Downtown Las Vegas" 
            />
          </div>
          
          <div className="admin-form-group">
            <label>Position (latitude,longitude)</label>
            <input 
              type="text" 
              name="position" 
              value={formData.position} 
              onChange={handleChange} 
              placeholder="e.g., 37.7749,-122.4194" 
            />
            <p className="help-text">
              Enter the position as latitude,longitude (comma-separated) for map placement
            </p>
          </div>
          
          <div className="admin-form-group">
            <label>Rating (1.0 - 5.0)</label>
            <input 
              type="number" 
              name="rating" 
              value={formData.rating} 
              onChange={handleChange}
              min="1.0"
              max="5.0"
              step="0.1"
              placeholder="e.g., 4.5" 
            />
            <p className="help-text">
              Enter a rating between 1.0 and 5.0 (displayed as stars on the experience card)
            </p>
          </div>
          
          <div className="admin-form-group">
            <label>Features (comma-separated)</label>
            <textarea 
              name="features" 
              value={formData.features.join(', ')} 
              onChange={(e) => handleArrayChange(e, 'features')} 
              rows="3"
              placeholder="e.g., Professional guides, Equipment rental, Food included" 
            />
            <p className="help-text">
              Enter key features of the experience, separated by commas
            </p>
          </div>
          
          <div className="admin-form-group">
            <label>Highlights (comma-separated)</label>
            <textarea 
              name="highlights" 
              value={formData.highlights.join(', ')} 
              onChange={(e) => handleArrayChange(e, 'highlights')} 
              rows="3"
              placeholder="e.g., Exclusive vineyard access, Premium wine selection, Expert sommelier guide" 
            />
            <p className="help-text">
              Enter key highlights of the experience, separated by commas
            </p>
          </div>
          
          <div className="admin-form-group">
            <label>Inclusions (comma-separated)</label>
            <textarea 
              name="inclusions" 
              value={formData.inclusions.join(', ')} 
              onChange={(e) => handleArrayChange(e, 'inclusions')} 
              rows="3"
              placeholder="e.g., Transportation, Entrance fees, Lunch" 
            />
            <p className="help-text">
              Enter what's included in the experience, separated by commas
            </p>
          </div>
          
          <div className="admin-form-group">
            <label>Exclusions (comma-separated)</label>
            <textarea 
              name="exclusions" 
              value={formData.exclusions.join(', ')} 
              onChange={(e) => handleArrayChange(e, 'exclusions')} 
              rows="3"
              placeholder="e.g., Gratuities, Personal expenses, Additional activities" 
            />
            <p className="help-text">
              Enter what's not included in the experience, separated by commas
            </p>
          </div>
          
          <div className="admin-form-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={() => navigate('/admin/experiences')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-btn"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Experience' : 'Create Experience')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 