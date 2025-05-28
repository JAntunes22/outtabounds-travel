import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocale } from '../../contexts/LocaleContext';
import { db } from '../../utils/firebaseConfig';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';
import './Admin.css';

export default function ServiceList() {
  const { getLocalizedPath } = useLocale();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchServices();
  }, []);
  
  async function fetchServices() {
    setLoading(true);
    try {
      const servicesRef = collection(db, 'services');
      const q = query(servicesRef);
      const querySnapshot = await getDocs(q);
      
      const serviceList = [];
      querySnapshot.forEach((doc) => {
        serviceList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setServices(serviceList);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  }
  
  function handleEditService(serviceId) {
    navigate(`/admin/services/edit/${serviceId}`);
  }
  
  function confirmDelete(service) {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  }
  
  async function deleteService() {
    if (!serviceToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'services', serviceToDelete.id));
      setServices(services.filter(service => service.id !== serviceToDelete.id));
      setShowDeleteModal(false);
      setServiceToDelete(null);
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Manage Services</h1>
        <Link to={getLocalizedPath('/admin/services/new')} className="admin-action-btn">
          <span>+</span> Add New Service
        </Link>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading services...
        </div>
      ) : (
        <div className="admin-table-container">
          {services.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <p>No services found. Add your first service to get started.</p>
              <Link to={getLocalizedPath('/admin/services/new')} className="admin-action-btn" style={{ display: 'inline-block', marginTop: '15px' }}>
                Add New Service
              </Link>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Image</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map(service => (
                  <tr key={service.id}>
                    <td>{service.name}</td>
                    <td>
                      <div className="description-preview">
                        {service.description ? 
                          (service.description.length > 100 ? 
                            `${service.description.substring(0, 100)}...` : 
                            service.description
                          ) : 
                          'No description'
                        }
                      </div>
                    </td>
                    <td>
                      {service.url ? (
                        <div className="image-preview">
                          <img 
                            src={service.url} 
                            alt={service.name}
                            style={{ 
                              width: '60px', 
                              height: '40px', 
                              objectFit: 'cover', 
                              borderRadius: '4px' 
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <span style={{ display: 'none', fontSize: '12px', color: '#666' }}>
                            Image not available
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#666' }}>No image</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="action-btn edit" 
                          onClick={() => handleEditService(service.id)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn delete" 
                          onClick={() => confirmDelete(service)}
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
              <p>Are you sure you want to delete <strong>{serviceToDelete?.name}</strong>?</p>
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
                onClick={deleteService}
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