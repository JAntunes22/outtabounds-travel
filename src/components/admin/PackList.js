import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../utils/firebaseConfig';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  deleteDoc,
  updateDoc,
  orderBy,
  getFirestore,
  getDoc
} from 'firebase/firestore';
import './Admin.css';

export default function PackList() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [packToDelete, setPackToDelete] = useState(null);
  const [reordering, setReordering] = useState(false);
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
      let maxOrder = 0;
      
      // Check if we have any documents
      if (querySnapshot.empty) {
        console.log("No packs found in the database.");
        setPacks([]);
        setLoading(false);
        return;
      }
      
      // Process each pack document
      querySnapshot.forEach((doc) => {
        const packData = doc.data();
        console.log("Fetched pack:", doc.id, packData);
        
        // Ensure all packs have an order field
        if (packData.order === undefined) {
          packData.order = maxOrder + 1;
          // Update the document in Firestore with the new order
          updateDoc(doc.ref, { order: packData.order });
        }
        
        if (packData.order > maxOrder) {
          maxOrder = packData.order;
        }
        
        packList.push({
          id: doc.id,
          ...packData
        });
      });
      
      // Sort by order
      packList.sort((a, b) => a.order - b.order);
      console.log("Total packs loaded:", packList.length);
      setPacks(packList);
    } catch (error) {
      console.error("Error fetching packs:", error);
    } finally {
      setLoading(false);
    }
  }
  
  async function movePackUp(index) {
    if (index <= 0) return; // Already at the top
    
    // Create a copy of the packs array
    const newPacks = [...packs];
    
    // Get the current pack and the one above it
    const packToMove = newPacks[index];
    const packAbove = newPacks[index - 1];
    
    // Swap their orders
    const tempOrder = packToMove.order;
    packToMove.order = packAbove.order;
    packAbove.order = tempOrder;
    
    // Swap their positions in the array
    newPacks[index] = packAbove;
    newPacks[index - 1] = packToMove;
    
    // Update the state
    setPacks(newPacks);
    setReordering(true);
    
    // Update in Firestore
    try {
      await updateDoc(doc(db, 'packs', packToMove.id), { order: packToMove.order });
      await updateDoc(doc(db, 'packs', packAbove.id), { order: packAbove.order });
      setReordering(false);
    } catch (error) {
      console.error("Error updating pack order:", error);
      setReordering(false);
      // Revert to original order if there's an error
      fetchPacks();
    }
  }
  
  async function movePackDown(index) {
    if (index >= packs.length - 1) return; // Already at the bottom
    
    // Create a copy of the packs array
    const newPacks = [...packs];
    
    // Get the current pack and the one below it
    const packToMove = newPacks[index];
    const packBelow = newPacks[index + 1];
    
    // Swap their orders
    const tempOrder = packToMove.order;
    packToMove.order = packBelow.order;
    packBelow.order = tempOrder;
    
    // Swap their positions in the array
    newPacks[index] = packBelow;
    newPacks[index + 1] = packToMove;
    
    // Update the state
    setPacks(newPacks);
    setReordering(true);
    
    // Update in Firestore
    try {
      await updateDoc(doc(db, 'packs', packToMove.id), { order: packToMove.order });
      await updateDoc(doc(db, 'packs', packBelow.id), { order: packBelow.order });
      setReordering(false);
    } catch (error) {
      console.error("Error updating pack order:", error);
      setReordering(false);
      // Revert to original order if there's an error
      fetchPacks();
    }
  }
  
  function handleEditPack(packId) {
    navigate(`/admin/packs/edit/${packId}`);
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
      console.error("Error deleting pack:", error);
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
      console.error("Error getting debug info:", error);
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
          <Link to="/admin/packs/add-samples" className="admin-action-btn" style={{ marginLeft: '10px' }}>
            Add Sample Packs
          </Link>
          <Link to="/admin/packs/new" className="admin-action-btn" style={{ marginLeft: '10px' }}>
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
      
      <div className="pack-order-note">
        <p><strong>Note:</strong> The order of packs determines how they appear on the homepage. The pack in position #2 will be displayed larger than the others.</p>
      </div>
      
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
                <Link to="/admin/packs/new" className="admin-action-btn">
                  Add New Pack
                </Link>
                <Link to="/admin/packs/add-samples" className="admin-action-btn">
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
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packs.map((pack, index) => (
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
                    <td>{pack.price ? `$${pack.price}` : 'Not set'}</td>
                    <td className="order-column">
                      <div className="order-actions">
                        <button 
                          className="order-btn up" 
                          onClick={() => movePackUp(index)}
                          disabled={reordering || index === 0}
                          title="Move Up"
                        >
                          ↑
                        </button>
                        <span className={`order-number ${pack.order === 2 ? 'featured-position' : ''}`}>
                          {pack.order}
                          {pack.order === 2 && <span className="featured-star">★</span>}
                        </span>
                        <button 
                          className="order-btn down" 
                          onClick={() => movePackDown(index)}
                          disabled={reordering || index === packs.length - 1}
                          title="Move Down"
                        >
                          ↓
                        </button>
                      </div>
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