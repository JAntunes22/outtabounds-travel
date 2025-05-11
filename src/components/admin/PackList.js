import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../utils/firebaseConfig';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';
import './Admin.css';

export default function PackList() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [packToDelete, setPackToDelete] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchPacks();
  }, []);
  
  async function fetchPacks() {
    setLoading(true);
    try {
      const packsRef = collection(db, 'packs');
      const q = query(packsRef);
      const querySnapshot = await getDocs(q);
      
      const packList = [];
      querySnapshot.forEach((doc) => {
        packList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setPacks(packList);
    } catch (error) {
      console.error("Error fetching packs:", error);
    } finally {
      setLoading(false);
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

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Manage Packs</h1>
        <Link to="/admin/packs/new" className="admin-action-btn">
          <span>+</span> Add New Pack
        </Link>
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
              <Link to="/admin/packs/new" className="admin-action-btn" style={{ display: 'inline-block', marginTop: '15px' }}>
                Add New Pack
              </Link>
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
                {packs.map(pack => (
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