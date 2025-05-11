import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../utils/firebaseConfig';
import { collection, query, getDocs } from 'firebase/firestore';
import '../../components/admin/Admin.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    courses: 0,
    experiences: 0,
    accommodations: 0,
    packs: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Dashboard: Fetching collection statistics...");
        // Fetch counts from each collection
        const collections = ['courses', 'experiences', 'accommodations', 'packs'];
        const counts = {
          courses: 0,
          experiences: 0,
          accommodations: 0,
          packs: 0
        };
        
        for (const collName of collections) {
          console.log(`Dashboard: Fetching ${collName} count...`);
          try {
            const q = query(collection(db, collName));
            const snapshot = await getDocs(q);
            counts[collName] = snapshot.size;
            console.log(`Dashboard: Found ${snapshot.size} ${collName}`);
          } catch (collError) {
            console.error(`Dashboard: Error fetching ${collName}:`, collError);
            // Continue with other collections even if one fails
          }
        }
        
        console.log("Dashboard: Final counts:", counts);
        setStats(counts);
      } catch (error) {
        console.error("Dashboard: Error fetching stats:", error);
        setError("Failed to load dashboard statistics. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, []);

  return (
    <>
      <div className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Loading statistics...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ display: 'block', margin: '10px auto', padding: '8px 16px' }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
            <div style={{ 
              flex: '1 1 300px', 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              padding: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center' 
            }}>
              <div style={{ marginBottom: '15px' }}>
                <span role="img" aria-label="Golf" style={{ 
                  fontSize: '24px', 
                  backgroundColor: '#e8f5e9', 
                  borderRadius: '50%', 
                  padding: '10px',
                  display: 'inline-block'
                }}>
                  🏌️
                </span>
              </div>
              <h2 style={{ fontSize: '42px', margin: '10px 0' }}>{stats.courses}</h2>
              <Link to="/admin/courses" style={{ 
                color: '#186d00', 
                textDecoration: 'none', 
                fontWeight: 'bold',
                marginTop: 'auto'
              }}>
                Manage Courses
              </Link>
            </div>
            
            <div style={{ 
              flex: '1 1 300px', 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              padding: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center' 
            }}>
              <div style={{ marginBottom: '15px' }}>
                <span role="img" aria-label="Experience" style={{ 
                  fontSize: '24px', 
                  backgroundColor: '#fff8e1', 
                  borderRadius: '50%', 
                  padding: '10px',
                  display: 'inline-block'
                }}>
                  🗺️
                </span>
              </div>
              <h2 style={{ fontSize: '42px', margin: '10px 0' }}>{stats.experiences}</h2>
              <Link to="/admin/experiences" style={{ 
                color: '#186d00', 
                textDecoration: 'none', 
                fontWeight: 'bold',
                marginTop: 'auto'
              }}>
                Manage Experiences
              </Link>
            </div>
            
            <div style={{ 
              flex: '1 1 300px', 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              padding: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center' 
            }}>
              <div style={{ marginBottom: '15px' }}>
                <span role="img" aria-label="Accommodation" style={{ 
                  fontSize: '24px', 
                  backgroundColor: '#e3f2fd', 
                  borderRadius: '50%', 
                  padding: '10px',
                  display: 'inline-block'
                }}>
                  🏠
                </span>
              </div>
              <h2 style={{ fontSize: '42px', margin: '10px 0' }}>{stats.accommodations}</h2>
              <Link to="/admin/accommodations" style={{ 
                color: '#186d00', 
                textDecoration: 'none', 
                fontWeight: 'bold',
                marginTop: 'auto'
              }}>
                Manage Accommodations
              </Link>
            </div>
            
            <div style={{ 
              flex: '1 1 300px', 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              padding: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center' 
            }}>
              <div style={{ marginBottom: '15px' }}>
                <span role="img" aria-label="Pack" style={{ 
                  fontSize: '24px', 
                  backgroundColor: '#f3e5f5', 
                  borderRadius: '50%', 
                  padding: '10px',
                  display: 'inline-block'
                }}>
                  📦
                </span>
              </div>
              <h2 style={{ fontSize: '42px', margin: '10px 0' }}>{stats.packs}</h2>
              <Link to="/admin/packs" style={{ 
                color: '#186d00', 
                textDecoration: 'none', 
                fontWeight: 'bold',
                marginTop: 'auto'
              }}>
                Manage Packs
              </Link>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            padding: '20px',
            marginTop: '20px'
          }}>
            <h2 style={{ marginBottom: '20px' }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
              <Link to="/admin/courses/new" style={{ 
                flex: '1 1 200px',
                backgroundColor: 'white',
                border: '1px solid #eee',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                textDecoration: 'none',
                color: '#333',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}>
                <span style={{ fontSize: '24px', marginBottom: '10px' }}>➕</span>
                <span>Add New Course</span>
              </Link>
              
              <Link to="/admin/experiences/new" style={{ 
                flex: '1 1 200px',
                backgroundColor: 'white',
                border: '1px solid #eee',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                textDecoration: 'none',
                color: '#333',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}>
                <span style={{ fontSize: '24px', marginBottom: '10px' }}>➕</span>
                <span>Add New Experience</span>
              </Link>
              
              <Link to="/admin/accommodations/new" style={{ 
                flex: '1 1 200px',
                backgroundColor: 'white',
                border: '1px solid #eee',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                textDecoration: 'none',
                color: '#333',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}>
                <span style={{ fontSize: '24px', marginBottom: '10px' }}>➕</span>
                <span>Add New Accommodation</span>
              </Link>
              
              <Link to="/admin/packs/new" style={{ 
                flex: '1 1 200px',
                backgroundColor: 'white',
                border: '1px solid #eee',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                textDecoration: 'none',
                color: '#333',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}>
                <span style={{ fontSize: '24px', marginBottom: '10px' }}>➕</span>
                <span>Add New Pack</span>
              </Link>
              
              <Link to="/admin/settings" style={{ 
                flex: '1 1 200px',
                backgroundColor: 'white',
                border: '1px solid #eee',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                textDecoration: 'none',
                color: '#333',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}>
                <span style={{ fontSize: '24px', marginBottom: '10px' }}>⚙️</span>
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
} 