import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocale } from '../../contexts/LocaleContext';
import { db } from '../../utils/firebaseConfig';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc
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
      
      // Sort by name for consistent display
      packList.sort((a, b) => a.name.localeCompare(b.name));
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
                  <th>Image</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packs.map((pack) => (
                  <tr key={pack.id}>
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