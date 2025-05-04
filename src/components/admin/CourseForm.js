import React, { useState, useEffect } from 'react';
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

export default function CourseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    position: '',
    description: '',
    url: '', // For the image URL
    rating: '',
    features: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  
  useEffect(() => {
    // If editing, fetch the course data
    if (isEditing) {
      fetchCourse();
    }
  }, [isEditing]);
  
  async function fetchCourse() {
    setLoading(true);
    try {
      const courseDoc = await getDoc(doc(db, 'courses', id));
      
      if (courseDoc.exists()) {
        const courseData = courseDoc.data();
        
        // Ensure features is an array
        let features = [];
        if (courseData.features) {
          features = Array.isArray(courseData.features) 
            ? courseData.features 
            : JSON.parse(courseData.features);
        }
        
        setFormData({
          ...courseData,
          features: features || []
        });
      } else {
        setError('Course not found');
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      setError('Error fetching course data');
    } finally {
      setLoading(false);
    }
  }
  
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  }
  
  function addFeature() {
    if (!featureInput.trim()) return;
    
    setFormData({
      ...formData,
      features: [...formData.features, featureInput.trim()]
    });
    
    setFeatureInput('');
  }
  
  function removeFeature(index) {
    const updatedFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      features: updatedFeatures
    });
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate required fields
      if (!formData.name || !formData.location) {
        throw new Error('Name and location are required');
      }
      
      // Prepare data for Firestore
      const courseData = {
        ...formData,
        // Convert features array to a string if needed by your app
        // features: JSON.stringify(formData.features)
      };
      
      if (isEditing) {
        // Update existing course
        await updateDoc(doc(db, 'courses', id), courseData);
      } else {
        // Add new course
        await addDoc(collection(db, 'courses'), courseData);
      }
      
      // Navigate back to course list
      navigate('/admin/courses');
    } catch (error) {
      console.error("Error saving course:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">{isEditing ? 'Edit Course' : 'Add New Course'}</h1>
      </div>
      
      <div className="admin-form-container">
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Course Name *</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="admin-form-group">
            <label>Location *</label>
            <input 
              type="text" 
              name="location" 
              value={formData.location} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="admin-form-group">
            <label>Position (latitude,longitude)</label>
            <input 
              type="text" 
              name="position" 
              value={formData.position} 
              onChange={handleChange} 
              placeholder="e.g. 37.123,-8.456" 
            />
          </div>
          
          <div className="admin-form-group">
            <label>Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
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
          </div>
          
          <div className="admin-form-group">
            <label>Rating (1-5)</label>
            <input 
              type="number" 
              name="rating" 
              value={formData.rating} 
              onChange={handleChange} 
              min="1" 
              max="5" 
              step="0.1" 
            />
          </div>
          
          <div className="admin-form-group">
            <label>Features</label>
            <div className="feature-input-container">
              <input 
                type="text" 
                value={featureInput} 
                onChange={(e) => setFeatureInput(e.target.value)} 
                placeholder="e.g. 18-hole championship course" 
              />
              <button 
                type="button" 
                className="feature-add-btn" 
                onClick={addFeature}
                style={{
                  backgroundColor: '#186d00',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 15px',
                  marginLeft: '10px',
                  cursor: 'pointer'
                }}
              >
                Add
              </button>
            </div>
            
            {formData.features.length > 0 && (
              <div className="feature-list">
                <ul style={{ marginTop: '15px' }}>
                  {formData.features.map((feature, index) => (
                    <li key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                      <span>{feature}</span>
                      <button 
                        type="button" 
                        onClick={() => removeFeature(index)}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#f44336',
                          border: 'none',
                          cursor: 'pointer',
                          marginLeft: '10px',
                          fontSize: '16px'
                        }}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="admin-form-buttons">
            <button 
              type="button" 
              className="admin-action-btn cancel-btn" 
              onClick={() => navigate('/admin/courses')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="admin-action-btn" 
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 