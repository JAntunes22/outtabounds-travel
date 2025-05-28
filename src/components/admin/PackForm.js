import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '../../contexts/LocaleContext';
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
import Logger from '../../utils/logger';

export default function PackForm() {
  const { getLocalizedPath } = useLocale();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prices: {
      EUR: '',
      USD: '',
      GBP: ''
    },
    imageUrl: '',
    courses: [],
    experiences: [],
    accommodations: [],
    services: [],
    slug: '',
    nights: '',
    board: 'Room only',
    recommendedGroup: '2'
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
  
  const fetchPack = useCallback(async () => {
    setLoading(true);
    try {
      const packDoc = await getDoc(doc(db, 'packs', id));
      
      if (packDoc.exists()) {
        const packData = packDoc.data();
        
        // Handle pricing structure - support both old and new formats
        let prices = { EUR: '', USD: '', GBP: '' };
        
        if (packData.prices && typeof packData.prices === 'object') {
          // New format with multiple currencies
          prices = {
            EUR: packData.prices.EUR ? packData.prices.EUR.toString() : '',
            USD: packData.prices.USD ? packData.prices.USD.toString() : '',
            GBP: packData.prices.GBP ? packData.prices.GBP.toString() : ''
          };
        } else if (packData.price) {
          // Old format with single price - assume it's USD for backward compatibility
          prices.USD = packData.price.toString();
        }
        
        // Ensure arrays are properly initialized
        setFormData({
          ...packData,
          prices: prices,
          imageUrl: packData.imageUrl || '',
          courses: packData.courses || [],
          experiences: packData.experiences || [],
          accommodations: packData.accommodations || [],
          services: packData.services || [],
          slug: packData.slug || '',
          nights: packData.nights || '',
          board: packData.board || 'Room only',
          recommendedGroup: packData.recommendedGroup || '2'
        });
      } else {
        setError('Pack not found');
      }
    } catch (error) {
      Logger.error("Error fetching pack:", error);
      setError('Error fetching pack data');
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    // Load available items for selection
    fetchAvailableItems();
    
    // If editing, fetch the pack data
    if (isEditing) {
      fetchPack();
    }
  }, [isEditing, fetchPack]);
  
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
          Logger.error(`Error fetching ${collName}:`, err);
        }
      }
      
      setAvailableItems(items);
    } catch (error) {
      Logger.error("Error fetching available items:", error);
      setError('Failed to load available items for selection');
    } finally {
      setLoading(false);
    }
  }
  
  function handleChange(e) {
    const { name, value } = e.target;
    
    // Handle price changes for different currencies
    if (name.startsWith('price_')) {
      const currency = name.split('_')[1];
      setFormData({
        ...formData,
        prices: {
          ...formData.prices,
          [currency]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  }
  
  // Generate a slug from the pack name for SEO-friendly URLs
  function generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
      .trim();                  // Trim leading/trailing spaces/hyphens
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
      
      // Generate a slug for the pack if needed
      const slug = formData.slug || generateSlug(formData.name);
      
      // Prepare prices object with parsed numbers
      const prices = {};
      Object.keys(formData.prices).forEach(currency => {
        const price = formData.prices[currency];
        if (price && price.trim() !== '') {
          prices[currency] = parseFloat(price);
        }
      });
      
      // Prepare data for Firestore
      const packData = {
        ...formData,
        slug: slug,
        prices: prices,
        updatedAt: new Date()
      };
      
      // Remove the old price field if it exists and add backward compatibility
      delete packData.price;
      
      // For backward compatibility, set the USD price as the default price
      if (prices.USD) {
        packData.price = prices.USD;
      } else if (prices.EUR) {
        packData.price = prices.EUR;
      } else if (prices.GBP) {
        packData.price = prices.GBP;
      }
      
      if (!isEditing) {
        // Add created timestamp for new packs
        packData.createdAt = new Date();
      }
      
      // Add or update the pack
      if (isEditing) {
        // Update existing pack
        await updateDoc(doc(db, 'packs', id), packData);
      } else {
        // Add new pack
        await addDoc(collection(db, 'packs'), packData);
      }
      
      // Navigate back to packs list
      navigate(getLocalizedPath('/admin/packs'));
    } catch (error) {
      Logger.error("Error saving pack:", error);
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
            <label>URL Slug</label>
            <div className="input-with-help">
              <input 
                type="text" 
                name="slug" 
                value={formData.slug} 
                onChange={handleChange}
                placeholder="Leave blank to auto-generate from name" 
              />
              <p className="help-text">
                The URL-friendly version of the name. Used in the pack's page URL.
              </p>
            </div>
          </div>
          
          <div className="admin-form-group">
            <label>Nights</label>
            <input 
              type="number" 
              name="nights" 
              value={formData.nights} 
              onChange={handleChange} 
              min="1"
              placeholder="e.g., 3" 
            />
          </div>
          
          <div className="admin-form-group">
            <label>Board Type</label>
            <select
              name="board"
              value={formData.board}
              onChange={handleChange}
            >
              <option value="Room only">Room only</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Half Board">Half Board</option>
              <option value="Full Board">Full Board</option>
              <option value="All Inclusive">All Inclusive</option>
            </select>
          </div>
          
          <div className="admin-form-group">
            <label>Recommended Group Size</label>
            <input 
              type="number" 
              name="recommendedGroup" 
              value={formData.recommendedGroup} 
              onChange={handleChange} 
              min="1"
              placeholder="e.g., 2" 
            />
            <p className="help-text">
              The recommended number of people for optimal pricing.
            </p>
          </div>
          
          {/* Multi-currency pricing section */}
          <div className="admin-form-group">
            <label>Pricing (Per Person Per Night)</label>
            <div className="currency-pricing-grid">
              <div className="currency-price-input">
                <label htmlFor="price_EUR">EUR (€)</label>
                <input 
                  type="number" 
                  id="price_EUR"
                  name="price_EUR" 
                  value={formData.prices.EUR} 
                  onChange={handleChange} 
                  step="0.01" 
                  min="0"
                  placeholder="0.00" 
                />
              </div>
              
              <div className="currency-price-input">
                <label htmlFor="price_USD">USD ($)</label>
                <input 
                  type="number" 
                  id="price_USD"
                  name="price_USD" 
                  value={formData.prices.USD} 
                  onChange={handleChange} 
                  step="0.01" 
                  min="0"
                  placeholder="0.00" 
                />
              </div>
              
              <div className="currency-price-input">
                <label htmlFor="price_GBP">GBP (£)</label>
                <input 
                  type="number" 
                  id="price_GBP"
                  name="price_GBP" 
                  value={formData.prices.GBP} 
                  onChange={handleChange} 
                  step="0.01" 
                  min="0"
                  placeholder="0.00" 
                />
              </div>
            </div>
            <p className="help-text">
              Set prices in different currencies. At least one currency must be specified.
            </p>
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
              onClick={() => navigate(getLocalizedPath('/admin/packs'))}
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