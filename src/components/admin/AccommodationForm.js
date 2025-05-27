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

export default function AccommodationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    imageUrl: '',
    amenities: [],
    roomTypes: [],
    location: {
      latitude: '',
      longitude: ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fetchAccommodation = useCallback(async () => {
    setLoading(true);
    try {
      const accommodationDoc = await getDoc(doc(db, 'accommodations', id));
      
      if (accommodationDoc.exists()) {
        const accommodationData = accommodationDoc.data();
        
        // Initialize form data with existing values
        setFormData({
          name: accommodationData.name || '',
          description: accommodationData.description || '',
          address: accommodationData.address || '',
          imageUrl: accommodationData.imageUrl || '',
          amenities: accommodationData.amenities || [],
          roomTypes: accommodationData.roomTypes || [],
          location: accommodationData.location || {
            latitude: '',
            longitude: ''
          }
        });
      } else {
        setError('Accommodation not found');
      }
    } catch (error) {
      console.error("Error fetching accommodation:", error);
      setError('Error fetching accommodation data');
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    // If editing, fetch the accommodation data
    if (isEditing) {
      fetchAccommodation();
    }
  }, [isEditing, fetchAccommodation]);
  
  function handleChange(e) {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields (e.g., location.latitude)
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  }
  
  function handleAmenitiesChange(e) {
    const value = e.target.value;
    
    // Split the comma-separated string into an array
    const amenitiesArray = value.split(',')
      .map(item => item.trim())
      .filter(item => item !== '');
    
    setFormData({
      ...formData,
      amenities: amenitiesArray
    });
  }
  
  function handleRoomTypesChange(e) {
    const value = e.target.value;
    
    // Split the comma-separated string into an array
    const roomTypesArray = value.split(',')
      .map(item => item.trim())
      .filter(item => item !== '');
    
    setFormData({
      ...formData,
      roomTypes: roomTypesArray
    });
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate required fields
      if (!formData.name) {
        throw new Error('Accommodation name is required');
      }
      
      // Prepare data for Firestore
      const accommodationData = {
        ...formData,
        updatedAt: new Date()
      };
      
      if (!isEditing) {
        // Add created timestamp for new accommodations
        accommodationData.createdAt = new Date();
      }
      
      // Add or update the accommodation
      if (isEditing) {
        // Update existing accommodation
        await updateDoc(doc(db, 'accommodations', id), accommodationData);
      } else {
        // Add new accommodation
        await addDoc(collection(db, 'accommodations'), accommodationData);
      }
      
      // Navigate back to accommodations list
      navigate('/admin/accommodations');
    } catch (error) {
      console.error("Error saving accommodation:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">{isEditing ? 'Edit Accommodation' : 'Add New Accommodation'}</h1>
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
              placeholder="e.g., Caesars Palace Resort"
            />
          </div>
          
          <div className="admin-form-group">
            <label>Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows="4"
              placeholder="Describe the accommodation, its features, and amenities"
            />
          </div>
          
          <div className="admin-form-group">
            <label>Address</label>
            <textarea 
              name="address" 
              value={formData.address} 
              onChange={handleChange} 
              rows="2"
              placeholder="Full address including city, state, and zip code"
            />
          </div>
          
          <div className="admin-form-group">
            <label>Image URL</label>
            <input 
              type="url" 
              name="imageUrl" 
              value={formData.imageUrl} 
              onChange={handleChange} 
              placeholder="https://example.com/image.jpg" 
            />
            {formData.imageUrl && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={formData.imageUrl} 
                  alt="Accommodation Preview" 
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
            <label>Amenities (comma-separated)</label>
            <input 
              type="text" 
              name="amenities" 
              value={formData.amenities.join(', ')} 
              onChange={handleAmenitiesChange} 
              placeholder="e.g., Pool, Spa, Fitness Center, Restaurant" 
            />
            <p className="help-text">
              Enter amenities separated by commas
            </p>
          </div>
          
          <div className="admin-form-group">
            <label>Room Types (comma-separated)</label>
            <input 
              type="text" 
              name="roomTypes" 
              value={formData.roomTypes.join(', ')} 
              onChange={handleRoomTypesChange} 
              placeholder="e.g., Standard Room, Suite, Deluxe Room" 
            />
            <p className="help-text">
              Enter room types separated by commas
            </p>
          </div>
          
          <div className="admin-form-group">
            <label>Location</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label className="input-sublabel">Latitude</label>
                <input 
                  type="text" 
                  name="location.latitude" 
                  value={formData.location.latitude} 
                  onChange={handleChange} 
                  placeholder="e.g., 36.1164"
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label className="input-sublabel">Longitude</label>
                <input 
                  type="text" 
                  name="location.longitude" 
                  value={formData.location.longitude} 
                  onChange={handleChange} 
                  placeholder="e.g., -115.1746" 
                />
              </div>
            </div>
            <p className="help-text">
              Optional: Add GPS coordinates for map display
            </p>
          </div>
          
          <div className="admin-form-actions">
            <button 
              type="button" 
              className="admin-action-btn cancel-btn" 
              onClick={() => navigate('/admin/accommodations')}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="admin-action-btn" 
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Accommodation' : 'Create Accommodation')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 