import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocale } from '../../contexts/LocaleContext';
import { db } from '../../utils/firebaseConfig';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import './Admin.css';
import Logger from '../../utils/logger';

export default function PackList() {
  const { getLocalizedPath } = useLocale();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [packToDelete, setPackToDelete] = useState(null);
  const [debug, setDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchPacks();
  }, []);
  
  async function fetchPacks() {
    setLoading(true);
    try {
      // Get all packs from Firestore
      const packsCollection = collection(db, 'packs');
      const querySnapshot = await getDocs(packsCollection);
      
      const packList = [];
      
      // Check if we have any documents
      if (querySnapshot.empty) {
        Logger.log("No packs found in the database.");
        setPacks([]);
        setLoading(false);
        return;
      }
      
      // Process each pack document
      querySnapshot.forEach((doc) => {
        const packData = doc.data();
        Logger.log("Fetched pack:", doc.id, packData);
        
        packList.push({
          id: doc.id,
          ...packData
        });
      });
      
      // Sort by order field first, then by name for consistent display
      packList.sort((a, b) => {
        // If both have order, sort by order
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // If only one has order, put it first
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        // If neither has order, sort by name
        return a.name.localeCompare(b.name);
      });
      
      Logger.log("Total packs loaded:", packList.length);
      setPacks(packList);
    } catch (error) {
      Logger.error("Error fetching packs:", error);
    } finally {
      setLoading(false);
    }
  }
  
  function handleEditPack(packId) {
    navigate(getLocalizedPath(`/admin/packs/edit/${packId}`));
  }
  
  function confirmDelete(pack) {
    setPackToDelete(pack);
    setShowDeleteModal(true);
  }
  
  async function deletePack() {
    if (!packToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'packs', packToDelete.id));
      setPacks(packs.filter(pack => pack.id !== packToDelete.id));
      setShowDeleteModal(false);
      setPackToDelete(null);
    } catch (error) {
      Logger.error("Error deleting pack:", error);
    }
  }

  // Function to get debug information about Firestore
  async function getDebugInfo() {
    setLoading(true);
    try {
      const packsCollection = collection(db, 'packs');
      const snapshot = await getDocs(packsCollection);
      
      const info = {
        totalDocs: snapshot.size,
        docs: []
      };
      
      snapshot.forEach(doc => {
        info.docs.push({
          id: doc.id,
          exists: doc.exists(),
          data: doc.data()
        });
      });
      
      setDebugInfo(info);
      setDebug(true);
    } catch (error) {
      Logger.error("Error getting debug info:", error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  }

  // Generate a slug from the pack name for SEO-friendly URLs
  function generateSlug(name) {
    if (!name || typeof name !== 'string') {
      return '';
    }
    
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '')  // Remove leading and trailing hyphens
      .trim();                  // Trim leading/trailing spaces
  }

  async function regenerateSlugs() {
    if (!window.confirm('This will regenerate slugs for all packs that don\'t have them. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      let updatedCount = 0;
      
      for (const pack of packs) {
        if (!pack.slug && pack.name) {
          const newSlug = generateSlug(pack.name);
          if (newSlug) {
            await updateDoc(doc(db, 'packs', pack.id), {
              slug: newSlug,
              updatedAt: new Date()
            });
            updatedCount++;
            Logger.log(`Updated slug for pack: ${pack.name} -> ${newSlug}`);
          }
        }
      }
      
      if (updatedCount > 0) {
        alert(`Successfully regenerated slugs for ${updatedCount} pack(s).`);
        fetchPacks(); // Refresh the list
      } else {
        alert('No packs needed slug regeneration.');
      }
    } catch (error) {
      Logger.error("Error regenerating slugs:", error);
      alert('Error regenerating slugs. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function initializeOrders() {
    if (!window.confirm('This will initialize order values for all packs that don\'t have them. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      let updatedCount = 0;
      
      for (let i = 0; i < packs.length; i++) {
        const pack = packs[i];
        if (pack.order === undefined || pack.order === null) {
          await updateDoc(doc(db, 'packs', pack.id), {
            order: i,
            updatedAt: new Date()
          });
          updatedCount++;
          Logger.log(`Initialized order for pack: ${pack.name} -> ${i}`);
        }
      }
      
      if (updatedCount > 0) {
        alert(`Successfully initialized orders for ${updatedCount} pack(s).`);
        fetchPacks(); // Refresh the list
      } else {
        alert('No packs needed order initialization.');
      }
    } catch (error) {
      Logger.error("Error initializing orders:", error);
      alert('Error initializing orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function movePackUp(packIndex) {
    if (packIndex === 0) return; // Already at the top
    
    const newPacks = [...packs];
    const currentPack = newPacks[packIndex];
    const previousPack = newPacks[packIndex - 1];
    
    // Swap the packs
    newPacks[packIndex] = previousPack;
    newPacks[packIndex - 1] = currentPack;
    
    // Update the order values
    const currentOrder = currentPack.order || packIndex;
    const previousOrder = previousPack.order || (packIndex - 1);
    
    try {
      // Update both packs in Firestore
      await Promise.all([
        updateDoc(doc(db, 'packs', currentPack.id), {
          order: previousOrder,
          updatedAt: new Date()
        }),
        updateDoc(doc(db, 'packs', previousPack.id), {
          order: currentOrder,
          updatedAt: new Date()
        })
      ]);
      
      // Update local state
      setPacks(newPacks);
      Logger.log(`Moved pack "${currentPack.name}" up in order`);
    } catch (error) {
      Logger.error("Error updating pack order:", error);
      alert('Error updating pack order. Please try again.');
    }
  }

  async function movePackDown(packIndex) {
    if (packIndex === packs.length - 1) return; // Already at the bottom
    
    const newPacks = [...packs];
    const currentPack = newPacks[packIndex];
    const nextPack = newPacks[packIndex + 1];
    
    // Swap the packs
    newPacks[packIndex] = nextPack;
    newPacks[packIndex + 1] = currentPack;
    
    // Update the order values
    const currentOrder = currentPack.order || packIndex;
    const nextOrder = nextPack.order || (packIndex + 1);
    
    try {
      // Update both packs in Firestore
      await Promise.all([
        updateDoc(doc(db, 'packs', currentPack.id), {
          order: nextOrder,
          updatedAt: new Date()
        }),
        updateDoc(doc(db, 'packs', nextPack.id), {
          order: currentOrder,
          updatedAt: new Date()
        })
      ]);
      
      // Update local state
      setPacks(newPacks);
      Logger.log(`Moved pack "${currentPack.name}" down in order`);
    } catch (error) {
      Logger.error("Error updating pack order:", error);
      alert('Error updating pack order. Please try again.');
    }
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Manage Packs</h1>
        <div className="admin-action-buttons">
          <button 
            className="admin-action-btn refresh-btn" 
            onClick={fetchPacks}
            disabled={loading}
          >
            Refresh Packs
          </button>
          <button 
            className="admin-action-btn" 
            onClick={regenerateSlugs}
            disabled={loading}
            style={{ marginLeft: '10px', backgroundColor: '#ff9800' }}
          >
            Regenerate Slugs
          </button>
          <button 
            className="admin-action-btn" 
            onClick={initializeOrders}
            disabled={loading}
            style={{ marginLeft: '10px', backgroundColor: '#9c27b0' }}
          >
            Initialize Orders
          </button>
          <Link to={getLocalizedPath('/admin/packs/add-samples')} className="admin-action-btn" style={{ marginLeft: '10px' }}>
            Add Sample Packs
          </Link>
          <Link to={getLocalizedPath('/admin/packs/featured')} className="admin-action-btn" style={{ marginLeft: '10px' }}>
            ⭐ Manage Featured
          </Link>
          <Link to={getLocalizedPath('/admin/packs/new')} className="admin-action-btn" style={{ marginLeft: '10px' }}>
            <span>+</span> Add New Pack
          </Link>
          <button
            className="admin-action-btn"
            onClick={getDebugInfo}
            style={{ marginLeft: '10px', backgroundColor: debug ? '#e53935' : '#2196f3' }}
          >
            {debug ? 'Hide Debug' : 'Debug'}
          </button>
        </div>
      </div>
      
      {debug && debugInfo && (
        <div className="debug-section">
          <h3>Firestore Debug Information</h3>
          <p>Total documents in 'packs' collection: {debugInfo.totalDocs}</p>
          {debugInfo.docs && debugInfo.docs.length > 0 ? (
            <div className="debug-data">
              <h4>Documents:</h4>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          ) : (
            <p>No documents found in 'packs' collection.</p>
          )}
          <button 
            className="admin-action-btn"
            onClick={() => setDebug(false)}
            style={{ backgroundColor: '#e53935', marginTop: '10px' }}
          >
            Close Debug
          </button>
        </div>
      )}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading packs...
        </div>
      ) : (
        <div className="admin-table-container">
          {packs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <p>No packs found. Add your first pack to get started.</p>
              <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <Link to={getLocalizedPath('/admin/packs/new')} className="admin-action-btn">
                  Add New Pack
                </Link>
                <Link to={getLocalizedPath('/admin/packs/add-samples')} className="admin-action-btn">
                  Add Sample Packs
                </Link>
              </div>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>URL Slug</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packs.map((pack, index) => (
                  <tr key={pack.id}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                      {index + 1}
                    </td>
                    <td style={{ width: '80px' }}>
                      {pack.imageUrl ? (
                        <img 
                          src={pack.imageUrl} 
                          alt={pack.name}
                          style={{ 
                            width: '60px', 
                            height: '40px', 
                            objectFit: 'cover', 
                            borderRadius: '4px' 
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/60x40?text=No+Image';
                          }}
                        />
                      ) : (
                        <div style={{ 
                          width: '60px', 
                          height: '40px', 
                          backgroundColor: '#f0f0f0', 
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#888',
                          textAlign: 'center'
                        }}>
                          No Image
                        </div>
                      )}
                    </td>
                    <td>{pack.name}</td>
                    <td>{pack.description ? (pack.description.length > 100 ? pack.description.substring(0, 100) + '...' : pack.description) : 'No description'}</td>
                    <td>{pack.slug || 'Not set'}</td>
                    <td>
                      {pack.prices && typeof pack.prices === 'object' ? (
                        <div className="price-display">
                          {pack.prices.EUR && <div>€{pack.prices.EUR}</div>}
                          {pack.prices.USD && <div>${pack.prices.USD}</div>}
                          {pack.prices.GBP && <div>£{pack.prices.GBP}</div>}
                        </div>
                      ) : pack.price ? (
                        `$${pack.price}`
                      ) : (
                        'Not set'
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="action-btn move" 
                          onClick={() => movePackUp(index)}
                          disabled={index === 0}
                          title="Move Up"
                          style={{ 
                            opacity: index === 0 ? 0.5 : 1,
                            cursor: index === 0 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          ↑
                        </button>
                        <button 
                          className="action-btn move" 
                          onClick={() => movePackDown(index)}
                          disabled={index === packs.length - 1}
                          title="Move Down"
                          style={{ 
                            opacity: index === packs.length - 1 ? 0.5 : 1,
                            cursor: index === packs.length - 1 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          ↓
                        </button>
                        <button 
                          className="action-btn edit" 
                          onClick={() => handleEditPack(pack.id)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn delete" 
                          onClick={() => confirmDelete(pack)}
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
      
      {showDeleteModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{packToDelete?.name}</strong>?</p>
              <p>This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button 
                className="admin-action-btn cancel-btn" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="admin-action-btn" 
                style={{ backgroundColor: '#f44336' }}
                onClick={deletePack}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 