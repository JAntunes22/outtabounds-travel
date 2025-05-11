import React, { useState } from 'react';
import { collection, addDoc, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import '../admin/Admin.css';

const AddSamplePacks = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [existingPacks, setExistingPacks] = useState(null);

  // Sample pack data that matches the reference image
  const samplePacks = [
    {
      name: 'PAR-ADISE',
      price: '450',
      imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914',
      accommodations: ['Luxury Villa'],
      courses: ['Golf Course Access'],
      services: ['Concierge'],
      experiences: ['Spa Treatment'],
      description: 'Enjoy the perfect golfing getaway in paradise.',
      order: 1
    },
    {
      name: 'VILLA RETREAT',
      price: '647',
      imageUrl: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf',
      accommodations: ['Luxury Villa with Pool'],
      courses: ['Golfing Lessons'],
      services: ['Butler Service'],
      experiences: ['Wine Tasting'],
      description: 'Experience luxury living in our premier villa.',
      order: 2
    },
    {
      name: 'BY THE SEA',
      price: '155',
      imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6',
      accommodations: ['Beachfront Cottage'],
      courses: ['Surfing Lessons'],
      services: ['Daily Cleaning'],
      experiences: ['Sunset Cruise'],
      description: 'Coastal relaxation with ocean views and sandy beaches.',
      order: 3
    },
    {
      name: 'COUNTRY SIDE GLAMOUR',
      price: '186',
      imageUrl: 'https://images.unsplash.com/photo-1553653924-39b70295f8da',
      accommodations: ['Country Estate'],
      courses: ['Horseback Riding'],
      services: ['Farm-to-Table Meals'],
      experiences: ['Wine Tour'],
      description: 'Rural elegance with breathtaking countryside views.',
      order: 4
    },
    {
      name: 'LUXURY FAIRWAYS',
      price: '976',
      imageUrl: 'https://images.unsplash.com/photo-1545486332-9e0999c535b2',
      accommodations: ['Golf Resort Suite'],
      courses: ['Premium Golf Course Access'],
      services: ['Personal Golf Cart'],
      experiences: ['Pro Training Session'],
      description: 'The ultimate luxury golf experience at world-class fairways.',
      order: 5
    }
  ];

  const checkExistingPacks = async () => {
    setLoading(true);
    try {
      const packsRef = collection(db, 'packs');
      const q = query(packsRef, orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const packList = [];
      querySnapshot.forEach((doc) => {
        packList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setExistingPacks(packList);
    } catch (error) {
      console.error("Error checking existing packs:", error);
      setMessage('Error checking existing packs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addSamplePacks = async () => {
    setLoading(true);
    setMessage('');
    try {
      const packsCollection = collection(db, "packs");
      
      for (const pack of samplePacks) {
        await addDoc(packsCollection, pack);
      }
      
      setMessage('Sample packs added successfully!');
      // Check for packs again after adding samples
      checkExistingPacks();
    } catch (error) {
      console.error("Error adding sample packs:", error);
      setMessage('Error adding sample packs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <h1>Add Sample Packs</h1>
      <p>This tool allows administrators to add sample packs to the database for demonstration purposes.</p>
      
      <div className="admin-actions">
        <button
          className="admin-action-btn"
          onClick={checkExistingPacks}
          disabled={loading}
        >
          Check Existing Packs
        </button>
        
        <button
          className="admin-action-btn"
          onClick={addSamplePacks}
          disabled={loading}
          style={{ marginLeft: '10px' }}
        >
          Add Sample Packs
        </button>
      </div>
      
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Processing...</p>
        </div>
      )}
      
      {message && (
        <div className="message-container" style={{ marginTop: '20px', padding: '10px', backgroundColor: message.includes('Error') ? '#ffe6e6' : '#e6ffe6', borderRadius: '4px' }}>
          <p>{message}</p>
        </div>
      )}
      
      {existingPacks !== null && (
        <div className="existing-packs" style={{ marginTop: '30px' }}>
          <h2>Existing Packs ({existingPacks.length})</h2>
          
          {existingPacks.length === 0 ? (
            <p>No packs found in the database.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Order</th>
                  <th>Price</th>
                  <th>Image</th>
                </tr>
              </thead>
              <tbody>
                {existingPacks.map(pack => (
                  <tr key={pack.id}>
                    <td>{pack.name}</td>
                    <td>{pack.order}</td>
                    <td>€{pack.price}</td>
                    <td>
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
                        />
                      ) : (
                        'No Image'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      <h2 style={{ marginTop: '30px' }}>Sample Packs Preview</h2>
      <p>The following sample packs will be added to the database:</p>
      
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Order</th>
            <th>Price</th>
            <th>Image</th>
          </tr>
        </thead>
        <tbody>
          {samplePacks.map((pack, index) => (
            <tr key={index}>
              <td>{pack.name}</td>
              <td>{pack.order}</td>
              <td>€{pack.price}</td>
              <td>
                <img 
                  src={pack.imageUrl} 
                  alt={pack.name}
                  style={{ 
                    width: '60px', 
                    height: '40px', 
                    objectFit: 'cover', 
                    borderRadius: '4px' 
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AddSamplePacks; 