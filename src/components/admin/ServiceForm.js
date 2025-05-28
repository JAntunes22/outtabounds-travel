import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '../../contexts/LocaleContext';
import { db } from '../../utils/firebaseConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc 
} from 'firebase/firestore';
import './Admin.css';

export default function ServiceForm() {
  const { getLocalizedPath } = useLocale();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '' // For the image URL
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fetchService = useCallback(async () => {
    setLoading(true);
    try {
      const serviceDoc = await getDoc(doc(db, 'services', id));
      
      if (serviceDoc.exists()) {
        const serviceData = serviceDoc.data();
        setFormData({
          name: serviceData.name || '',
          description: serviceData.description || '',
          url: serviceData.url || ''
        });
      } else {
        setError('Service not found');
      }
    } catch (error) {
      console.error("Error fetching service:", error);
      setError('Error fetching service data');
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    // If editing, fetch the service data
    if (isEditing) {
      fetchService();
    }
  }, [isEditing, fetchService]);
  
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Service name is required');
      }
      
      // Prepare data for Firestore
      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        url: formData.url.trim()
      };
      
      if (isEditing) {
        // Update existing service
        await updateDoc(doc(db, 'services', id), serviceData);
      } else {
        // Add new service
        await addDoc(collection(db, 'services'), serviceData);
      }
      
      // Navigate back to services list
      navigate(getLocalizedPath('/admin/services'));
    } catch (error) {
      console.error("Error saving service:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">{isEditing ? 'Edit Service' : 'Add New Service'}</h1>
      </div>
      
      <div className="admin-form-container">
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Service Name *</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              placeholder="Enter service name"
            />
          </div>
          
          <div className="admin-form-group">
            <label>Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows="4"
              placeholder="Enter service description"
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
              <div className="image-preview-container" style={{ marginTop: '10px' }}>
                <img 
                  src={formData.url} 
                  alt="Service preview" 
                  style={{ 
                    maxWidth: '200px', 
                    maxHeight: '150px', 
                    objectFit: 'cover', 
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div style={{ display: 'none', color: '#f44336', fontSize: '14px' }}>
                  Unable to load image from this URL
                </div>
              </div>
            )}
          </div>
          
          <div className="admin-form-actions">
            <button 
              type="button" 
              className="admin-action-btn cancel-btn" 
              onClick={() => navigate(getLocalizedPath('/admin/services'))}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="admin-action-btn" 
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Service' : 'Add Service')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 