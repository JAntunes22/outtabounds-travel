import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../../contexts/LocaleContext';
import { db } from '../../utils/firebaseConfig';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import localeConfig from '../../config/localeConfig';
import './Admin.css';

export default function FeaturedPacksManager() {
  const { getLocalizedPath } = useLocale();
  const navigate = useNavigate();
  const [packs, setPacks] = useState([]);
  const [featuredPacks, setFeaturedPacks] = useState({
    tier1: [],
    tier2: [],
    tier3: [],
    rest: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch all packs
      const packsCollection = collection(db, 'packs');
      const packsSnapshot = await getDocs(packsCollection);
      const packsList = packsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPacks(packsList);

      // Fetch featured packs configuration
      const featuredPacksDoc = await getDoc(doc(db, 'settings', 'featuredPacks'));
      if (featuredPacksDoc.exists()) {
        setFeaturedPacks(featuredPacksDoc.data());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handlePackToggle(tier, packId) {
    const currentTierPacks = [...featuredPacks[tier]];
    const packIndex = currentTierPacks.indexOf(packId);
    
    if (packIndex === -1) {
      // Add pack to tier (limit to 5 packs per tier)
      if (currentTierPacks.length < 5) {
        currentTierPacks.push(packId);
      } else {
        setError(`Maximum 5 packs allowed per tier. Remove a pack first.`);
        return;
      }
    } else {
      // Remove pack from tier
      currentTierPacks.splice(packIndex, 1);
    }
    
    setFeaturedPacks({
      ...featuredPacks,
      [tier]: currentTierPacks
    });
    
    // Clear any previous error
    setError('');
  }

  function movePackUp(tier, index) {
    if (index <= 0) return;
    
    const currentTierPacks = [...featuredPacks[tier]];
    const temp = currentTierPacks[index];
    currentTierPacks[index] = currentTierPacks[index - 1];
    currentTierPacks[index - 1] = temp;
    
    setFeaturedPacks({
      ...featuredPacks,
      [tier]: currentTierPacks
    });
  }

  function movePackDown(tier, index) {
    const currentTierPacks = [...featuredPacks[tier]];
    if (index >= currentTierPacks.length - 1) return;
    
    const temp = currentTierPacks[index];
    currentTierPacks[index] = currentTierPacks[index + 1];
    currentTierPacks[index + 1] = temp;
    
    setFeaturedPacks({
      ...featuredPacks,
      [tier]: currentTierPacks
    });
  }

  async function saveFeaturedPacks() {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await setDoc(doc(db, 'settings', 'featuredPacks'), featuredPacks);
      setSuccess('Featured packs configuration saved successfully!');
    } catch (error) {
      console.error("Error saving featured packs:", error);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function getPackById(packId) {
    return packs.find(pack => pack.id === packId);
  }

  function isPackSelected(tier, packId) {
    return featuredPacks[tier].includes(packId);
  }

  const tierDescriptions = {
    tier1: 'Premium markets (US, UK, Canada, Australia)',
    tier2: 'European markets (France, Germany, Italy, Netherlands, etc.)',
    tier3: 'Iberian markets (Portugal, Spain)',
    rest: 'All other countries (fallback)'
  };

  if (loading) {
    return (
      <div>
        <div className="admin-header">
          <h1 className="admin-title">Featured Packs Manager</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Featured Packs Manager</h1>
        <button 
          className="admin-action-btn cancel-btn" 
          onClick={() => navigate(getLocalizedPath('/admin'))}
        >
          Back to Dashboard
        </button>
      </div>

      <div className="admin-form-container">
        <div className="featured-packs-intro">
          <p>Configure which packs appear as featured on the home page for different country tiers. Each tier can have up to 5 featured packs. The order determines the display order on the home page.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        {Object.keys(featuredPacks).map(tier => (
          <div key={tier} className="tier-section">
            <h2 className="tier-title">
              {tier.toUpperCase()} - {tierDescriptions[tier]}
            </h2>
            
            <div className="tier-countries">
              <strong>Countries:</strong> {localeConfig.regionTiers[tier].join(', ')}
            </div>

            <div className="featured-packs-grid">
              <div className="selected-packs">
                <h3>Selected Featured Packs ({featuredPacks[tier].length}/5)</h3>
                {featuredPacks[tier].length === 0 ? (
                  <p className="no-packs">No packs selected for this tier</p>
                ) : (
                  <div className="selected-packs-list">
                    {featuredPacks[tier].map((packId, index) => {
                      const pack = getPackById(packId);
                      if (!pack) return null;
                      
                      return (
                        <div key={packId} className="selected-pack-item">
                          <div className="pack-order">
                            <button 
                              className="order-btn up" 
                              onClick={() => movePackUp(tier, index)}
                              disabled={index === 0}
                              title="Move Up"
                            >
                              ↑
                            </button>
                            <span className="order-number">{index + 1}</span>
                            <button 
                              className="order-btn down" 
                              onClick={() => movePackDown(tier, index)}
                              disabled={index === featuredPacks[tier].length - 1}
                              title="Move Down"
                            >
                              ↓
                            </button>
                          </div>
                          
                          <div className="pack-info">
                            {pack.imageUrl && (
                              <img 
                                src={pack.imageUrl} 
                                alt={pack.name}
                                className="pack-thumbnail"
                              />
                            )}
                            <div className="pack-details">
                              <h4>{pack.name}</h4>
                              <p>
                                {pack.prices && typeof pack.prices === 'object' ? (
                                  <>
                                    {pack.prices.EUR && `€${pack.prices.EUR} `}
                                    {pack.prices.USD && `$${pack.prices.USD} `}
                                    {pack.prices.GBP && `£${pack.prices.GBP}`}
                                  </>
                                ) : pack.price ? (
                                  `$${pack.price}`
                                ) : (
                                  'Price upon request'
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <button 
                            className="remove-pack-btn"
                            onClick={() => handlePackToggle(tier, packId)}
                            title="Remove from featured"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="available-packs">
                <h3>Available Packs</h3>
                <div className="available-packs-list">
                  {packs.map(pack => (
                    <div 
                      key={pack.id} 
                      className={`available-pack-item ${isPackSelected(tier, pack.id) ? 'selected' : ''}`}
                    >
                      {pack.imageUrl && (
                        <img 
                          src={pack.imageUrl} 
                          alt={pack.name}
                          className="pack-thumbnail"
                        />
                      )}
                      <div className="pack-details">
                        <h4>{pack.name}</h4>
                        <p>
                          {pack.prices && typeof pack.prices === 'object' ? (
                            <>
                              {pack.prices.EUR && `€${pack.prices.EUR} `}
                              {pack.prices.USD && `$${pack.prices.USD} `}
                              {pack.prices.GBP && `£${pack.prices.GBP}`}
                            </>
                          ) : pack.price ? (
                            `$${pack.price}`
                          ) : (
                            'Price upon request'
                          )}
                        </p>
                      </div>
                      <button 
                        className={`toggle-pack-btn ${isPackSelected(tier, pack.id) ? 'remove' : 'add'}`}
                        onClick={() => handlePackToggle(tier, pack.id)}
                        disabled={!isPackSelected(tier, pack.id) && featuredPacks[tier].length >= 5}
                      >
                        {isPackSelected(tier, pack.id) ? '✕' : '+'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="admin-form-actions">
          <button 
            className="admin-action-btn"
            onClick={saveFeaturedPacks}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Featured Packs Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
} 