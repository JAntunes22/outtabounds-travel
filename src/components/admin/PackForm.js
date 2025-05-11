import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../utils/firebaseConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc,
  query,
  getDocs
} from 'firebase/firestore';
import './Admin.css';

export default function PackForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    courses: [],
    experiences: [],
    accommodations: [],
    services: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Available items to select for the pack
  const [availableItems, setAvailableItems] = useState({
    courses: [],
    experiences: [],
    accommodations: [],
    services: []
  });
  
  useEffect(() => {
    // Load available items for selection
    fetchAvailableItems();
    
    // If editing, fetch the pack data
    if (isEditing) {
      fetchPack();
    }
  }, [isEditing]);
  
  async function fetchAvailableItems() {
    setLoading(true);
    try {
      const collections = ['courses', 'experiences', 'accommodations', 'services'];
      const items = {
        courses: [],
        experiences: [],
        accommodations: [],
        services: []
      };
      
      for (const collName of collections) {
        try {
          const q = query(collection(db, collName));
          const snapshot = await getDocs(q);
          
          snapshot.forEach(doc => {
            items[collName].push({
              id: doc.id,
              name: doc.data().name,
              ...doc.data()
            });
          });
        } catch (err) {
          console.error(`Error fetching ${collName}:`, err);
        }
      }
      
      setAvailableItems(items);
    } catch (error) {
      console.error("Error fetching available items:", error);
      setError('Failed to load available items for selection');
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchPack() {
    setLoading(true);
    try {
      const packDoc = await getDoc(doc(db, 'packs', id));
      
      if (packDoc.exists()) {
        const packData = packDoc.data();
        
        // Ensure arrays are properly initialized
        setFormData({
          ...packData,
          imageUrl: packData.imageUrl || '',
          courses: packData.courses || [],
          experiences: packData.experiences || [],
          accommodations: packData.accommodations || [],
          services: packData.services || []
        });
      } else {
        setError('Pack not found');
      }
    } catch (error) {
      console.error("Error fetching pack:", error);
      setError('Error fetching pack data');
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
  
  function handleItemToggle(type, item) {
    const currentItems = [...formData[type]];
    const itemIndex = currentItems.findIndex(i => i.id === item.id);
    
    if (itemIndex === -1) {
      // Add item
      currentItems.push({
        id: item.id,
        name: item.name
      });
    } else {
      // Remove item
      currentItems.splice(itemIndex, 1);
    }
    
    setFormData({
      ...formData,
      [type]: currentItems
    });
  }
  
  function isItemSelected(type, itemId) {
    return formData[type].some(item => item.id === itemId);
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate required fields
      if (!formData.name) {
        throw new Error('Pack name is required');
      }
      
      // Prepare data for Firestore
      const packData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null
      };
      
      if (isEditing) {
        // Update existing pack
        await updateDoc(doc(db, 'packs', id), packData);
      } else {
        // Add new pack
        await addDoc(collection(db, 'packs'), packData);
      }
      
      // Navigate back to packs list
      navigate('/admin/packs');
    } catch (error) {
      console.error("Error saving pack:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">{isEditing ? 'Edit Pack' : 'Add New Pack'}</h1>
      </div>
      
      <div className="admin-form-container">
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Pack Name *</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="admin-form-group">
            <label>Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows="4"
            />
          </div>
          
          <div className="admin-form-group">
            <label>Price</label>
            <input 
              type="number" 
              name="price" 
              value={formData.price} 
              onChange={handleChange} 
              step="0.01" 
              min="0"
              placeholder="0.00" 
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
                  alt="Pack Preview" 
                  style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'cover', borderRadius: '4px' }} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/200x100?text=Invalid+Image+URL';
                  }}
                />
              </div>
            )}
          </div>
          
          {/* Courses Selection */}
          <div className="admin-form-group">
            <label>Courses</label>
            <div className="admin-selection-container">
              {availableItems.courses.length === 0 ? (
                <p>No courses available</p>
              ) : (
                <div className="admin-checkboxes">
                  {availableItems.courses.map(course => (
                    <div className="admin-checkbox-item" key={course.id}>
                      <label>
                        <input 
                          type="checkbox" 
                          checked={isItemSelected('courses', course.id)} 
                          onChange={() => handleItemToggle('courses', course)} 
                        />
                        {course.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Experiences Selection */}
          <div className="admin-form-group">
            <label>Experiences</label>
            <div className="admin-selection-container">
              {availableItems.experiences.length === 0 ? (
                <p>No experiences available</p>
              ) : (
                <div className="admin-checkboxes">
                  {availableItems.experiences.map(experience => (
                    <div className="admin-checkbox-item" key={experience.id}>
                      <label>
                        <input 
                          type="checkbox" 
                          checked={isItemSelected('experiences', experience.id)} 
                          onChange={() => handleItemToggle('experiences', experience)} 
                        />
                        {experience.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Accommodations Selection */}
          <div className="admin-form-group">
            <label>Accommodations</label>
            <div className="admin-selection-container">
              {availableItems.accommodations.length === 0 ? (
                <p>No accommodations available</p>
              ) : (
                <div className="admin-checkboxes">
                  {availableItems.accommodations.map(accommodation => (
                    <div className="admin-checkbox-item" key={accommodation.id}>
                      <label>
                        <input 
                          type="checkbox" 
                          checked={isItemSelected('accommodations', accommodation.id)} 
                          onChange={() => handleItemToggle('accommodations', accommodation)} 
                        />
                        {accommodation.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Services Selection */}
          <div className="admin-form-group">
            <label>Services</label>
            <div className="admin-selection-container">
              {availableItems.services.length === 0 ? (
                <p>No services available</p>
              ) : (
                <div className="admin-checkboxes">
                  {availableItems.services.map(service => (
                    <div className="admin-checkbox-item" key={service.id}>
                      <label>
                        <input 
                          type="checkbox" 
                          checked={isItemSelected('services', service.id)} 
                          onChange={() => handleItemToggle('services', service)} 
                        />
                        {service.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="admin-form-actions">
            <button 
              type="button" 
              className="admin-action-btn cancel-btn" 
              onClick={() => navigate('/admin/packs')}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="admin-action-btn" 
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Pack' : 'Create Pack')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 